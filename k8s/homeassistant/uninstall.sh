#!/bin/sh

helm uninstall home-assistant -n homeassistant

kubectl delete configmap/homeassistant-config -n homeassistant
kubectl delete ingress.networking.k8s.io/homeassistant -n homeassistant

kubectl delete namespace/homeassistant
