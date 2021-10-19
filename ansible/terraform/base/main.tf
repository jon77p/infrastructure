terraform {
  required_providers {
    oci = {
      source = "hashicorp/oci"
    }
  }
}
provider "oci" {
  region              = var.region
  auth                = "SecurityToken"
  config_file_profile = var.profile
}

resource "oci_identity_compartment" "terraform" {
  # Required
  compartment_id = var.compartment_id
  description    = "Compartment for Terraform resources."
  name           = "terraform"
}

resource "oci_core_vcn" "terraform" {
  display_name   = "terraform"
  compartment_id = oci_identity_compartment.terraform.id
  dns_label      = var.profile
  cidr_blocks = [
    "10.0.0.0/16"
  ]
}

resource "oci_core_subnet" "public" {
  display_name               = "public"
  compartment_id             = oci_identity_compartment.terraform.id
  vcn_id                     = oci_core_vcn.terraform.id
  dns_label                  = "public"
  cidr_block                 = "10.0.0.0/24"
  prohibit_internet_ingress  = "false"
  prohibit_public_ip_on_vnic = "false"
}

resource "oci_core_subnet" "internal" {
  display_name               = "internal"
  compartment_id             = oci_identity_compartment.terraform.id
  vcn_id                     = oci_core_vcn.terraform.id
  dns_label                  = "internal"
  cidr_block                 = "10.0.1.0/24"
  prohibit_internet_ingress  = "true"
  prohibit_public_ip_on_vnic = "true"
}

# Outputs for new compartment
output "compartment-name" {
  value = oci_identity_compartment.terraform.name
}
output "compartment-id" {
  value = oci_identity_compartment.terraform.id
}

# Outputs for VCN
output "vcn-name" {
  value = oci_core_vcn.terraform.display_name
}
output "vcn-id" {
  value = oci_core_vcn.terraform.id
}
output "vcn-dns_label" {
  value = oci_core_vcn.terraform.dns_label
}
output "vcn-domain_name" {
  value = oci_core_vcn.terraform.vcn_domain_name
}

# Outputs for internal subnet
output "internal-subnet-name" {
  value = oci_core_subnet.internal.display_name
}
output "internal-subnet-id" {
  value = oci_core_subnet.internal.id
}
output "internal-subnet-dns_label" {
  value = oci_core_subnet.internal.dns_label
}
output "internal-subnet-subnet_domain_name" {
  value = oci_core_subnet.internal.subnet_domain_name
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
