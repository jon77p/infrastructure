#!/bin/sh

helm uninstall code-server -n code-server

kubectl delete namespace/code-server
