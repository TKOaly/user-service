FROM node:20.16.0-alpine AS development

WORKDIR /app

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python3 git \
  chromium chromium-chromedriver curl

COPY package.json pnpm-lock.yaml /app/

ENV PNPM_HOME="/pnpm"
RUN corepack enable && corepack install
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install

COPY knexfile.ts knex-esm-compat.ts .prettierrc vitest.config.ts eslint.config.mjs ./
COPY ./src /app/src
COPY ./test /app/test
COPY ./views /app/views
COPY ./scss /app/scss
COPY ./public /app/public
COPY ./locales /app/locales
COPY ./seeds /app/seeds
COPY ./migrations /app/migrations
COPY ./scripts /app/scripts

COPY tsconfig.json ./

HEALTHCHECK CMD curl -f http://localhost:3030/ping || exit 1

EXPOSE 3001
CMD ["pnpm", "run", "watch"]

FROM development AS production-builder

RUN pnpm run build && \
  pnpm prune --prod

EXPOSE 3001
CMD ["pnpm", "start"]

FROM node:20.16.0-alpine AS production

WORKDIR /app

COPY --from=development /app/package.json /app/package.json
RUN corepack enable

COPY --from=production-builder /app/node_modules /app/node_modules
COPY --from=production-builder /app/dist /app/dist
COPY --from=production-builder /app/public /app/public

EXPOSE 3001
CMD ["dist/src/index.js"]

HEALTHCHECK CMD curl -f http://localhost:3030/ping || exit 1
