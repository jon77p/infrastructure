# Outputs for new compartment
output "oci0-compartment-name" {
  value = module.oci0.compartment-name
}
output "oci0-compartment-id" {
  value = module.oci0.compartment-id
}
output "oci1-compartment-name" {
  value = module.oci1.compartment-name
}
output "oci1-compartment-id" {
  value = module.oci1.compartment-id
}
output "oci2-compartment-name" {
  value = module.oci2.compartment-name
}
output "oci2-compartment-id" {
  value = module.oci2.compartment-id
}

# Outputs for VCN
output "oci0-vcn-name" {
  value = module.oci0.vcn-name
}
output "oci1-vcn-name" {
  value = module.oci1.vcn-name
}
output "oci2-vcn-name" {
  value = module.oci2.vcn-name
}
output "oci0-vcn-id" {
  value = module.oci0.vcn-id
}
output "oci1-vcn-id" {
  value = module.oci1.vcn-id
}
output "oci2-vcn-id" {
  value = module.oci2.vcn-id
}
output "oci0-vcn-dns_label" {
  value = module.oci0.vcn-dns_label
}
output "oci1-vcn-dns_label" {
  value = module.oci1.vcn-dns_label
}
output "oci2-vcn-dns_label" {
  value = module.oci2.vcn-dns_label
}
output "oci0-vcn-domain_name" {
  value = module.oci0.vcn-domain_name
}
output "oci1-vcn-domain_name" {
  value = module.oci1.vcn-domain_name
}
output "oci2-vcn-domain_name" {
  value = module.oci2.vcn-domain_name
}

# Outputs for private subnet
output "oci0-private-subnet-name" {
  value = module.oci0.private-subnet-name
}
output "oci1-private-subnet-name" {
  value = module.oci1.private-subnet-name
}
output "oci2-private-subnet-name" {
  value = module.oci2.private-subnet-name
}
output "oci0-private-subnet-id" {
  value = module.oci0.private-subnet-id
}
output "oci1-private-subnet-id" {
  value = module.oci1.private-subnet-id
}
output "oci2-private-subnet-id" {
  value = module.oci2.private-subnet-id
}
output "oci0-private-subnet-dns_label" {
  value = module.oci0.private-subnet-dns_label
}
output "oci1-private-subnet-dns_label" {
  value = module.oci1.private-subnet-dns_label
}
output "oci2-private-subnet-dns_label" {
  value = module.oci2.private-subnet-dns_label
}
output "oci0-private-subnet-subnet_domain_name" {
  value = module.oci0.private-subnet-subnet_domain_name
}
output "oci1-private-subnet-subnet_domain_name" {
  value = module.oci1.private-subnet-subnet_domain_name
}
output "oci2-private-subnet-subnet_domain_name" {
  value = module.oci2.private-subnet-subnet_domain_name
}

# Outputs for public subnet
output "oci0-public-subnet-name" {
  value = module.oci0.public-subnet-name
}
output "oci1-public-subnet-name" {
  value = module.oci1.public-subnet-name
}
output "oci2-public-subnet-name" {
  value = module.oci2.public-subnet-name
}
output "oci0-public-subnet-id" {
  value = module.oci0.public-subnet-id
}
output "oci1-public-subnet-id" {
  value = module.oci1.public-subnet-id
}
output "oci2-public-subnet-id" {
  value = module.oci2.public-subnet-id
}
output "oci0-public-subnet-dns_label" {
  value = module.oci0.public-subnet-dns_label
}
output "oci1-public-subnet-dns_label" {
  value = module.oci1.public-subnet-dns_label
}
output "oci2-public-subnet-dns_label" {
  value = module.oci2.public-subnet-dns_label
}
output "oci0-public-subnet-subnet_domain_name" {
  value = module.oci0.public-subnet-subnet_domain_name
}
output "oci1-public-subnet-subnet_domain_name" {
  value = module.oci1.public-subnet-subnet_domain_name
}
output "oci2-public-subnet-subnet_domain_name" {
  value = module.oci2.public-subnet-subnet_domain_name
}

# Compute instances
output "oci0-instance-name" {
  value = module.oci0.instance-name
}
output "oci0-instance-OCID" {
  value = module.oci0.instance-OCID
}
output "oci0-instance-public-ip" {
  value = module.oci0.instance-public-ip
}

output "oci1-instance-name" {
  value = module.oci1.instance-name
}
output "oci1-instance-OCID" {
  value = module.oci1.instance-OCID
}
output "oci1-instance-public-ip" {
  value = module.oci1.instance-public-ip
}

output "oci2-instance-name" {
  value = module.oci2.instance-name
}
output "oci2-instance-OCID" {
  value = module.oci2.instance-OCID
}
output "oci2-instance-public-ip" {
  value = module.oci2.instance-public-ip
}
output "oci0-boot-volumes" {
  value = module.oci0.boot-volumes
}
output "oci0-instance-boot-volume" {
  value = module.oci0.instance-boot-volume
}
output "oci1-boot-volumes" {
  value = module.oci1.boot-volumes
}
output "oci1-instance-boot-volume" {
  value = module.oci1.instance-boot-volume
}
output "oci2-boot-volumes" {
  value = module.oci2.boot-volumes
}
output "oci2-instance-boot-volume" {
  value = module.oci2.instance-boot-volume
}
