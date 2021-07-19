#!/bin/sh

helm uninstall allaboutsecurity

kubectl delete secret/allaboutsecurity-credentials
kubectl delete ingressroute.traefik.containo.us/allaboutsecurity
