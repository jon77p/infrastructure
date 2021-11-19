#!/bin/sh

helm uninstall youtubedl

kubectl delete ingressroute.traefik.containo.us/youtubedl
