terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "4.95.0"
    }
  }
}

data "oci_identity_availability_domain" "ads" {
  for_each       = var.instances
  compartment_id = var.compartment_id
  ad_number      = each.value.ad_number
}

data "oci_core_boot_volumes" "all_boot_volumes" {
  for_each            = var.instances
  availability_domain = data.oci_identity_availability_domain.ads[each.value.name].name
  compartment_id      = var.compartment_id
}

resource "oci_core_instance" "ubuntu_instance" {
  for_each     = var.instances
  display_name = each.value.name

  # Required
  availability_domain = data.oci_identity_availability_domain.ads[each.value.name].name
  compartment_id      = var.compartment_id
  shape               = each.value.shape
  shape_config {
    memory_in_gbs = each.value.memory
    ocpus         = each.value.ocpus
  }


  source_details {
    # Check to see if there exists a boot volume that starts with the each.value.name hostname and is in the AVAILABLE state
    # if exists, then use that boot volume's id
    # otherwise, use the variable image_id value
    source_id = length([for idx, vol in data.oci_core_boot_volumes.all_boot_volumes[each.value.name].boot_volumes : vol if split(" ", vol.display_name)[0] == each.value.name && vol.state == "AVAILABLE"]) == 1 ? [for idx, vol in data.oci_core_boot_volumes.all_boot_volumes[each.value.name].boot_volumes : vol if split(" ", vol.display_name)[0] == each.value.name && vol.state == "AVAILABLE"][0].id : each.value.image_id

    # Check to see if there exists a boot volume that starts with the each.value.name hostname and is in the AVAILABLE state
    # if exists, then set source_type to "bootVolume"
    # otherwise, set source_type to "image"
    source_type = length([for idx, vol in data.oci_core_boot_volumes.all_boot_volumes[each.value.name].boot_volumes : vol if split(" ", vol.display_name)[0] == each.value.name && vol.state == "AVAILABLE"]) == 1 ? "bootVolume" : "image"
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
        cf_account         = var.cf_account_id,
        cf_tunnel_id       = var.cf_tunnels[each.key].id,
        cf_tunnel_name     = var.cf_tunnels[each.key].name,
        cf_tunnel_secret   = var.cf_tunnel_secret,
        cf_ssh_certificate = var.cf_ssh_certificates[each.key].public_key,
        cf_ssh_username    = var.cf_ssh_username,
        cf_ssh_password    = var.cf_ssh_password,
        hostname           = each.key,
        ssh_subdomain      = "${each.value.is_subdomain ? "ssh-${each.value.name}.${each.value.domain}" : "ssh.${each.value.domain}"}",
        tunnel_subdomain   = "${each.value.is_subdomain ? "tunnel-${each.value.name}.${each.value.domain}" : "tunnel.${each.value.domain}"}"
    }))
  }
  preserve_boot_volume = true
}
