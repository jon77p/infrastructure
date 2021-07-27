#!/bin/bash

# Pre-requisite: add the following repo
# helm repo add hub https://helm.traefik.io/hub

kubectl apply -f namespace.yaml

helm install hub-agent hub/hub -n hub-agent -f secrets.yaml
