# Troubleshooting
## Permissions issues:
Grafana volumes need to be mounted with user id `472` and group root or group id `0`.
* `sudo chmod -R 472:root /mnt/grafana`
