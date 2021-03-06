data "cloudflare_zones" "cf_zones" {
  for_each = var.instances
  filter {
    name        = each.value.domain
    account_id  = var.cf_account_id
    lookup_type = "exact"
    status      = "active"
  }
}

resource "cloudflare_access_application" "ssh_app" {
  for_each                  = var.instances
  zone_id                   = data.cloudflare_zones.cf_zones[each.value.name].zones[0].id
  name                      = each.value.is_subdomain ? "ssh-${each.value.name}.${each.value.domain}" : "ssh.${each.value.domain}"
  domain                    = each.value.is_subdomain ? "ssh-${each.value.name}.${each.value.domain}" : "ssh.${each.value.domain}"
  type                      = "ssh"
  session_duration          = "24h"
  auto_redirect_to_identity = true
  allowed_idps              = var.cf_allowed_idp_ids
  app_launcher_visible      = false
}

resource "cloudflare_access_policy" "ssh_service_token_policy" {
  for_each       = var.instances
  application_id = cloudflare_access_application.ssh_app[each.value.name].id
  zone_id        = data.cloudflare_zones.cf_zones[each.value.name].zones[0].id
  name           = format("%s%s", "Service Token Auth Policy for ", "${each.value.is_subdomain ? "ssh-${each.value.name}.${each.value.domain}" : "ssh.${each.value.domain}"}")
  precedence     = 1
  decision       = "non_identity"

  include {
    service_token = [var.cf_admin_service_token_id]
  }
}

resource "cloudflare_access_policy" "ssh_policy" {
  for_each       = var.instances
  application_id = cloudflare_access_application.ssh_app[each.value.name].id
  zone_id        = data.cloudflare_zones.cf_zones[each.value.name].zones[0].id
  name           = format("%s%s", "Policy for ", "${each.value.is_subdomain ? "ssh-${each.value.name}.${each.value.domain}" : "ssh.${each.value.domain}"}")
  precedence     = 2
  decision       = "allow"

  include {
    group = [var.cf_admin_group_id]
  }
}

resource "cloudflare_access_ca_certificate" "ssh_certificate" {
  for_each       = var.instances
  application_id = cloudflare_access_application.ssh_app[each.value.name].id
  zone_id        = data.cloudflare_zones.cf_zones[each.value.name].zones[0].id
}
