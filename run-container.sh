#!/bin/bash
INTERNAL_PORT=3000
EXTERNAL_PORT=${PORT:-5000}
echo "Starting user service container at localhost:"${EXTERNAL_PORT}
docker run -d --rm -p ${EXTERNAL_PORT}:${INTERNAL_PORT} --env-file=.env -e USERSERVICE_PORT=${INTERNAL_PORT} -e DB_HOST="host.docker.internal" --name user-service-container user-service