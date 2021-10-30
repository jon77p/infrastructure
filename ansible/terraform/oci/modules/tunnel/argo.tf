resource "random_id" "tunnel_secret" {
  byte_length = 35
}

resource "cloudflare_argo_tunnel" "tunnel" {
  account_id = var.cf_account_id
  name       = var.application_name
  secret     = random_id.tunnel_secret.b64_std
}
