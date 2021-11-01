variable "tenancy_id" {
  description = "OCID from tenancy script"
  type        = string
}

variable "profile" {
  description = "config file profile name"
  type        = string
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
  description = "list of 2 compute instance names"
  type        = list(string)
  default     = []
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
