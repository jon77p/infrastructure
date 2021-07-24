#!/bin/sh

kubectl delete deployment.apps/whoami -n whoami
kubectl delete service/whoami -n whoami
kubectl delete ingress.extensions/whoami -n whoami

kubectl delete namespace/whoami

kubectl delete ingressroute.traefik.containo.us/traefik -n kube-system
