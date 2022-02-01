terraform {
  required_providers {
    oci = {
      source = "hashicorp/oci"
      version = "4.61.0"
    }
    cloudflare = {
      source = "cloudflare/cloudflare"
    }
  }
}

module "base" {
  source = "../common/base"

  profile            = var.profile
  tenancy_id         = var.tenancy_id
  region             = var.region
  domain             = var.domain
  cidrs              = var.cidrs
  additional_ingress = var.additional_ingress
}

module "tunnel" {
  source = "./modules/tunnel"

  domain             = var.domain
  instances          = var.instances
  cf_zone_id         = var.cf_zone_id
  cf_email           = var.cf_email
  cf_account_id      = var.cf_account_id
  cf_allowed_idp_ids = var.cf_allowed_idp_ids
  cf_admin_group_id  = var.cf_admin_group_id
}

module "compute" {
  source = "./modules/compute"

  compartment_id           = module.base.compartment-id
  terraform_ssh_public_key = var.terraform_ssh_public_key
  setup_script_path        = var.setup_script_path
  instances                = var.instances
  subnet_id                = module.base.public-subnet-id

  domain           = var.domain
  cf_account_id    = var.cf_account_id
  cf_tunnels       = module.tunnel.tunnels
  cf_tunnel_secret = module.tunnel.tunnel_secret
}

resource "cloudflare_record" "instance_record" {
  for_each = var.instances
  zone_id  = var.cf_zone_id
  name     = "${each.value.name}.${var.profile}.${var.domain}"
  value    = module.compute.instance-public-ip[each.value.name]
  type     = "A"
  proxied  = false
}
