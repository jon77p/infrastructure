#!/bin/bash

# Pre-requisite: add the following repo
# helm repo add gitea-charts https://dl.gitea.io/charts/

kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml

helm install gitea gitea-charts/gitea -n gitea -f values.yaml
