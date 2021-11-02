#!/bin/sh
sudo apt update -y && sudo apt upgrade -y

# Install and setup Cloudflare Tunnel
echo 'deb http://pkg.cloudflare.com/ focal main' | sudo tee /etc/apt/sources.list.d/cloudflare-main.list
curl -C - https://pkg.cloudflare.com/pubkey.gpg | sudo apt-key add -
sudo apt-get update -y
sudo apt install -y cloudflared

# A local user directory is first created before we can install the tunnel as a system service 
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

ingress:
  - hostname: ssh-${cf_domain}
    service: ssh://localhost:22
  - hostname: "*"
    path: "^/_healthcheck$"
    service: http_status:200
  - hostname: "*"
    path: "^/_metrics$"
    service: http://localhost:2000
  - hostname: "*"
    path: "^/_ready$"
    service: http://localhost:2000
  - hostname: "tunnel-${cf_domain}"
    service: hello-world
  - service: http_status:404
EOF
# Now we install the tunnel as a systemd service 
sudo cloudflared service install
# The credentials file does not get copied over so we'll do that manually 
sudo cp -via /root/.cloudflared/cert.json /etc/cloudflared/

# Enable and start the tunnel
sudo systemctl enable --now cloudflared
