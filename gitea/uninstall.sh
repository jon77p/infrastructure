#!/bin/sh

helm uninstall gitea

kubectl delete ingressroute.traefik.containo.us/gitea-http
kubectl delete secret/gitea-admin-credentials
