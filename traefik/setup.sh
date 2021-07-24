#!/bin/bash

# Pre-requisite: add the following repo
# helm repo add traefik https://helm.traefik.io/traefik

kubectl create --save-config -f definitions.yaml
kubectl create --save-config -f services.yaml

helm install traefik traefik/traefik -f deployment-traefik.yaml
kubectl apply -f deployment-whoami.yaml

kubectl apply -f secrets.yaml
kubectl apply -f config.yaml
kubectl create --save-config -f ingress.yaml
