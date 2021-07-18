#!/bin/bash

# Pre-requisite: add the following repo
# helm repo add traefik https://helm.traefik.io/traefik

helm install traefik traefik/traefik -f deployment-traefik.yaml
kubectl apply -f deployment-whoami.yaml

kubectl apply -f secrets.yaml
kubectl apply -f config.yaml
kubectl apply -f services.yaml
kubectl apply -f ingress.yaml
