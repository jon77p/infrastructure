terraform {
  required_providers {
    oci = {
      source = "hashicorp/oci"
    }
  }
}

data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_id
}

resource "oci_core_instance" "ubuntu_instance" {
  for_each     = toset(var.instances)
  display_name = each.key

  # Required
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_id
  shape               = "VM.Standard.E2.1.Micro"
  source_details {
    source_id   = var.image_id
    source_type = "image"
  }

  # Optional
  create_vnic_details {
    assign_public_ip          = true
    assign_private_dns_record = true
    subnet_id                 = var.subnet_id
    hostname_label            = each.key
  }
  metadata = {
    ssh_authorized_keys = "ssh-rsa ${var.terraform_ssh_public_key} terraform"
    user_data           = base64encode(var.setup_script)
  }
  preserve_boot_volume = false
}
