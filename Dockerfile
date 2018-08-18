FROM node:10.8-alpine

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python

RUN npm install --global yarn@1.7.0

WORKDIR /app
COPY yarn.lock /app
COPY package.json /app
RUN yarn --dev

COPY knexfile.ts /app
COPY nodemon.json /app
COPY tsconfig.json /app
COPY seeds /app/seeds
COPY migrations /app/migrations
COPY src /app/src
COPY test /app/test
COPY views /app/views
COPY scripts /app/scripts
COPY public /app/public

CMD ["yarn", "start"]