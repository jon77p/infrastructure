#!/bin/sh

helm uninstall traefik
kubectl delete deployment.apps/whoami

kubectl delete secret/cloudflare-credentials
kubectl delete secret/traefik-credentials
kubectl delete configmap/traefik-config
kubectl delete ingressroute.traefik.containo.us/traefik-dashboard
kubectl delete ingressroute.traefik.containo.us/whoami
