#!/bin/bash

kubectl delete deployment.apps/cloudflared
kubectl delete configmap/cloudflared-config
kubectl delete configmap/cloudflared-credentials
kubectl delete secret/cloudflared-origin-cert
