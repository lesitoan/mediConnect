#!/usr/bin/env bash
set -euo pipefail
umask 077

cd -- "${1:?Usage: bash deploy.sh DEPLOY_PATH [true|false]}"
directory=$PWD
shouldBackupDatabase=${2:-true}
[[ $shouldBackupDatabase == true || $shouldBackupDatabase == false ]] || {
  echo 'Backup option must be true or false' >&2
  exit 1
}
compose=(docker compose --env-file "$directory/incoming/.env" -f "$directory/incoming/compose.yml")
config=$("${compose[@]}" config --format json)
project=$(jq -er '.name' <<< "$config")
image=$(jq -er '.services.api.image' <<< "$config")
volume=$(jq -er '.volumes.postgres_data.name' <<< "$config")
postgresId=$("${compose[@]}" ps --all --quiet postgres)
if [[ -z $postgresId ]] || ! docker inspect "$postgresId" | jq -e --arg project "$project" --arg volume "$volume" '
  .[0] | .State.Health.Status == "healthy"
  and .Config.Labels["com.docker.compose.project"] == $project
  and any(.Mounts[]; .Type == "volume" and .Name == $volume)
' > /dev/null; then
  echo 'PostgreSQL must be healthy and use the expected Compose project and volume' >&2
  exit 1
fi

docker pull "$image"
if [[ $shouldBackupDatabase == true ]]; then
  mkdir -p "$directory/backups"
  backupFile="$directory/backups/$(date -u +%Y%m%dT%H%M%S%NZ).dump"
  docker exec "$postgresId" sh -c 'exec pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > "$backupFile.tmp"
  mv -- "$backupFile.tmp" "$backupFile"
  echo 'Database backup completed'
fi

install -m 600 "$directory/incoming/.env" "$directory/.env"
install -m 600 "$directory/incoming/.env.api" "$directory/.env.api"
cp -- "$directory/incoming/compose.yml" "$directory/compose.yml"
compose=(docker compose --env-file "$directory/.env" -f "$directory/compose.yml")
"${compose[@]}" run --rm --no-deps -T migrate
"${compose[@]}" up --detach --no-deps --wait --wait-timeout 180 api
apiId=$("${compose[@]}" ps --quiet api)
docker inspect "$apiId" | jq -e --arg image "$image" '
  .[0] | .Config.Image == $image and .State.Health.Status == "healthy"
' > /dev/null

repository=${image%%@*}
repository=${repository%:*}
currentId=$(docker image inspect "$image" --format '{{.Id}}')
while read -r reference imageId; do
  if [[ $imageId != "$currentId" ]]; then
    docker image rm "$reference" || echo 'Kept an image still used by another container'
  fi
done < <(docker image ls --no-trunc --filter "reference=$repository:*" --format '{{.Repository}}:{{.Tag}} {{.ID}}')
if [[ $shouldBackupDatabase == true ]]; then
  mapfile -t backups < <(find "$directory/backups" -maxdepth 1 -type f -name '*.dump' | sort)
  for ((index = 0; index < ${#backups[@]} - 3; index++)); do
    rm -- "${backups[index]}"
  done
fi
echo "Deployment healthy: $image"
