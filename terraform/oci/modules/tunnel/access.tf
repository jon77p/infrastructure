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

resource "cloudflare_access_policy" "ssh_service_token_policy" {
  for_each       = var.instances
  application_id = cloudflare_access_application.ssh_app[each.value.name].id
  zone_id        = var.cf_zone_id
  name           = "Service Token Auth Policy for ssh-${each.value.name}.${var.domain}"
  precedence     = 1
  decision       = "non_identity"

  include {
    service_token = [var.cf_admin_service_token_id]
    group         = [var.cf_admin_group_id]
  }
}

resource "cloudflare_access_policy" "ssh_policy" {
  for_each       = var.instances
  application_id = cloudflare_access_application.ssh_app[each.value.name].id
  zone_id        = var.cf_zone_id
  name           = "Policy for ssh-${each.value.name}.${var.domain}"
  precedence     = 2
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
