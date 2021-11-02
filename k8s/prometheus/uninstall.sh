#!/bin/sh

helm uninstall prometheus -n prometheus

kubectl delete configmap/prometheus-server -n prometheus
kubectl delete secrets/prometheus-creds -n prometheus
kubectl delete namespace/prometheus
