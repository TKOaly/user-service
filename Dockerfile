FROM node:20.9.0-alpine AS development

WORKDIR /app

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python3 git \
  chromium chromium-chromedriver curl

COPY package*.json /app/
RUN npm install --development

COPY knexfile.ts knex-esm-compat.ts .prettierrc vitest.config.ts .eslintrc.mjs .eslintignore ./
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
CMD ["npm", "run", "watch"]

FROM development AS production

RUN npm run build && \
  npm prune --production

HEALTHCHECK CMD curl -f http://localhost:3030/ping || exit 1

EXPOSE 3001
CMD ["npm", "start"]
