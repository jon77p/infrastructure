provider "oci" {
  tenancy_ocid = var.oci["oci0"].tenancy_ocid
  user_ocid    = var.oci["oci0"].user_ocid
  fingerprint  = var.oci["oci0"].fingerprint
  private_key  = var.oci_auth_private_key
  region       = var.oci["oci0"].region
  alias        = "oci0"
}

provider "oci" {
  tenancy_ocid = var.oci["oci1"].tenancy_ocid
  user_ocid    = var.oci["oci1"].user_ocid
  fingerprint  = var.oci["oci1"].fingerprint
  private_key  = var.oci_auth_private_key
  region       = var.oci["oci1"].region
  alias        = "oci1"
}

provider "oci" {
  tenancy_ocid = var.oci["oci2"].tenancy_ocid
  user_ocid    = var.oci["oci2"].user_ocid
  fingerprint  = var.oci["oci2"].fingerprint
  private_key  = var.oci_auth_private_key
  region       = var.oci["oci2"].region
  alias        = "oci2"
}

provider "oci" {
  tenancy_ocid = var.oci["oci3"].tenancy_ocid
  user_ocid    = var.oci["oci3"].user_ocid
  fingerprint  = var.oci["oci3"].fingerprint
  private_key  = var.oci_auth_private_key
  region       = var.oci["oci3"].region
  alias        = "oci3"
}

provider "cloudflare" {
  email      = var.cf_email
  api_token  = var.cf_api_token
  account_id = var.cf_account_id
}
