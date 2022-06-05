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
  value = length(data.oci_core_vcns.terraform.virtual_networks) > 0 ? data.oci_core_vcns.terraform.virtual_networks[0].dns_label : var.profile
}
output "vcn-domain_name" {
  value = length(data.oci_core_vcns.terraform.virtual_networks) > 0 ? data.oci_core_vcns.terraform.virtual_networks[0].dns_label : var.profile
}

# Outputs for private subnet
output "private-subnet-name" {
  value = oci_core_subnet.private.display_name
}
output "private-subnet-id" {
  value = oci_core_subnet.private.id
}
output "private-subnet-dns_label" {
  value = oci_core_subnet.private.dns_label
}
output "private-subnet-subnet_domain_name" {
  value = oci_core_subnet.private.subnet_domain_name
}

# Outputs for public subnet
output "public-subnet-name" {
  value = oci_core_subnet.public.display_name
}
output "public-subnet-id" {
  value = oci_core_subnet.public.id
}
output "public-subnet-dns_label" {
  value = oci_core_subnet.public.dns_label
}
output "public-subnet-subnet_domain_name" {
  value = oci_core_subnet.public.subnet_domain_name
}
