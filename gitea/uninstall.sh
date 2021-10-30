#!/bin/sh

helm uninstall gitea -n gitea

kubectl delete secret/gitea-admin-credentials -n gitea
