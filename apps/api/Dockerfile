FROM node:24-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app

FROM base AS pruner
RUN npm install --global turbo@2.11.2 --no-audit --no-fund
COPY . .
RUN turbo prune api --docker

FROM base AS dependencies
COPY --from=pruner /app/out/json/ .
RUN npm ci --no-audit --no-fund && npm cache clean --force

FROM dependencies AS build
COPY --from=pruner /app/out/full/ .
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build \
    npx turbo run build --filter=api
RUN mkdir -p packages \
    && find apps packages -type d -name node_modules -prune -exec rm -rf '{}' +

FROM base AS production-dependencies
COPY --from=pruner /app/out/json/ .
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

FROM base AS runtime
ENV NODE_ENV=production PORT=4000
COPY --from=production-dependencies --chown=node:node /app/ ./
COPY --from=build --chown=node:node /app/apps/ ./apps/
COPY --from=build --chown=node:node /app/packages/ ./packages/
WORKDIR /app/apps/api
RUN sed -i 's/\r$//' deploy/docker-entrypoint.sh
USER node
EXPOSE 4000
CMD ["sh", "deploy/docker-entrypoint.sh"]
