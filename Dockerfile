FROM node:12.17.0-alpine

ENV YARN_CACHE_FOLDER=/dev/shm/yarn-cache

WORKDIR /app

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python git \
  chromium chromium-chromedriver

COPY yarn.lock package.json /app/
RUN yarn --dev --frozen-lockfile

COPY . /app/

EXPOSE 3001

CMD ["yarn", "start"]
