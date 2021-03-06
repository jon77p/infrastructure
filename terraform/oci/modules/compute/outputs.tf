output "availability-domains" {
  value = data.oci_identity_availability_domain.ads
}

output "boot-volumes" {
  value = data.oci_core_boot_volumes.all_boot_volumes
}

# Outputs for compute instance

output "instance-public-ip" {
  value = zipmap(values(oci_core_instance.ubuntu_instance)[*].display_name, values(oci_core_instance.ubuntu_instance)[*].public_ip)
}


output "instance-name" {
  value = values(oci_core_instance.ubuntu_instance)[*].display_name
}

output "instance-OCID" {
  value = zipmap(values(oci_core_instance.ubuntu_instance)[*].display_name, values(oci_core_instance.ubuntu_instance)[*].id)
}

output "instance-region" {
  value = zipmap(values(oci_core_instance.ubuntu_instance)[*].display_name, values(oci_core_instance.ubuntu_instance)[*].region)
}

output "instance-shape" {
  value = zipmap(values(oci_core_instance.ubuntu_instance)[*].display_name, values(oci_core_instance.ubuntu_instance)[*].shape)
}

output "instance-state" {
  value = zipmap(values(oci_core_instance.ubuntu_instance)[*].display_name, values(oci_core_instance.ubuntu_instance)[*].state)
}

output "instance-OCPUs" {
  value = zipmap(values(oci_core_instance.ubuntu_instance)[*].display_name, values(oci_core_instance.ubuntu_instance)[*].shape_config[0].ocpus)
}

output "instance-memory-in-GBs" {
  value = zipmap(values(oci_core_instance.ubuntu_instance)[*].display_name, values(oci_core_instance.ubuntu_instance)[*].shape_config[0].memory_in_gbs)
}

output "time-created" {
  value = zipmap(values(oci_core_instance.ubuntu_instance)[*].display_name, values(oci_core_instance.ubuntu_instance)[*].time_created)
}

output "instance-boot-volume" {
  value = values(oci_core_instance.ubuntu_instance)[*].boot_volume_id
}
