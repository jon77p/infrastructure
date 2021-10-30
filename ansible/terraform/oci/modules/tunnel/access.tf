resource "cloudflare_access_application" "ssh_app" {
  zone_id          = var.cf_zone_id
  name             = "Access protection for ssh-${var.domain}"
  domain           = "ssh-${var.domain}"
  session_duration = "1h"
}

resource "cloudflare_access_policy" "ssh_policy" {
  application_id = cloudflare_access_application.ssh_app.id
  zone_id        = var.cf_zone_id
  name           = "Policy for ssh-${var.domain}"
  precedence     = "1"
  decision       = "allow"

  include {
    email = [var.cf_email]
  }
}
