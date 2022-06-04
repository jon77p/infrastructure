# Outputs for new compartment
output "compartment-name" {
  value = data.oci_identity_compartments.terraform.compartments[0].name
}
output "compartment-id" {
  value = data.oci_identity_compartments.terraform.compartments[0].id
}

# Outputs for VCN
output "vcn-name" {
  value = length(data.oci_core_vcns.terraform.virtual_networks) > 0 ? data.oci_core_vcns.terraform.virtual_networks[0].display_name : "terraform"
}
output "vcn-id" {
  value = length(data.oci_core_vcns.terraform.virtual_networks) > 0 ? data.oci_core_vcns.terraform.virtual_networks[0].id : ""
}
output "vcn-dns_label" {
  value = length(data.oci_core_vcns.terraform.virtual_networks) > 0 ? data.oci_core_vcns.terraform.virtual_networks[0].dns_label : replace(format("%s_%s", var.profile, var.region), "-", "_")
}
output "vcn-domain_name" {
  value = length(data.oci_core_vcns.terraform.virtual_networks) > 0 ? data.oci_core_vcns.terraform.virtual_networks[0].dns_label : replace(format("%s_%s", var.profile, var.region), "-", "_")
}

# Outputs for private subnet
output "private-subnet-name" {
  value = length(oci_core_subnet.private) > 0 ? oci_core_subnet.private[0].display_name : "private"
}
output "private-subnet-id" {
  value = length(oci_core_subnet.private) > 0 ? oci_core_subnet.private[0].id : ""
}
output "private-subnet-dns_label" {
  value = length(oci_core_subnet.private) > 0 ? oci_core_subnet.private[0].dns_label : "private"
}
output "private-subnet-subnet_domain_name" {
  value = length(oci_core_subnet.private) > 0 ? oci_core_subnet.private[0].subnet_domain_name : format("%s.%s.oraclevcn.com", "private", replace(format("%s_%s", var.profile, var.region), "-", "_"))
}

# Outputs for public subnet
output "public-subnet-name" {
  value = length(oci_core_subnet.public) > 0 ? oci_core_subnet.public[0].display_name : "public"
}
output "public-subnet-id" {
  value = length(oci_core_subnet.public) > 0 ? oci_core_subnet.public[0].id : ""
}
output "public-subnet-dns_label" {
  value = length(oci_core_subnet.public) > 0 ? oci_core_subnet.public[0].dns_label : "public"
}
output "public-subnet-subnet_domain_name" {
  value = length(oci_core_subnet.public) > 0 ? oci_core_subnet.public[0].subnet_domain_name : format("%s.%s.oraclevcn.com", "public", replace(format("%s_%s", var.profile, var.region), "-", "_"))
}
