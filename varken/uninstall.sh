#!/bin/bash

kubectl delete deployment.apps/varken -n varken
kubectl delete configmap/varken-config -n varken
kubectl delete namespace/varken
