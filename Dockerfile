FROM node:12.17.0-alpine

WORKDIR /app

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python git \
  chromium chromium-chromedriver

COPY package*.json /app/
RUN npm install --development

COPY . /app/

EXPOSE 3001

CMD ["npm", "start"]
