#!/bin/bash

# Pre-requisite: add the following repos
# helm repo add influxdata https://helm.influxdata.com/

kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml

helm install influxdb influxdata/influxdb -n influxdb -f values.yaml
