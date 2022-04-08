resource "cloudflare_access_application" "ssh_app" {
  for_each                  = var.instances
  zone_id                   = var.cf_zone_id
  name                      = "ssh-${each.value.name}.${var.domain}"
  domain                    = "ssh-${each.value.name}.${var.domain}"
  type                      = "ssh"
  session_duration          = "24h"
  auto_redirect_to_identity = true
  allowed_idps              = var.cf_allowed_idp_ids
  app_launcher_visible      = false
}

resource "cloudflare_access_policy" "ssh_policy" {
  for_each       = var.instances
  application_id = cloudflare_access_application.ssh_app[each.value.name].id
  zone_id        = var.cf_zone_id
  name           = "Policy for ssh-${each.value.name}.${var.domain}"
  precedence     = 1
  decision       = "allow"

  include {
    group = [var.cf_admin_group_id]
  }
}

resource "cloudflare_access_ca_certificate" "ssh_certificate" {
  for_each       = var.instances
  application_id = cloudflare_access_application.ssh_app[each.value.name].id
  zone_id        = var.cf_zone_id
}
