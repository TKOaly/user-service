#!/bin/bash
set -x # Show the output of the following commands (useful for debugging)
    
# Import the SSH deployment key
if [ "$1" = “production” ]
then
    openssl aes-256-cbc -K $encrypted_22009518e18d_key -iv $encrypted_22009518e18d_iv -in .travis/deploy-key.enc.prod -out deploy.key -d
else
    openssl aes-256-cbc -K $encrypted_22009518e18d_key -iv $encrypted_22009518e18d_iv -in .travis/deploy-key.enc.staging -out deploy.key -d
fi

rm deploy-key.enc.* # Don't need it anymore
chmod 600 deploy-key
mv deploy-key ~/.ssh/id_rsa

if [ "$1" = “production” ]
then
 ssh ${PROD_SERVER_URL}
else
 ssh ${STAGING_SERVER_URL}
fi

cd /srv/user-service

if [ "$1" = “production” ]
then
 git pull origin master
 git reset --hard origin/master
else
 git pull origin dev
 git reset --hard origin/dev
fi

docker build -t user-service .
docker run -p ${PORT}:${PORT} --env-file=.env -d --name user-service-container user-service