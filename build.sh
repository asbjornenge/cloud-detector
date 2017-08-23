#!/bin/sh
VERSION=$(cat package.json | jq -r .version)
npm run build
docker build -t asbjornenge/cloud-detector:$VERSION .
