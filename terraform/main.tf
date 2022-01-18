terraform {
  required_providers {
    oci = {
      source  = "hashicorp/oci"
      version = "4.57.0"
    }
    cloudflare = {
      source = "cloudflare/cloudflare"
    }
  }
}

module "oci0" {
  source = "./oci"
  providers = {
    oci = oci.oci0
  }

  profile                  = var.oci[0].alias
  tenancy_id               = var.oci[0].tenancy_ocid
  region                   = var.region
  domain                   = var.domain
  cf_account_id            = var.cf_account_id
  cf_zone_id               = var.cf_zone_id
  cf_email                 = var.cf_email
  cf_allowed_idp_ids       = var.cf_allowed_idp_ids
  cf_admin_group_id        = var.cf_admin_group_id
  terraform_ssh_public_key = var.terraform_ssh_public_key
  setup_script_path        = var.setup_script_path
  cidrs                    = var.cidrs
  instances                = var.instances[0].instances
  additional_ingress       = local.additional_ingress.oci0
}

module "oci1" {
  source = "./oci"
  providers = {
    oci = oci.oci1
  }

  profile                  = var.oci[1].alias
  tenancy_id               = var.oci[1].tenancy_ocid
  region                   = var.region
  domain                   = var.domain
  cf_account_id            = var.cf_account_id
  cf_zone_id               = var.cf_zone_id
  cf_email                 = var.cf_email
  cf_allowed_idp_ids       = var.cf_allowed_idp_ids
  cf_admin_group_id        = var.cf_admin_group_id
  terraform_ssh_public_key = var.terraform_ssh_public_key
  setup_script_path        = var.setup_script_path
  cidrs                    = var.cidrs
  instances                = var.instances[1].instances
  additional_ingress       = local.additional_ingress.oci1
}

module "oci2" {
  source = "./oci"
  providers = {
    oci = oci.oci2
  }

  profile                  = var.oci[2].alias
  tenancy_id               = var.oci[2].tenancy_ocid
  region                   = var.region
  domain                   = var.domain
  cf_account_id            = var.cf_account_id
  cf_zone_id               = var.cf_zone_id
  cf_email                 = var.cf_email
  cf_allowed_idp_ids       = var.cf_allowed_idp_ids
  cf_admin_group_id        = var.cf_admin_group_id
  terraform_ssh_public_key = var.terraform_ssh_public_key
  setup_script_path        = var.setup_script_path
  cidrs                    = var.cidrs
  instances                = var.instances[2].instances
  additional_ingress       = local.additional_ingress.oci2
}
