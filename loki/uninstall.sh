#!/bin/sh

helm uninstall loki -n loki

kubectl delete secrets/loki-admin -n loki
kubectl delete namespace/loki
