#!/bin/bash

# Pre-requisite: add the following repo
# helm repo add bitnami https://charts.bitnami.com/bitnami

kubectl apply -f secrets.yaml

helm install allaboutsecurity bitnami/ghost -f values.yaml

kubectl create --save-config -f ingress.yaml
