# The "name" of the availability domain to be used for the compute instance.
output "name-of-first-availability-domain" {
  value = data.oci_identity_availability_domains.ads.availability_domains[0].name
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
