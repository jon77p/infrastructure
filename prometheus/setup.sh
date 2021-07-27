#!/bin/bash

# Pre-requisite: add the following repos
# helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml
kubectl apply -f config.yaml

helm install prometheus prometheus-community/prometheus -n prometheus -f values.yaml
