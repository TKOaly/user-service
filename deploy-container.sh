#!/bin/bash
echo "Pushing container image to registry.tko-aly.fi"
echo $DEPLOY_PASSWORD | docker login registry.tko-aly.fi -u $DEPLOY_USERNAME --password-stdin
docker build . -t user-service --shm-size 1G
docker tag user-service:latest registry.tko-aly.fi/user-service:latest
docker push registry.tko-aly.fi/user-service:latest