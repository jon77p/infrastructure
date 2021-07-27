#!/bin/sh

helm uninstall influxdb -n influxdb

kubectl delete secrets/influxdb-admin -n influxdb
kubectl delete namespace/influxdb
