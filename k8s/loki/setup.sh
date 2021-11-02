#!/bin/bash

# Pre-requisite: add the following repos
# helm repo add grafana https://grafana.github.io/helm-charts

kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml

helm install loki grafana/loki -n loki -f values.yaml
