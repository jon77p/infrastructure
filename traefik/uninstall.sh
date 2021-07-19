#!/bin/sh

helm uninstall traefik
kubectl delete deployment.apps/whoami

kubectl delete secret/cloudflare-credentials
kubectl delete secret/traefik-credentials
kubectl delete configmap/traefik-config
kubectl delete ingressroute.traefik.containo.us/traefik
kubectl delete ingressroute.traefik.containo.us/whoami

kubectl delete customresourcedefinition.apiextensions.k8s.io/ingressroutes.traefik.containo.us
kubectl delete customresourcedefinition.apiextensions.k8s.io/middlewares.traefik.containo.us
kubectl delete customresourcedefinition.apiextensions.k8s.io/ingressroutetcps.traefik.containo.us
kubectl delete customresourcedefinition.apiextensions.k8s.io/ingressrouteudps.traefik.containo.us
kubectl delete customresourcedefinition.apiextensions.k8s.io/tlsoptions.traefik.containo.us
kubectl delete customresourcedefinition.apiextensions.k8s.io/tlsstores.traefik.containo.us
kubectl delete customresourcedefinition.apiextensions.k8s.io/traefikservices.traefik.containo.us
kubectl delete customresourcedefinition.apiextensions.k8s.io/serverstransports.traefik.containo.us
kubectl delete clusterrole.rbac.authorization.k8s.io/traefik-ingress-controller
kubectl delete clusterrolebinding.rbac.authorization.k8s.io/traefik-ingress-controller
