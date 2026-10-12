import json
import os
import pathlib
import re

os.umask(0o077)
root = pathlib.Path('deployment')
root.mkdir(mode=0o700, exist_ok=True)
environment = {
    name.removeprefix('APP_'): value
    for name, value in os.environ.items()
    if name.startswith('APP_') and value != ''
}
required = ['API_IMAGE', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB', 'POSTGRES_VOLUME',
            'DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'OTP_HMAC_SECRET']
for name in required:
    if not environment.get(name):
        raise ValueError(f'Missing deployment value: {name}')
if not re.fullmatch(r'/[a-zA-Z0-9_./-]+', os.environ['DEPLOY_PATH']):
    raise ValueError('DEPLOY_PATH must be an absolute path without spaces or shell characters')
config = {
    'environment': environment,
    'project_name': os.environ['COMPOSE_PROJECT_NAME'],
    'api_container': 'mediconnect-api',
    'postgres_container': 'mediconnect-postgres',
    'health_url': 'http://127.0.0.1:4000/api/v1/health-check',
}
(root / 'deployment-env.json').write_text(json.dumps(config))
ssh_root = pathlib.Path.home() / '.ssh'
ssh_root.mkdir(mode=0o700, exist_ok=True)
key = ssh_root / 'deploy-key'
key.write_text(os.environ['SSH_KEY'].replace('\r\n', '\n').rstrip() + '\n')
key.chmod(0o600)
(ssh_root / 'known_hosts').write_text(os.environ['SSH_KNOWN_HOSTS'].rstrip() + '\n')
print('Đã chuẩn bị cấu hình deploy và SSH; không ghi secrets ra log.')
