#!/bin/sh

helm uninstall allaboutsecurity -n allaboutsecurity

kubectl delete ingress.networking.k8s.io/allaboutsecurity -n allaboutsecurity

kubectl delete namespace/allaboutsecurity
