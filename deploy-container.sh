#!/bin/bash
set -e
TAG=$TRAVIS_COMMIT
echo "Building Docker image..."
echo docker login https://registry.tko-aly.fi -u $DEPLOY_USERNAME -p $DEPLOY_PASSWORD
docker build . -t user-service --shm-size 1G
docker tag user-service:latest https://registry.tko-aly.fi/user-service:latest
docker tag user-service:latest https://registry.tko-aly.fi/user-service:$TAG
echo "Pushing image to registry..."
docker push https://registry.tko-aly.fi/user-service:latest
docker push https://registry.tko-aly.fi/user-service:$TAG
echo "Image: registry.tko-aly.fi/user-service:$TAG"

echo "Deploying to staging..."
curl -XPOST http://uolevi.tko-aly.fi:9000/api/webhooks/6217411b-201c-42e7-b743-e0e07af39d07
echo "OK"