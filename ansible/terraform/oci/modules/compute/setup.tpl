#!/bin/sh
sudo apt update -y && sudo apt upgrade -y

# Install and setup Cloudflare Tunnel
wget https://bin.equinox.io/c/VdrWdbjqyF/cloudflared-stable-linux-amd64.deb
sudo dpkg -i cloudflared-stable-linux-amd64.deb
# A local user directory is first created before we can install the tunnel as a system service 
mkdir ~/.cloudflared
touch ~/.cloudflared/cert.json
touch ~/.cloudflared/config.yml
# Another herefile is used to dynamically populate the JSON credentials file 
cat > ~/.cloudflared/cert.json << "EOF"
{
    "AccountTag"   : "${cf_account}",
    "TunnelID"     : "${cf_tunnel_id}",
    "TunnelName"   : "${cf_tunnel_name}",
    "TunnelSecret" : "${cf_tunnel_secret}"
}
EOF
# Same concept with the Ingress Rules the tunnel will use 
cat > ~/.cloudflared/config.yml << "EOF"
tunnel: ${cf_tunnel_id}
credentials-file: /etc/cloudflared/cert.json
logfile: /var/log/cloudflared.log
loglevel: info

ingress:
  - hostname: ssh-${cf_domain}
    service: ssh://localhost:22
  - hostname: "*"
    path: "^/_healthcheck$"
    service: http_status:200
  - hostname: "tunnel-${cf_domain}"
    service: hello-world
  - service: http_status:404
EOF
# Now we install the tunnel as a systemd service 
sudo cloudflared service install
# The credentials file does not get copied over so we'll do that manually 
sudo cp -via ~/.cloudflared/cert.json /etc/cloudflared/

# Enable and start the tunnel
sudo systemctl enable --now cloudflared
