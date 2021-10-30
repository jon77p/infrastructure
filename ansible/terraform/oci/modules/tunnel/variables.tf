variable "domain" {
  description = "base resource domain name"
  type        = string
}

variable "application_name" {
  description = "name of application"
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
  sensitive   = true
}
