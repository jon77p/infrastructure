#!/bin/bash

# Pre-requisite: add the following repo
# helm repo add k8s-at-home https://k8s-at-home.com/charts/

kubectl apply -f namespace.yaml
kubectl apply -f config.yaml

helm install home-assistant k8s-at-home/home-assistant -n homeassistant -f values.yaml

kubectl create --save-config -f ingress.yaml
