#!/bin/bash

# Pre-requisite: add the following repo
# helm repo add cloudflare https://cloudflare.github.io/helm-charts

kubectl apply -f config.yaml
kubectl apply -f secrets.yaml
kubectl apply -f deployment.yaml
