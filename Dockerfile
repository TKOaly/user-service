FROM node:10.8-alpine

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python

RUN npm install --global yarn@1.7.0

WORKDIR /app
COPY yarn.lock ./
COPY package.json ./
RUN yarn --dev

COPY knexfile.ts ./
COPY nodemon.json ./
COPY tsconfig.json ./
COPY seeds ./seeds
COPY migrations ./migrations
COPY src ./src
COPY test ./test
COPY views ./views
COPY scripts ./scripts
COPY public ./public
COPY scss ./scss
COPY locales ./locales

CMD ["yarn", "start"]