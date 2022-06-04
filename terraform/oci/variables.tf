variable "tenancy_id" {
  description = "OCID from tenancy script"
  type        = string
}

variable "profile" {
  description = "config file profile name"
  type        = string
}

variable "region" {
  description = "region where you can deploy"
  type        = string
}

variable "cf_account_id" {
  description = "The Cloudflare UUID for the Account the Zone lives in."
  type        = string
  sensitive   = true
}

variable "cf_email" {
  description = "Cloudflare email"
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
}

variable "instances" {
  description = "map of instances"
  type = map(object({
    name         = string
    domain       = string
    is_subdomain = bool
    ad_number    = number
    region       = string
    image_id     = string
    shape        = string
    memory       = number
    ocpus        = number
  }))
  default = {}
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

variable "additional_ingress" {
  type = list(object({
    name = string
    entries = list(object({
      protocol    = number
      source      = string
      tcp_options = object({})
    }))
  }))
}

variable "cf_allowed_idp_ids" {
  description = "list of allowed Cloudflare IDP ids"
  type        = list(string)
  default     = []
}

variable "cf_admin_group_id" {
  description = "Id of administrator Cloudflare group"
  type        = string
}

variable "cf_admin_service_token_id" {
  description = "Id of administrator Cloudflare service token"
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
