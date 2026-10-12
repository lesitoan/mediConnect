#!/usr/bin/env bash
set -euo pipefail
umask 077

[[ ${DEPLOY_PATH:?} =~ ^/[a-zA-Z0-9_./-]+$ && $DEPLOY_PATH != / ]] || {
  echo 'DEPLOY_PATH must be an absolute directory without spaces or shell characters' >&2
  exit 1
}

appEnv=$(jq -n 'env | with_entries(select(.key | startswith("APP_")) | .key |= ltrimstr("APP_")) | with_entries(select(.value != ""))')
[[ ${APP_API_IMAGE:?} =~ ^ghcr\.io/[a-z0-9._/-]+(:[a-zA-Z0-9_.-]+|@sha256:[a-f0-9]{64})$ ]] || {
  echo 'API_IMAGE must be a GHCR image tag or digest' >&2
  exit 1
}
jq -e '. as $environment |
  all(to_entries[]; (.key | test("^[A-Z][A-Z0-9_]*$")) and (.value | test("[\r\n]") | not))
  and all(["API_IMAGE", "COMPOSE_PROJECT_NAME", "POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB",
           "POSTGRES_VOLUME", "DATABASE_URL", "REDIS_URL", "JWT_SECRET", "OTP_HMAC_SECRET"][];
          $environment[.] | length > 0)
' <<< "$appEnv" > /dev/null || {
  echo 'Missing required APP_ environment value or invalid multiline value' >&2
  exit 1
}

mkdir -p deployment
jq -r 'to_entries[] | "\(.key)=\(.value | @json | gsub("\\$"; "\\$"))"' <<< "$appEnv" > deployment/.env
jq -r 'to_entries[] | select((.key | startswith("POSTGRES_")) | not)
  | select(.key != "API_IMAGE" and .key != "API_PORT" and .key != "COMPOSE_PROJECT_NAME")
  | "\(.key)=\(.value)"' <<< "$appEnv" > deployment/.env.api

mkdir -p "$HOME/.ssh"
printf '%s\n' "${SSH_KEY:?}" | tr -d '\r' > "$HOME/.ssh/deploy-key"
printf '%s\n' "${SSH_KNOWN_HOSTS:?}" > "$HOME/.ssh/known_hosts"
chmod 600 "$HOME/.ssh/deploy-key" deployment/.env deployment/.env.api
echo 'Prepared deployment environment and SSH files'
