#!/bin/sh

helm uninstall gaps

kubectl delete ingressroute.traefik.containo.us/gaps
