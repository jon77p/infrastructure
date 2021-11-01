resource "cloudflare_access_application" "ssh_app" {
  for_each         = toset(var.instances)
  zone_id          = var.cf_zone_id
  name             = "Access protection for ssh-${each.key}.${var.domain}"
  domain           = "ssh-${each.key}.${var.domain}"
  session_duration = "1h"
}

resource "cloudflare_access_policy" "ssh_policy" {
  for_each       = toset(var.instances)
  application_id = cloudflare_access_application.ssh_app[each.key].id
  zone_id        = var.cf_zone_id
  name           = "Policy for ssh-${each.key}.${var.domain}"
  precedence     = "1"
  decision       = "allow"

  include {
    email = [var.cf_email]
  }
}
