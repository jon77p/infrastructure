terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "4.78.0"
    }
  }
}

data "oci_identity_compartments" "terraform-check" {
  compartment_id = var.tenancy_id
  name           = "terraform"
  # state          = "ACTIVE"
}

resource "oci_identity_compartment" "terraform" {
  # Only create the compartment if it doesn't exist
  count = length(data.oci_identity_compartments.terraform-check.compartments) > 0 ? 0 : 1
  # Required
  compartment_id = var.tenancy_id
  description    = "Compartment for Terraform resources."
  name           = "terraform"
}

data "oci_identity_compartments" "terraform" {
  compartment_id = var.tenancy_id
  name           = "terraform"
  # state          = "ACTIVE"
}

# module "vcn" {
#   source                  = "oracle-terraform-modules/vcn/oci"
#   version                 = "3.4.0"
#   compartment_id          = data.oci_identity_compartments.terraform.compartments[0].id
#   region                  = var.region
#   vcn_name                = "terraform"
#   vcn_dns_label           = var.profile
#   create_internet_gateway = true
#   create_nat_gateway      = false
#   create_service_gateway  = false
#   vcn_cidrs               = [var.cidrs.vcn]
# }

resource "oci_core_vcn" "terraform" {
  compartment_id = data.oci_identity_compartments.terraform.compartments[0].id
  display_name   = "terraform"
  cidr_blocks    = [var.cidrs.vcn]
  dns_label      = format("%s+%s", var.profile, var.region)
  is_ipv6enabled = false
}

resource "oci_core_security_list" "terraform" {
  compartment_id = data.oci_identity_compartments.terraform.compartments[0].id
  # vcn_id         = module.vcn.vcn_id
  vcn_id       = oci_core_vcn.terraform.id
  display_name = "terraform"
  egress_security_rules {
    protocol    = local.all_protocols
    destination = local.anywhere
    description = "Allows all traffic for all ports"
  }
  ingress_security_rules {
    protocol = local.tcp_protocol
    # source      = module.vcn.vcn_all_attributes.cidr_blocks[0]
    source      = oci_core_vcn.terraform.cidr_blocks[0]
    description = "Allows all TCP traffic for all ports for VCN subnet"
  }
  ingress_security_rules {
    protocol    = local.tcp_protocol
    source      = local.anywhere
    description = "Allow SSH inbound"
    tcp_options {
      max = local.ssh_port
      min = local.ssh_port
    }
  }
  ingress_security_rules {
    protocol = local.icmp_protocol
    # source      = module.vcn.vcn_all_attributes.cidr_blocks[0]
    source      = oci_core_vcn.terraform.cidr_blocks[0]
    description = "ICMP traffic for: 3, 4 Destination Unreachable: Fragmentation Needed and Don't Fragment was Set"
    icmp_options {
      type = 3
      code = 4
    }
  }
  ingress_security_rules {
    protocol = local.icmp_protocol
    # source      = module.vcn.vcn_all_attributes.cidr_blocks[0]
    source      = oci_core_vcn.terraform.cidr_blocks[0]
    description = "ICMP traffic for: 3 Destination Unreachable"
    icmp_options {
      type = 3
    }
  }
}

data "oci_core_internet_gateways" "terraform-check" {
  compartment_id = data.oci_identity_compartments.terraform.compartments[0].id
  vcn_id         = oci_core_vcn.terraform.id
}

resource "oci_core_internet_gateway" "terraform" {
  # Only create the internet gateway if it doesn't exist
  count          = length(data.oci_core_internet_gateways.terraform-check.gateways) > 0 ? 0 : 1
  compartment_id = data.oci_identity_compartments.terraform.compartments[0].id
  vcn_id         = oci_core_vcn.terraform.id
  display_name   = "terraform"
}

data "oci_core_route_tables" "terraform_route_tables-check" {
  compartment_id = data.oci_identity_compartments.terraform.compartments[0].id
  display_name   = "internet-route"
}

resource "oci_core_route_table" "terraform" {
  # Only create the route table if it doesn't exist
  count          = length(data.oci_core_route_tables.terraform_route_tables-check.route_tables) > 0 ? 0 : 1
  compartment_id = data.oci_identity_compartments.terraform.compartments[0].id
  vcn_id         = oci_core_vcn.terraform.id
  display_name   = "internet-route"
}

data "oci_core_route_tables" "terraform_route_tables" {
  compartment_id = data.oci_identity_compartments.terraform.compartments[0].id
  display_name   = "internet-route"
}


resource "oci_core_subnet" "public" {
  display_name   = "public"
  compartment_id = data.oci_identity_compartments.terraform.compartments[0].id
  route_table_id = data.oci_core_route_tables.terraform_route_tables.route_tables[0].id
  # vcn_id                     = module.vcn.vcn_id
  vcn_id                     = oci_core_vcn.terraform.id
  dns_label                  = "public"
  cidr_block                 = var.cidrs.subnets.public
  prohibit_internet_ingress  = false
  prohibit_public_ip_on_vnic = false
  security_list_ids = [
    oci_core_security_list.terraform.id
  ]
}

resource "oci_core_subnet" "private" {
  display_name   = "private"
  compartment_id = data.oci_identity_compartments.terraform.compartments[0].id
  route_table_id = data.oci_core_route_tables.terraform_route_tables.route_tables[0].id
  # vcn_id                     = module.vcn.vcn_id
  vcn_id                     = oci_core_vcn.terraform.id
  dns_label                  = "private"
  cidr_block                 = var.cidrs.subnets.private
  prohibit_internet_ingress  = true
  prohibit_public_ip_on_vnic = true
  security_list_ids = [
    oci_core_security_list.terraform.id
  ]
}
