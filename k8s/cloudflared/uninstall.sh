#!/bin/bash

kubectl delete deployment.apps/cloudflared -n cloudflared
kubectl delete configmap/cloudflared-config -n cloudflared
kubectl delete configmap/cloudflared-credentials -n cloudflared
kubectl delete secret/cloudflared-origin-cert -n cloudflared
kubectl delete namespace/cloudflared
