#!/bin/bash

# Pre-requisite: add the following repo
# helm repo add jetstack https://charts.jetstack.io

helm install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace -f deployment.yaml

kubectl apply -f secrets.yaml

sleep 10
kubectl apply -f issuer.yaml
