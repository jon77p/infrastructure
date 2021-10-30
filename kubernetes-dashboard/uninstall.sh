#!/bin/sh

helm uninstall kubernetes-dashboard -n kubernetes-dashboard

kubectl delete ingress.networking.k8s.io/kubernetesdashboard -n kubernetes-dashboard

kubectl delete namespace/kubernetes-dashboard
