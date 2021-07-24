#!/bin/bash

# Pre-requisite: copy traefik-config.yaml to /var/lib/rancher/k3s/server/manifests/traefik-config.yaml on main node

kubectl apply -f namespaces.yaml

kubectl apply -f deployment-whoami.yaml

kubectl apply -f services.yaml
kubectl apply -f ingress.yaml
