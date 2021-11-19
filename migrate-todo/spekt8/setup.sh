#!/bin/bash

kubectl apply -f namespace.yaml
kubectl apply -f deployment.yaml

kubectl apply -f services.yaml
kubectl apply -f ingress.yaml
kubectl apply -f rbac.yaml
