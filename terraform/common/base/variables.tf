variable "tenancy_id" {
  description = "OCID from tenancy script"
  type        = string
}

variable "profile" {
  description = "config file profile name"
  type        = string
}

variable "region" {
  description = "region where you want to deploy"
  type        = string
  default     = "us-phoenix-1"
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
    name    = string
    entries = list(object({}))
  }))
}
