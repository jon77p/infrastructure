#!/bin/sh

kubectl delete clusterissuer.cert-manager.io/cloudflare-issuer -n cert-manager
helm uninstall cert-manager -n cert-manager

kubectl delete secret/cloudflare-api-token -n cert-manager

kubectl delete namespace/cert-manager
