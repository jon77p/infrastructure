provider "oci" {
  tenancy_ocid = var.oci[0].tenancy_ocid
  user_ocid    = var.oci[0].user_ocid
  fingerprint  = var.oci[0].fingerprint
  private_key  = var.oci_auth_private_key
  region       = var.region
  alias        = "oci0"
}

provider "oci" {
  tenancy_ocid = var.oci[1].tenancy_ocid
  user_ocid    = var.oci[1].user_ocid
  fingerprint  = var.oci[1].fingerprint
  private_key  = var.oci_auth_private_key
  region       = var.region
  alias        = "oci1"
}

provider "oci" {
  tenancy_ocid = var.oci[2].tenancy_ocid
  user_ocid    = var.oci[2].user_ocid
  fingerprint  = var.oci[2].fingerprint
  private_key  = var.oci_auth_private_key
  region       = var.region
  alias        = "oci2"
}

provider "cloudflare" {
  email      = var.cf_email
  api_token  = var.cf_api_token
  account_id = var.cf_account_id
}
