#!/bin/sh

helm uninstall hub -n hub-agent

kubectl delete namespace/hub-agent
