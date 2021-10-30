#!/bin/sh
apt update
apt install -y openssh-server
systemctl enable --now ssh
