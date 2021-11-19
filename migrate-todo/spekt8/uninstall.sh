#!/bin/sh

kubectl delete deployment.apps/spekt8 -n spekt8

kubectl delete service/spekt8 -n spekt8
kubectl delete ingress.networking.k8s.io/spekt8 -n spekt8
kubectl delete clusterrolebinding.rbac.authorization.k8s.io/fabric8-rbac -n spekt8

kubectl delete namespace/spekt8
