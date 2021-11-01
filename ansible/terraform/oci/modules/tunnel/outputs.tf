output "tunnels" {
  value       = values(cloudflare_argo_tunnel.tunnel[*])
  description = "List of cloudflare_argo_tunnel resources"
}

output "tunnel_secret" {
  value       = random_id.tunnel_secret.b64_std
  description = "Base64 secret value for tunnel"
  sensitive   = true
}
