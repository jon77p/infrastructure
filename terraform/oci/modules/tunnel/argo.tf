resource "random_id" "tunnel_secret" {
  byte_length = 35
}

resource "cloudflare_argo_tunnel" "tunnel" {
  for_each   = var.instances
  name       = each.value.name
  account_id = var.cf_account_id
  secret     = random_id.tunnel_secret.b64_std
}

resource "cloudflare_record" "tunnel_app" {
  for_each = var.instances
  zone_id  = data.cloudflare_zones.cf_zones[each.value.name].zones[0].id
  name     = "tunnel-${each.value.name}"
  value    = "${cloudflare_argo_tunnel.tunnel[each.value.name].id}.cfargotunnel.com"
  type     = "CNAME"
  proxied  = true
}

resource "cloudflare_record" "ssh_app" {
  for_each = var.instances
  zone_id  = data.cloudflare_zones.cf_zones[each.value.name].zones[0].id
  name     = "ssh-${each.value.name}"
  value    = "tunnel-${each.value.name}.${each.value.domain}"
  type     = "CNAME"
  proxied  = true
}
