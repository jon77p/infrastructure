#!/bin/sh

helm uninstall grafana -n grafana

kubectl delete secrets/grafana-admin -n grafana
# kubectl delete namespace/grafana
