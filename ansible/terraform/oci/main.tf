terraform {
  required_providers {
    oci = {
      source = "hashicorp/oci"
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

  domain        = var.domain
  instances     = var.instances
  cf_zone_id    = var.cf_zone_id
  cf_email      = var.cf_email
  cf_account_id = var.cf_account_id
}

module "compute" {
  source = "./modules/compute"

  compartment_id           = module.base.compartment-id
  terraform_ssh_public_key = var.terraform_ssh_public_key
  setup_script             = var.setup_script
  instances                = var.instances
  subnet_id                = module.base.public-subnet-id
}

resource "cloudflare_record" "instance_record" {
  for_each = toset(var.instances)
  zone_id  = var.cf_zone_id
  name     = "${each.key}.${var.profile}.${var.domain}"
  value    = module.compute.instance-public-ip[each.key]
  type     = "A"
  proxied  = false
}
