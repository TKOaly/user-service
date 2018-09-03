#!/bin/bash
echo "Pushing container image to registry.tko-aly.fi"
source .env.deploy
echo $DEPLOY_PASSWORD | docker login registry.tko-aly.fi -u $DEPLOY_USERNAME --password-stdin
docker build . -t user-service
docker tag user-service registry.tko-aly.fi/user-service
docker push registry.tko-aly.fi/user-service