#!/bin/bash
set -e
TAG=$TRAVIS_COMMIT
echo "Pushing container image to registry.tko-aly.fi (tag=$TAG)"
echo $DEPLOY_PASSWORD | docker login registry.tko-aly.fi -u $DEPLOY_USERNAME --password-stdin
docker build . -t user-service --shm-size 1G
docker tag user-service:latest registry.tko-aly.fi/user-service:latest
docker tag user-service:latest registry.tko-aly.fi/user-service:$TAG
docker push registry.tko-aly.fi/user-service:latest
docker push registry.tko-aly.fi/user-service:$TAG

echo "Deploying staging"
echo "Decrypting private key..."
openssl aes-256-cbc -a -d -pass env:DOCKER_KEY_PASSPHRASE -in deploy-keys/key.pem.enc -out deploy-keys/key.pem

export DOCKER_CERT_PATH="deploy-keys"
export DOCKER_TLS=1
export DOCKER_TLS_VERIFY=1
export DOCKER_HOST="uolevi.tko-aly.fi:2376"

docker service update --image registry.tko-aly.fi/user-service:$TAG user-service

echo "Destroying private key..."
rm deploy-keys/key.pem