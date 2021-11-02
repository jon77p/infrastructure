#!/bin/bash

# Pre-requisite: add the following repo
# helm repo add k8s-at-home https://k8s-at-home.com/charts/

kubectl apply -f namespace.yaml

helm install gaps k8s-at-home/gaps -n gaps -f values.yaml
