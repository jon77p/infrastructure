terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "4.81.0"
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
  cidrs              = var.cidrs
  additional_ingress = var.additional_ingress
}

module "tunnel" {
  source = "./modules/tunnel"

  instances                 = var.instances
  cf_email                  = var.cf_email
  cf_account_id             = var.cf_account_id
  cf_allowed_idp_ids        = var.cf_allowed_idp_ids
  cf_admin_group_id         = var.cf_admin_group_id
  cf_admin_service_token_id = var.cf_admin_service_token_id
}

module "compute" {
  source = "./modules/compute"

  compartment_id           = module.base.compartment-id
  region                   = var.region
  terraform_ssh_public_key = var.terraform_ssh_public_key
  setup_script_path        = var.setup_script_path
  instances                = var.instances
  subnet_id                = module.base.public-subnet-id

  cf_account_id       = var.cf_account_id
  cf_tunnels          = module.tunnel.tunnels
  cf_tunnel_secret    = module.tunnel.tunnel_secret
  cf_ssh_username     = var.cf_ssh_username
  cf_ssh_password     = var.cf_ssh_password
  cf_ssh_certificates = module.tunnel.ssh_certificates
}

resource "cloudflare_record" "instance_record" {
  for_each = var.instances
  zone_id  = module.tunnel.cf_zones[each.value.name].zones[0].id
  name     = "${each.value.name}.${var.profile}.${each.value.domain}"
  value    = module.compute.instance-public-ip[each.value.name]
  type     = "A"
  proxied  = false
}
