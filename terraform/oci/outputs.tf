# Outputs for new compartment
output "compartment-name" {
  value = module.base.compartment-name
}
output "compartment-id" {
  value = module.base.compartment-id
}

# Outputs for VCN
output "vcn-name" {
  value = module.base.vcn-name
}
output "vcn-id" {
  value = module.base.vcn-id
}
output "vcn-dns_label" {
  value = module.base.vcn-dns_label
}
output "vcn-domain_name" {
  value = module.base.vcn-domain_name
}

# Outputs for private subnet
output "private-subnet-name" {
  value = module.base.private-subnet-name
}
output "private-subnet-id" {
  value = module.base.private-subnet-id
}
output "private-subnet-dns_label" {
  value = module.base.private-subnet-dns_label
}
output "private-subnet-subnet_domain_name" {
  value = module.base.private-subnet-subnet_domain_name
}

# Outputs for public subnet
output "public-subnet-name" {
  value = module.base.public-subnet-name
}
output "public-subnet-id" {
  value = module.base.public-subnet-id
}
output "public-subnet-dns_label" {
  value = module.base.public-subnet-dns_label
}
output "public-subnet-subnet_domain_name" {
  value = module.base.public-subnet-subnet_domain_name
}

# Outputs for compute instances
output "instance-name" {
  value = module.compute.instance-name
}
output "instance-OCID" {
  value = module.compute.instance-OCID
}
output "instance-public-ip" {
  value = module.compute.instance-public-ip
}

# Outputs for boot volumes
output "boot-volumes" {
  value = module.compute.boot-volumes
}
output "instance-boot-volume" {
  value = module.compute.instance-boot-volume
}
