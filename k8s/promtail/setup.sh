#!/bin/bash

# Pre-requisite: add the following repos
# helm repo add grafana https://grafana.github.io/helm-charts

kubectl apply -f namespace.yaml

helm install promtail grafana/promtail -n promtail -f values.yaml
