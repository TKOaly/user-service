FROM node:10.16.2-alpine

ENV YARN_CACHE_FOLDER=/dev/shm/yarn-cache

WORKDIR /app

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python git \
  chromium chromium-chromedriver

RUN npm install --global yarn@1.10.1

COPY yarn.lock package.json /app/
RUN yarn --dev --frozen-lockfile

COPY . /app/

CMD ["yarn", "start"]
