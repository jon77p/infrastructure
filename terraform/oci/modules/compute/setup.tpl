#!/bin/sh

ARCH="$(uname -m)"

if [ $ARCH = "aarch64" ]; then
  # Install and setup Cloudflare Tunnel for ARM
  curl https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -L -o /tmp/init-cloudflared_arm64.deb
  sudo apt install -y /tmp/init-cloudflared_arm64.deb
else
  # Install and setup Cloudflare Tunnel from repo
  echo 'deb http://pkg.cloudflare.com/ focal main' | sudo tee /etc/apt/sources.list.d/cloudflare-main.list
  curl -C - https://pkg.cloudflare.com/pubkey.gpg | sudo apt-key add -
  sudo apt-get update -y
  sudo apt install -y cloudflared
fi

# A root directory is first created before we can install the tunnel as a system service
cd /root
sudo mkdir /root/.cloudflared
sudo touch /root/.cloudflared/cert.json
sudo touch /root/.cloudflared/config.yml
# Another herefile is used to dynamically populate the JSON credentials file
sudo cat > /root/.cloudflared/cert.json << "EOF"
{
    "AccountTag"   : "${cf_account}",
    "TunnelID"     : "${cf_tunnel_id}",
    "TunnelName"   : "${cf_tunnel_name}",
    "TunnelSecret" : "${cf_tunnel_secret}"
}
EOF
# Same concept with the Ingress Rules the tunnel will use
sudo cat > /root/.cloudflared/config.yml << "EOF"
tunnel: ${cf_tunnel_id}
credentials-file: /etc/cloudflared/cert.json
warp-routing:
  enabled: true
logfile: /var/log/cloudflared.log
loglevel: info
metrics: localhost:2000

ingress:
  - hostname: ${ssh_subdomain}
    service: ssh://${hostname}:22
  - hostname: "*"
    path: "^/_healthcheck$"
    service: http_status:200
  - hostname: "*"
    path: "^/metrics$"
    service: http://localhost:2000
  - hostname: "*"
    path: "^/ready$"
    service: http://localhost:2000
  - hostname: ${tunnel_subdomain}
    service: hello-world
  - service: http_status:404
EOF
# Now we install the tunnel as a systemd service
sudo cloudflared service install
# The credentials file does not get copied over so we'll do that manually
sudo cp /root/.cloudflared/cert.json /etc/cloudflared/cert.json
sudo cp /root/.cloudflared/config.yml /etc/cloudflared/config.yml

# Enable and start the tunnel
sudo systemctl enable --now cloudflared

# Make a backup of all ssh host keys to disk if not exists
if [ ! -d /.sshd ]; then
  sudo mkdir /.sshd
  sudo cp /etc/ssh/ssh_host_* /.sshd/
fi

# Overwrite ssh host keys with backup
sudo cp /.sshd/ssh_host_* /etc/ssh/
# Restart sshd to force server to use new host keys
sudo systemctl restart sshd

# Short-lived Certificates Setup

# Create user matching primary user SSO identity
sudo useradd --gid "${cf_ssh_username}" --groups sudo --create-home --shell /bin/bash "${cf_ssh_username}"
echo "${cf_ssh_username}:${cf_ssh_password}" | sudo chpasswd

# Save public key into SSH configuration directory
echo "${cf_ssh_certificate}" | sudo tee -a /etc/ssh/ca.pub > /dev/null

# Modify SSHD config to accept PubkeyAuthentication and add /etc/ssh/ca.pub to TrustedUserCAKeys
sudo sed -i 's/[#]\w*PubkeyAuthentication yes/PubkeyAuthentication yes\nTrustedUserCAKeys \/etc\/ssh\/ca.pub/' /etc/ssh/sshd_config

# Restart sshd to force server to have modified SSHD configuration
sudo systemctl restart sshd
