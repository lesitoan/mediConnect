FROM node:24-bookworm-slim AS base
RUN apt-get update \
    && apt-get install --no-install-recommends -y libgomp1 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS pruner
RUN npm install --global turbo@2.11.2 --no-audit --no-fund
COPY . .
RUN turbo prune ai --docker

FROM base AS dependencies
COPY --from=pruner /app/out/json/ ./
RUN npm ci --workspace=ai --include-workspace-root=false --no-audit --no-fund

FROM dependencies AS build
COPY --from=pruner /app/out/full/ ./
RUN npm run build --workspace=ai
RUN npm run index:knowledge --workspace=ai

FROM base AS production-dependencies
COPY --from=pruner /app/out/json/ ./
RUN npm ci --workspace=ai --include-workspace-root=false --omit=dev --no-audit --no-fund \
    && npm cache clean --force

FROM base AS runtime
ENV NODE_ENV=production PORT=4100 HOST=0.0.0.0
WORKDIR /app
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/ai/package.json ./apps/ai/package.json
COPY --from=build --chown=node:node /app/apps/ai/dist ./apps/ai/dist
COPY --from=build --chown=node:node /app/apps/ai/src/modules/knowledge/data/knowledge.json ./apps/ai/src/modules/knowledge/data/knowledge.json
COPY --from=build --chown=node:node /app/apps/ai/models ./apps/ai/models
COPY --from=build --chown=node:node /app/apps/ai/storage ./apps/ai/storage
WORKDIR /app/apps/ai
USER node
EXPOSE 4100
CMD ["node", "dist/main.js"]
