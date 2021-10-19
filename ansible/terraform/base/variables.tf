variable "compartment_id" {
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
