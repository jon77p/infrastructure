#!/bin/bash

# Pre-requisite: add the following repo
# helm repo add kubernetes-dashboard https://kubernetes.github.io/dashboard/

kubectl apply -f namespace.yaml

helm install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard --namespace kubernetes-dashboard -f values.yaml

kubectl create --save-config -f ingress.yaml
