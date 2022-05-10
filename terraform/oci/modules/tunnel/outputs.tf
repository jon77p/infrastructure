output "tunnels" {
  value       = cloudflare_argo_tunnel.tunnel
  description = "List of cloudflare_argo_tunnel resources"
}

output "tunnel_secret" {
  value       = random_id.tunnel_secret.b64_std
  description = "Base64 secret value for tunnel"
  sensitive   = true
}

output "ssh_certificates" {
  value       = cloudflare_access_ca_certificate.ssh_certificate
  description = "List of cloudflare_access_ca_certificate resources"
}

output "cf_zones" {
  value       = data.cloudflare_zones.cf_zones
  description = "List of cloudflare_zones resources"
}
