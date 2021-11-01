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
  description = "list of instances (max 2)"
  type        = list(string)
}

variable "image_id" {
  description = "OCID for source image"
  type        = string
  default     = "ocid1.image.oc1.us-sanjose-1.aaaaaaaadq3dxjoqeckwgas733dxmrfsdconukiq357m6sjhb2xyhfpi4ica"
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
  type = list(object({
    id   = string
    name = string
  }))
  default = []
}

variable "cf_tunnel_secret" {
  description = "Base64 secret value for tunnel"
  type        = string
}
