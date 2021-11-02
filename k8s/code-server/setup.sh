#!/bin/bash

# Pre-requisite: run `git submodule init; git submodule update`

kubectl apply -f namespace.yaml

helm install code-server ./code-server/ci/helm-chart -n code-server -f values.yaml
