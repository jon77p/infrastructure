#!/bin/sh

helm uninstall promtail -n promtail

kubectl delete namespace/promtail
