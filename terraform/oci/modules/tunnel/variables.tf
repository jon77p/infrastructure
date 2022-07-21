variable "cf_account_id" {
  description = "The Cloudflare UUID for the Account the Zone lives in."
  type        = string
  sensitive   = true
}

variable "instances" {
  description = "map of instances"
  type = map(object({
    name         = string
    domain       = string
    is_subdomain = bool
    ad_number    = number
    image_id     = string
    shape        = string
    memory       = number
    ocpus        = number
  }))
  default = {}
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
