#!/bin/bash

# Pre-requisite: add the following repos
# helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
# helm repo add kube-state-metrics https://kubernetes.github.io/kube-state-metrics

kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml
kubectl apply -f config.yaml

helm install prometheus prometheus-community/prometheus -n prometheus -f values.yaml

kubectl apply -f ingress.yaml
