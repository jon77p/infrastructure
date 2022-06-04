terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "4.78.0"
    }
  }
}

data "oci_identity_compartments" "terraform" {
  compartment_id = var.tenancy_id
  name           = "terraform"
  state          = "ACTIVE"
}

module "vcn" {
  source                  = "oracle-terraform-modules/vcn/oci"
  version                 = "3.4.0"
  compartment_id          = data.oci_identity_compartments.terraform.compartments[0].id
  region                  = var.region
  vcn_name                = "terraform"
  vcn_dns_label           = format("%s_%s", var.profile, replace(var.region, "-", ""))
  create_internet_gateway = true
  create_nat_gateway      = false
  create_service_gateway  = false
  vcn_cidrs               = [var.cidrs.vcn]
}

data "oci_core_vcns" "terraform" {
  compartment_id = data.oci_identity_compartments.terraform.compartments[0].id
  display_name   = "terraform"
}

resource "oci_core_security_list" "terraform" {
  count          = length(data.oci_core_vcns.terraform.virtual_networks) > 0 ? 1 : 0
  compartment_id = data.oci_identity_compartments.terraform.compartments[0].id
  vcn_id         = data.oci_core_vcns.terraform.virtual_networks[0].id
  display_name   = "terraform"
  egress_security_rules {
    protocol    = local.all_protocols
    destination = local.anywhere
    description = "Allows all traffic for all ports"
  }
  ingress_security_rules {
    protocol    = local.tcp_protocol
    source      = data.oci_core_vcns.terraform.virtual_networks[0].cidr_block
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
    protocol    = local.icmp_protocol
    source      = data.oci_core_vcns.terraform.virtual_networks[0].cidr_block
    description = "ICMP traffic for: 3, 4 Destination Unreachable: Fragmentation Needed and Don't Fragment was Set"
    icmp_options {
      type = 3
      code = 4
    }
  }
  ingress_security_rules {
    protocol    = local.icmp_protocol
    source      = data.oci_core_vcns.terraform.virtual_networks[0].cidr_block
    description = "ICMP traffic for: 3 Destination Unreachable"
    icmp_options {
      type = 3
    }
  }
}

data "oci_core_route_tables" "terraform_route_tables" {
  compartment_id = data.oci_identity_compartments.terraform.compartments[0].id
  display_name   = "internet-route"
}

resource "oci_core_subnet" "public" {
  count                      = length(data.oci_core_vcns.terraform.virtual_networks) > 0 && length(data.oci_core_route_tables.terraform_route_tables.route_tables) > 0 ? 1 : 0
  display_name               = "public"
  compartment_id             = data.oci_identity_compartments.terraform.compartments[0].id
  route_table_id             = data.oci_core_route_tables.terraform_route_tables.route_tables[0].id
  vcn_id                     = data.oci_core_vcns.terraform.virtual_networks[0].id
  dns_label                  = "public"
  cidr_block                 = var.cidrs.subnets.public
  prohibit_internet_ingress  = false
  prohibit_public_ip_on_vnic = false
  security_list_ids = [
    oci_core_security_list.terraform[0].id
  ]
}

resource "oci_core_subnet" "private" {
  count                      = length(data.oci_core_vcns.terraform.virtual_networks) > 0 && length(data.oci_core_route_tables.terraform_route_tables.route_tables) > 0 ? 1 : 0
  display_name               = "private"
  compartment_id             = data.oci_identity_compartments.terraform.compartments[0].id
  route_table_id             = data.oci_core_route_tables.terraform_route_tables.route_tables[0].id
  vcn_id                     = data.oci_core_vcns.terraform.virtual_networks[0].id
  dns_label                  = "private"
  cidr_block                 = var.cidrs.subnets.private
  prohibit_internet_ingress  = true
  prohibit_public_ip_on_vnic = true
  security_list_ids = [
    oci_core_security_list.terraform[0].id
  ]
}
