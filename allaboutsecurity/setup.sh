#!/bin/bash

# Pre-requisite: add the following repo
# helm repo add groundhog2k https://groundhog2k.github.io/helm-charts/

kubectl apply -f namespace.yaml

helm install allaboutsecurity groundhog2k/ghost --namespace allaboutsecurity -f values.yaml

kubectl create --save-config -f ingress.yaml
