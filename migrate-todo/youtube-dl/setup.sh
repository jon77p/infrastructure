#!/bin/bash

# Pre-requisite: add the following repo
# helm repo add k8s-at-home https://k8s-at-home.com/charts/

helm install youtubedl k8s-at-home/youtubedl-material -f values.yaml

kubectl apply -f ingress.yaml
