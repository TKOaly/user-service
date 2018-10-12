FROM node:10.8-alpine

WORKDIR /app

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python \
  chromium chromium-chromedriver

RUN npm install --global yarn@1.7.0

COPY yarn.lock package.json /app/
RUN yarn --dev

COPY . /app/

CMD ["yarn", "start"]