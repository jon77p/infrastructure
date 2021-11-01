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

variable "instances" {
  description = "list of 2 compute instance names"
  type        = list(string)
  default     = []
}

variable "cf_allowed_idp_ids" {
  description = "list of allowed Cloudflare IDP ids"
  type        = list(string)
  default     = []
}
