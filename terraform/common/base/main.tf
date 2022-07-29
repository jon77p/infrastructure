terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "4.86.1"
    }
  }
}

resource "oci_identity_compartment" "terraform" {
  compartment_id = var.tenancy_id
  name           = "terraform"
  description    = "Compartment for Terraform resources."
}

module "vcn" {
  source                  = "oracle-terraform-modules/vcn/oci"
  version                 = "3.5.0"
  compartment_id          = oci_identity_compartment.terraform.id
  region                  = var.region
  vcn_name                = "terraform"
  vcn_dns_label           = var.profile
  create_internet_gateway = true
  create_nat_gateway      = false
  create_service_gateway  = false
  vcn_cidrs               = [var.cidrs.vcn]
}

data "oci_core_vcns" "terraform" {
  compartment_id = oci_identity_compartment.terraform.id
  display_name   = "terraform"
}

resource "oci_core_security_list" "terraform" {
  compartment_id = oci_identity_compartment.terraform.id
  vcn_id         = module.vcn.vcn_id
  display_name   = "terraform"
  egress_security_rules {
    protocol    = local.all_protocols
    destination = local.anywhere
    description = "Allows all traffic for all ports"
  }
  ingress_security_rules {
    protocol    = local.tcp_protocol
    source      = module.vcn.vcn_all_attributes.cidr_blocks[0]
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
    source      = module.vcn.vcn_all_attributes.cidr_blocks[0]
    description = "ICMP traffic for: 3, 4 Destination Unreachable: Fragmentation Needed and Don't Fragment was Set"
    icmp_options {
      type = 3
      code = 4
    }
  }
  ingress_security_rules {
    protocol    = local.icmp_protocol
    source      = module.vcn.vcn_all_attributes.cidr_blocks[0]
    description = "ICMP traffic for: 3 Destination Unreachable"
    icmp_options {
      type = 3
    }
  }
}

resource "oci_core_subnet" "public" {
  display_name               = "public"
  compartment_id             = oci_identity_compartment.terraform.id
  vcn_id                     = module.vcn.vcn_id
  route_table_id             = module.vcn.ig_route_id
  dns_label                  = "public"
  cidr_block                 = var.cidrs.subnets.public
  prohibit_internet_ingress  = false
  prohibit_public_ip_on_vnic = false
  security_list_ids = [
    oci_core_security_list.terraform.id
  ]
}

resource "oci_core_subnet" "private" {
  display_name               = "private"
  compartment_id             = oci_identity_compartment.terraform.id
  vcn_id                     = module.vcn.vcn_id
  route_table_id             = module.vcn.ig_route_id
  dns_label                  = "private"
  cidr_block                 = var.cidrs.subnets.private
  prohibit_internet_ingress  = true
  prohibit_public_ip_on_vnic = true
  security_list_ids = [
    oci_core_security_list.terraform.id
  ]
}
