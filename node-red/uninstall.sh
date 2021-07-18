#!/bin/sh

helm uninstall node-red

kubectl delete ingressroute.traefik.containo.us/node-red
