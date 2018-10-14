#!/bin/bash
set -e
echo "Pushing container image to registry.tko-aly.fi"
echo $DEPLOY_PASSWORD | docker login registry.tko-aly.fi -u $DEPLOY_USERNAME --password-stdin
docker build . -t user-service --shm-size 1G
docker tag user-service:latest registry.tko-aly.fi/user-service:latest
docker push registry.tko-aly.fi/user-service:latest

echo "Deploying staging"
echo "Decrypting private key..."
openssl aes256-cbc -a -d -pass env:DOCKER_KEY_PASSPHRASE -in deploy-keys/key.pem.enc -out deploy-keys/key.pem

DOCKER_CERT_PATH="deploy-keys"
DOCKER_TLS=1
DOCKER_TLS_VERIFY=1
DOCKER_HOST="uolevi.tko-aly.fi:2376"

docker service ls

echo "Destroying private key..."
rm deploy-keys/key.pem