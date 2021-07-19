#!/bin/bash

# Pre-requisite: add the following repo
# helm repo add gitea-charts https://dl.gitea.io/charts/

kubectl apply -f secrets.yaml

helm install gitea gitea-charts/gitea -f values.yaml

kubectl apply -f ingress.yaml
