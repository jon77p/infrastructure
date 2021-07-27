#!/bin/sh

helm uninstall node-red -n node-red

kubectl delete namespaces/node-red
