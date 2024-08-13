FROM node:20.16.0-alpine AS development

WORKDIR /app

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python3 git \
  chromium chromium-chromedriver curl

COPY package.json pnpm-lock.yaml /app/
RUN pnpm install

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

FROM development AS production

RUN pnpm run build && \
  pnpm prune --prod

HEALTHCHECK CMD curl -f http://localhost:3030/ping || exit 1

EXPOSE 3001
CMD ["pnpm", "start"]
