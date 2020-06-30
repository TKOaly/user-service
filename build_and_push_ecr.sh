#!/bin/bash

echo "Installing awscli tools"
pip install awscli
export PATH=$PATH:$HOME/.local/bin

echo "Building and tagging docker image"
docker build --shm-size 512M -t user-service .
docker tag user-service:latest $AWS_ECR_URL/user-service:latest

echo "Logging into ecr"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ECR_URL

echo "Pushing image to ecr"
docker push $AWS_ECR_URL/user-service:latest