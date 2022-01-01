terraform {
  required_providers {
    oci = {
      source = "hashicorp/oci"
      version = "4.57.0"
    }
  }
}

data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_id
}

resource "oci_core_instance" "ubuntu_instance" {
  for_each     = var.instances
  display_name = each.value.name

  # Required
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_id
  shape               = each.value.shape
  shape_config {
    memory_in_gbs = each.value.memory
    ocpus = each.value.ocpus
  }

  source_details {
    source_id   = each.value.image_id
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
    user_data = base64gzip(templatefile(var.setup_script_path,
      {
        cf_account       = var.cf_account_id,
        cf_domain        = "${var.cf_tunnels[each.key].name}.${var.domain}",
        cf_tunnel_id     = var.cf_tunnels[each.key].id,
        cf_tunnel_name   = var.cf_tunnels[each.key].name,
        cf_tunnel_secret = var.cf_tunnel_secret,
        hostname         = each.key
    }))
  }
  preserve_boot_volume = false
}
