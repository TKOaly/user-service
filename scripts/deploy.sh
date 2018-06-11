#!/bin/bash
echo "=== User service deployment script ==="
    
# Import the SSH deployment key
if [ "$1" = "production" ]
then
    echo "Decrypting production environment SSH key"
    openssl aes-256-cbc -K $encrypted_26418d32bdf1_key -iv $encrypted_26418d32bdf1_iv -in .travis/deploy-key.enc.prod -out deploy.key -d
else
    echo "Decrypting staging environment SSH key"
    openssl aes-256-cbc -K $encrypted_22009518e18d_key -iv $encrypted_22009518e18d_iv -in .travis/deploy-key.enc.staging -out deploy.key -d
fi

echo "Setting up SSH key"
rm deploy-key.enc.* # Don't need it anymore
chmod 600 deploy-key
mv deploy-key ~/.ssh/id_rsa

echo "Starting SSH connection"
if [ "$1" = "production" ]
then
    echo "Connecting to production server"
    ssh ${PROD_SERVER_URL}
else
    echo "Connecting to staging server"
    ssh ${STAGING_SERVER_URL}
fi

cd /srv/user-service

if [ "$1" = "production" ]
then
    echo "Pulling latest code from master branch"
    git pull origin master
    git reset --hard origin/master
else
    echo "Pulling latest code from dev branch"
    git pull origin dev
    git reset --hard origin/dev
fi

echo "Building docker image"
docker build -t user-service .

echo "Starting docker image"
docker run -p ${PORT}:${PORT} --env-file=.env -d --name user-service-container user-service