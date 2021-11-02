#!/bin/bash

# Pre-requisite: add the following repos
# helm repo add grafana https://grafana.github.io/helm-charts

kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml

helm install grafana grafana/grafana -n grafana -f values.yaml
