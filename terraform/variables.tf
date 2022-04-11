variable "oci_auth_private_key" {
  description = "Private key used for authenticating to OCI for providers"
  sensitive   = true
  type        = string
}

variable "oci" {
  description = "list containing OCI authentication information"
  type = list(object({
    alias        = string
    user_ocid    = string
    fingerprint  = string
    tenancy_ocid = string
  }))
  default = []
}

variable "region" {
  description = "region where you have OCI tenancy"
  type        = string
  default     = "us-sanjose-1"
}

variable "domain" {
  description = "base resource domain name"
  type        = string
}

variable "cf_account_id" {
  description = "The Cloudflare UUID for the Account the Zone lives in."
  type        = string
  sensitive   = true
}

variable "cf_zone_id" {
  description = "Cloudflare zone id"
  type        = string
}
variable "cf_email" {
  description = "Cloudflare email"
  type        = string
}
variable "cf_api_token" {
  description = "Cloudflare API token"
  type        = string
}

variable "terraform_ssh_public_key" {
  description = "Public Key for Terraform-created compute instances"
  type        = string
  sensitive   = true
}

variable "setup_script_path" {
  description = "Relative path to location of setup script"
  type        = string
  default     = "./oci/modules/compute/setup.tpl"
}

variable "instances" {
  description = "list containing instance information for all configured OCI providers"
  type = list(object({
    instances = map(object({
      name     = string
      image_id = string
      shape    = string
      memory   = number
      ocpus    = number
    }))
  }))
  default = []
}

variable "cidrs" {
  description = "object containing CIDR blocks for VCN and public + private subnets"
  type = object({
    vcn = string
    subnets = object({
      public  = string
      private = string
    })
  })
  default = {
    vcn = ""
    subnets = {
      public  = ""
      private = ""
    }
  }
}

variable "cf_allowed_idp_ids" {
  description = "list of allowed Cloudflare IDP ids"
  type        = list(string)
  default     = []
}

variable "cf_admin_group_id" {
  description = "Id of administrator cloudflare group"
  type        = string
}

variable "cf_ssh_username" {
  description = "Username for sshing with Cloudflare short-lived certificates"
  type        = string
}

variable "cf_ssh_password" {
  description = "Password for user for sshing with Cloudflare short-lived certificates"
  sensitive   = true
  type        = string
}
