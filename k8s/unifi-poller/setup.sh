#!/bin/bash

# Pre-requisite: add the following repo
# helm repo add k8s-at-home https://k8s-at-home.com/charts/

helm install unifi-poller k8s-at-home/gaps -f values.yaml
