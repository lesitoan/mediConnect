import argparse
import datetime
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import urllib.request


def run(*args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def inspect(container):
    return json.loads(run('docker', 'inspect', container, capture_output=True, text=True).stdout)[0]


def write_environment(root, environment):
    for name, value in environment.items():
        if not re.fullmatch(r'[A-Z][A-Z0-9_]*', name) or '\n' in value or '\r' in value:
            raise ValueError('Deployment environment must contain single-line values')
    def quoted(value):
        return json.dumps(value, ensure_ascii=False).replace('$', r'\$')
    (root / '.env').write_text(''.join(f'{name}={quoted(value)}\n' for name, value in environment.items()))
    (root / '.env.api').write_text(''.join(f'{name}={value}\n' for name, value in environment.items()
                                        if not name.startswith('POSTGRES_')))
    (root / '.env').chmod(0o600)
    (root / '.env.api').chmod(0o600)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--directory', required=True)
    args = parser.parse_args()
    root = pathlib.Path(args.directory).resolve()
    incoming = root / 'incoming'
    os.umask(0o077)
    config = json.loads((incoming / 'deployment-env.json').read_text())
    environment = config['environment']
    image = environment['API_IMAGE']
    if not re.fullmatch(r'ghcr\.io/[a-z0-9._/-]+(?::[a-zA-Z0-9_.-]+|@sha256:[a-f0-9]{64})', image):
        raise ValueError('API_IMAGE must be a GHCR image tag or digest')
    project = config['project_name']
    if not re.fullmatch(r'[a-z0-9][a-z0-9_-]*', project):
        raise ValueError('Invalid Compose project name')
    database = inspect(config['postgres_container'])
    if database['State'].get('Health', {}).get('Status') != 'healthy':
        raise RuntimeError('Existing PostgreSQL container must be healthy')
    if database['Config']['Labels'].get('com.docker.compose.project') != project:
        raise ValueError('Compose project does not match the existing database')
    volumes = {mount.get('Name') for mount in database['Mounts'] if mount['Type'] == 'volume'}
    if environment['POSTGRES_VOLUME'] not in volumes:
        raise ValueError('POSTGRES_VOLUME does not match the existing database volume')
    compose = ['docker', 'compose', '--project-name', project, '--env-file', str(root / '.env'),
               '-f', str(root / 'compose.yml')]
    files = ['compose.yml', '.env', '.env.api', 'nginx.conf']
    if any(not (root / name).is_file() for name in files):
        raise RuntimeError('Existing deployment must be initialized before CD')
    backup = root / 'backups' / datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    backup.mkdir(parents=True, mode=0o700)
    for name in files:
        shutil.copy2(root / name, backup / name)
    print('Pull image mới', flush=True)
    run('docker', 'pull', image)
    print('Backup database trước migration', flush=True)
    with (backup / 'database.dump').open('wb') as output:
        run('docker', 'exec', config['postgres_container'], 'pg_dump', '-Fc',
            '-U', environment['POSTGRES_USER'], '-d', environment['POSTGRES_DB'], stdout=output)
    has_started_api = False
    try:
        shutil.copy2(incoming / 'compose.yml', root / 'compose.yml')
        write_environment(root, environment)
        run(*compose, 'config', '--quiet')
        print('Chạy migration bằng image mới', flush=True)
        run(*compose, 'run', '--rm', '--no-deps', '-T', 'migrate')
        print('Chạy seed bằng image mới', flush=True)
        run(*compose, 'run', '--rm', '--no-deps', '-T', 'seed')
        print('Cập nhật API bằng Docker Compose', flush=True)
        has_started_api = True
        run(*compose, 'up', '--detach', '--no-deps', '--wait', '--wait-timeout', '180', 'api')
        api = inspect(config['api_container'])
        if api['Config']['Image'] != image or api['State'].get('Health', {}).get('Status') != 'healthy':
            raise RuntimeError('API mới không healthy')
        with urllib.request.urlopen(config['health_url'], timeout=10) as response:
            if json.load(response).get('success') is not True:
                raise RuntimeError('API health check failed')
        nginx_config = (incoming / 'nginx.conf').read_text().replace('__DEPLOY_PATH__', str(root))
        (root / 'nginx.conf').write_text(nginx_config)
        run('sudo', 'install', '-m', '644', str(root / 'nginx.conf'),
            '/etc/nginx/sites-available/mediconnect-api')
        run('sudo', 'nginx', '-t')
        run('sudo', 'systemctl', 'reload', 'nginx')
        run('curl', '--fail', '--silent', '--show-error', '--cacert', str(root / 'origin-ca.pem'),
            '--resolve', 'api.mediconnect.io.vn:443:127.0.0.1',
            'https://api.mediconnect.io.vn/api/v1/health-check')
    except Exception:
        print('Deploy thất bại; khôi phục cấu hình trước đó. Migration đã chạy không tự lùi.', flush=True)
        for name in files:
            shutil.copy2(backup / name, root / name)
        if has_started_api:
            run(*compose, 'up', '--detach', '--no-deps', '--wait', '--wait-timeout', '180', 'api')
        run('sudo', 'install', '-m', '644', str(root / 'nginx.conf'),
            '/etc/nginx/sites-available/mediconnect-api')
        run('sudo', 'nginx', '-t')
        run('sudo', 'systemctl', 'reload', 'nginx')
        raise

    (root / 'current-image.txt').write_text(image)
    print('\nAPI healthy; dọn các image API cũ trên server', flush=True)
    repository = re.split(r'[:@]', image)[0]
    current_id = run('docker', 'image', 'inspect', image, '--format', '{{.Id}}',
                     capture_output=True, text=True).stdout.strip()
    rows = run('docker', 'image', 'ls', '--no-trunc', '--format', '{{.Repository}} {{.Tag}} {{.ID}}',
               capture_output=True, text=True).stdout.splitlines()
    for row in rows:
        name, tag, image_id = row.split()
        if name in (repository, 'mediconnect-api') and tag != '<none>' and image_id != current_id:
            result = subprocess.run(['docker', 'image', 'rm', f'{name}:{tag}'], capture_output=True, text=True)
            print('Đã xóa image API cũ' if result.returncode == 0 else 'Giữ image còn được container khác sử dụng')
    backups = sorted(path for path in (root / 'backups').iterdir() if path.is_dir())
    for old in backups[:-3]:
        shutil.rmtree(old)
    print('Deploy hoàn tất', flush=True)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(f'Deploy thất bại: {type(error).__name__}', file=sys.stderr)
        sys.exit(1)
