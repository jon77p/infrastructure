terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "4.78.0"
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

  profile                   = var.oci["oci0"].alias
  tenancy_id                = var.oci["oci0"].tenancy_ocid
  region                    = var.oci["oci0"].regions[0]
  cf_account_id             = var.cf_account_id
  cf_email                  = var.cf_email
  cf_allowed_idp_ids        = var.cf_allowed_idp_ids
  cf_admin_group_id         = var.cf_admin_group_id
  cf_admin_service_token_id = var.cf_admin_service_token_id
  cf_ssh_username           = var.cf_ssh_username
  cf_ssh_password           = var.cf_ssh_password
  terraform_ssh_public_key  = var.terraform_ssh_public_key
  setup_script_path         = var.setup_script_path
  cidrs                     = var.cidrs
  instances                 = var.instances["oci0"].instances
  additional_ingress        = local.additional_ingress.oci0
}

module "oci1" {
  source = "./oci"
  providers = {
    oci = oci.oci1
  }

  profile                   = var.oci["oci1"].alias
  tenancy_id                = var.oci["oci1"].tenancy_ocid
  region                    = var.oci["oci1"].regions[0]
  cf_account_id             = var.cf_account_id
  cf_email                  = var.cf_email
  cf_allowed_idp_ids        = var.cf_allowed_idp_ids
  cf_admin_group_id         = var.cf_admin_group_id
  cf_admin_service_token_id = var.cf_admin_service_token_id
  cf_ssh_username           = var.cf_ssh_username
  cf_ssh_password           = var.cf_ssh_password
  terraform_ssh_public_key  = var.terraform_ssh_public_key
  setup_script_path         = var.setup_script_path
  cidrs                     = var.cidrs
  instances                 = var.instances["oci1"].instances
  additional_ingress        = local.additional_ingress.oci1
}

module "oci2-region0" {
  source = "./oci"
  providers = {
    oci = oci.oci2-region0
  }

  profile                   = var.oci["oci2"].alias
  tenancy_id                = var.oci["oci2"].tenancy_ocid
  region                    = var.oci["oci2"].regions[0]
  cf_account_id             = var.cf_account_id
  cf_email                  = var.cf_email
  cf_allowed_idp_ids        = var.cf_allowed_idp_ids
  cf_admin_group_id         = var.cf_admin_group_id
  cf_admin_service_token_id = var.cf_admin_service_token_id
  cf_ssh_username           = var.cf_ssh_username
  cf_ssh_password           = var.cf_ssh_password
  terraform_ssh_public_key  = var.terraform_ssh_public_key
  setup_script_path         = var.setup_script_path
  cidrs                     = var.cidrs
  instances                 = { for k, v in var.instances["oci2"].instances : k => v if v.region == var.oci["oci2"].regions[0] }
  additional_ingress        = local.additional_ingress.oci2
}

module "oci2-region1" {
  source = "./oci"
  providers = {
    oci = oci.oci2-region1
  }

  profile                   = var.oci["oci2"].alias
  tenancy_id                = var.oci["oci2"].tenancy_ocid
  region                    = var.oci["oci2"].regions[1]
  cf_account_id             = var.cf_account_id
  cf_email                  = var.cf_email
  cf_allowed_idp_ids        = var.cf_allowed_idp_ids
  cf_admin_group_id         = var.cf_admin_group_id
  cf_admin_service_token_id = var.cf_admin_service_token_id
  cf_ssh_username           = var.cf_ssh_username
  cf_ssh_password           = var.cf_ssh_password
  terraform_ssh_public_key  = var.terraform_ssh_public_key
  setup_script_path         = var.setup_script_path
  cidrs                     = var.cidrs
  instances                 = { for k, v in var.instances["oci2"].instances : k => v if v.region == var.oci["oci2"].regions[1] }
  additional_ingress        = local.additional_ingress.oci2
}

module "oci3" {
  source = "./oci"
  providers = {
    oci = oci.oci3
  }

  profile                   = var.oci["oci3"].alias
  tenancy_id                = var.oci["oci3"].tenancy_ocid
  region                    = var.oci["oci3"].regions[0]
  cf_account_id             = var.cf_account_id
  cf_email                  = var.cf_email
  cf_allowed_idp_ids        = var.cf_allowed_idp_ids
  cf_admin_group_id         = var.cf_admin_group_id
  cf_admin_service_token_id = var.cf_admin_service_token_id
  cf_ssh_username           = var.cf_ssh_username
  cf_ssh_password           = var.cf_ssh_password
  terraform_ssh_public_key  = var.terraform_ssh_public_key
  setup_script_path         = var.setup_script_path
  cidrs                     = var.cidrs
  instances                 = var.instances["oci3"].instances
  additional_ingress        = local.additional_ingress.oci3
}
