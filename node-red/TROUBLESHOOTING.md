# Troubleshooting
## Permissions issues:
Node-Red volumes need to be mounted with user id `1000` and group id `1000`.
* `sudo chmod -R 1000:1000 /mnt/nodered/data`
