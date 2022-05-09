variable "compartment_id" {
  description = "OCID for instance compartment id"
  type        = string
}

variable "terraform_ssh_public_key" {
  description = "Public Key for Terraform-created compute instances"
  type        = string
  sensitive   = true
}

variable "instances" {
  description = "map of instances"
  type = map(object({
    name      = string
    ad_number = number
    image_id  = string
    shape     = string
    memory    = number
    ocpus     = number
  }))
  default = {}
}

variable "subnet_id" {
  description = "OCID for instance subnet"
  type        = string
}

variable "setup_script_path" {
  description = "Relative path to location of setup script"
  type        = string
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

variable "cf_tunnels" {
  description = "List of cloudflare_argo_tunnel resources"
  type = map(
    object({
      id   = string
      name = string
    })
  )
}

variable "cf_tunnel_secret" {
  description = "Base64 secret value for tunnel"
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

variable "cf_ssh_certificates" {
  description = "List of cloudflare_access_ca_certificate resources"
  type = map(
    object({
      id         = string
      aud        = string
      public_key = string
    })
  )
}
