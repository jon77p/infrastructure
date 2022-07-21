provider "oci" {
  tenancy_ocid = var.oci["oci0"].tenancy_ocid
  user_ocid    = var.oci["oci0"].user_ocid
  fingerprint  = var.oci["oci0"].fingerprint
  private_key  = var.oci_auth_private_key
  region       = var.oci["oci0"].regions[0]
  alias        = "oci0"
}

provider "oci" {
  tenancy_ocid = var.oci["oci1"].tenancy_ocid
  user_ocid    = var.oci["oci1"].user_ocid
  fingerprint  = var.oci["oci1"].fingerprint
  private_key  = var.oci_auth_private_key
  region       = var.oci["oci1"].regions[0]
  alias        = "oci1"
}

provider "oci" {
  tenancy_ocid = var.oci["oci2"].tenancy_ocid
  user_ocid    = var.oci["oci2"].user_ocid
  fingerprint  = var.oci["oci2"].fingerprint
  private_key  = var.oci_auth_private_key
  region       = var.oci["oci2"].regions[0]
  alias        = "oci2"
}

provider "oci" {
  tenancy_ocid = var.oci["oci2"].tenancy_ocid
  user_ocid    = var.oci["oci2"].user_ocid
  fingerprint  = var.oci["oci2"].fingerprint
  private_key  = var.oci_auth_private_key
  region       = var.oci["oci2"].regions[0]
  alias        = "oci2-region0"
}

provider "oci" {
  tenancy_ocid = var.oci["oci2"].tenancy_ocid
  user_ocid    = var.oci["oci2"].user_ocid
  fingerprint  = var.oci["oci2"].fingerprint
  private_key  = var.oci_auth_private_key
  region       = var.oci["oci2"].regions[1]
  alias        = "oci2-region1"
}

provider "oci" {
  tenancy_ocid = var.oci["oci3"].tenancy_ocid
  user_ocid    = var.oci["oci3"].user_ocid
  fingerprint  = var.oci["oci3"].fingerprint
  private_key  = var.oci_auth_private_key
  region       = var.oci["oci3"].regions[0]
  alias        = "oci3"
}

provider "cloudflare" {
  api_token = var.cf_api_token
}
