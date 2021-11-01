resource "random_id" "tunnel_secret" {
  byte_length = 35
}

resource "cloudflare_argo_tunnel" "tunnel" {
  for_each   = toset(var.instances)
  name       = each.key
  account_id = var.cf_account_id
  secret     = random_id.tunnel_secret.b64_std
}

resource "cloudflare_record" "tunnel_app" {
  for_each = toset(var.instances)
  zone_id  = var.cf_zone_id
  name     = "tunnel.${each.key}"
  value    = "${cloudflare_argo_tunnel.tunnel[each.key].id}.cfargotunnel.com"
  type     = "CNAME"
  proxied  = true
}

resource "cloudflare_record" "ssh_app" {
  for_each = toset(var.instances)
  zone_id  = var.cf_zone_id
  name     = "ssh.${each.key}"
  value    = format("tunnel.%s.%s.%s", each.key, var.profile, var.domain)
  type     = "CNAME"
  proxied  = true
}
