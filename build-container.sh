#!/bin/bash
echo "Building user service container"
docker build . -t user-service