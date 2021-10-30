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

variable "setup_script" {
  description = "contents of script used for cloud-init when creating a compute instance"
  type        = string
}
