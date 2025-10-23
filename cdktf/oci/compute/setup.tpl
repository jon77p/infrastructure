#!/bin/sh

ARCH=$(dpkg --print-architecture)

# Install tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Register node with tailscale
sudo tailscale up --authkey "${tailscale_auth_key}" --ssh --advertise-tags=tag:oci,tag:cdktf,tag:ssh

# Make a backup of all ssh host keys to disk if not exists
if [ ! -d /.sshd ]; then
  sudo mkdir /.sshd
  sudo cp /etc/ssh/ssh_host_* /.sshd/
fi

# Overwrite ssh host keys with backup
sudo cp /.sshd/ssh_host_* /etc/ssh/
# Restart sshd to force server to use new host keys
sudo systemctl restart sshd

# Create user matching primary user SSO identity
sudo useradd --gid "${cf_ssh_username}" --groups sudo --create-home --shell /bin/bash "${cf_ssh_username}"
echo "${cf_ssh_username}:${cf_ssh_password}" | sudo chpasswd

# Add `ssh-rsa ${terraformSshPublicKey} terraform` to authorized_keys for cf_ssh_username
sudo mkdir -p --mode=0700 /home/"${cf_ssh_username}"/.ssh
sudo touch /home/"${cf_ssh_username}"/.ssh/authorized_keys
sudo chmod 600 /home/"${cf_ssh_username}"/.ssh/authorized_keys
sudo chown -R "${cf_ssh_username}":"${cf_ssh_username}" /home/"${cf_ssh_username}"/.ssh
sudo cat > /home/"${cf_ssh_username}"/.ssh/authorized_keys << "EOF"
ssh-rsa ${terraformSshPublicKey} terraform
EOF

# If use_tunnel is true, install cloudflared and setup tunnel
if [ "${use_tunnel}" = "true" ]; then
  # Download cloudflared deb
  curl "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$ARCH.deb" -L -o /tmp/init-cloudflared.deb

  sudo dpkg -i /tmp/init-cloudflared.deb

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
  logfile: /var/log/cloudflared.log
  loglevel: info
  metrics: localhost:2000
  EOF
  # Now we install the tunnel as a systemd service
  sudo cloudflared service install
  # The credentials file does not get copied over so we'll do that manually
  sudo cp /root/.cloudflared/cert.json /etc/cloudflared/cert.json
  sudo cp /root/.cloudflared/config.yml /etc/cloudflared/config.yml

  # Enable and start the tunnel
  sudo systemctl enable --now cloudflared

  # Short-lived Certificates Setup

  # Save public key into SSH configuration directory
  # Only if the public key does not already exist in /etc/ssh/ca.pub
  if grep -Fxq "${cf_ssh_certificate}" /etc/ssh/ca.pub; then
    echo "Public key already exists in /etc/ssh/ca.pub"
  else
    echo "Public key does not exist in /etc/ssh/ca.pub" && echo "${cf_ssh_certificate}" | sudo tee -a /etc/ssh/ca.pub > /dev/null
  fi
fi

# Modify SSHD config to accept PubkeyAuthentication and add /etc/ssh/ca.pub to TrustedUserCAKeys
sudo sed -i 's/[#]\w*PubkeyAuthentication yes/PubkeyAuthentication yes\nTrustedUserCAKeys \/etc\/ssh\/ca.pub/' /etc/ssh/sshd_config

# Restart sshd to force server to have modified SSHD configuration
sudo systemctl restart sshd

# Install Grafana Cloud Agent
sudo ARCH="$(dpkg --print-architecture)" GCLOUD_STACK_ID="${grafana_cloud_stack_id}" GCLOUD_API_KEY="${grafana_cloud_api_key}" GCLOUD_API_URL="https://integrations-api-us-central.grafana.net" /bin/sh -c "$(curl -fsSL https://raw.githubusercontent.com/grafana/agent/release/production/grafanacloud-install.sh)"
