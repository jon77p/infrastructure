import * as cloudflare from "@cdktf/provider-cloudflare"
import * as oci from "../.gen/providers/oci"

import { Base, NetworkingConfig } from "./common/base"
import * as Compute from "./compute/main"
import * as Tunnel from "./tunnel/main"

import { TerraformStack } from "cdktf"
import { Construct } from "constructs"

export interface OCIAuthConfig {
  alias: string
  user_ocid: string
  fingerprint: string
  tenancy_ocid: string
  regions: string[]
}

export interface InstanceConfig {
  name: string
  domain: string
  isSubdomain: boolean
  adNumber: number
  region: string
  imageId: string
  shape: string
  memory: number
  ocpus: number
}

export interface OCIConfig {
  regions: string[]
  networking: NetworkingConfig
  instances: Map<string, InstanceConfig>
}

interface OCIStackProps {
  ociConfig: OCIConfig
  providerConfig: { config: OCIAuthConfig; privateKey: string }
  region: string
  cfAccountId: string
  cfEmail: string
  cfAllowedIdpIds: string[]
  cfAdminGroupId: string
  cfAdminServiceTokenId: string
  cfSshUsername: string
  cfSshPassword: string
  terraformSshPublicKey: string
}

export class OCI extends TerraformStack {
  constructor(scope: Construct, name: string, props: OCIStackProps) {
    super(scope, name)

    const {
      ociConfig,
      providerConfig,
      region,
      cfAccountId,
      cfAllowedIdpIds,
      cfAdminGroupId,
      cfAdminServiceTokenId,
      cfSshUsername,
      cfSshPassword,
      terraformSshPublicKey,
    } = props

    const ociProvider = new oci.provider.OciProvider(
      this,
      `provider-${providerConfig.config.alias}`,
      {
        ...providerConfig.config,
        privateKey: providerConfig.privateKey,
        region: region,
      }
    )

    const profile = ociProvider.alias ? ociProvider.alias : "missing"
    const tenancyId = providerConfig.config.tenancy_ocid

    // Restrict instances to the current region
    const instances = new Map<string, InstanceConfig>()
    for (const [name, instance] of ociConfig.instances) {
      if (instance.region === region) {
        instances.set(name, instance)
      }
    }

    // Create base infrastructure
    const base = new Base(this, "base", {
      networking: ociConfig.networking,
      profile: profile,
      region: region,
      tenancyId: tenancyId,
    })

    for (const [name, instance] of instances) {
      // Create a tunnel for each instance
      const tunnel = new Tunnel.Tunnel(this, "tunnel", {
        cfAccountId: cfAccountId,
        cfAdminGroupId: cfAdminGroupId,
        cfAdminServiceTokenId: cfAdminServiceTokenId,
        cfAllowedIdpIds: cfAllowedIdpIds,
        instance: { name, instance },
      })

      // Create each instance
      const compute = new Compute.Compute(this, "compute", {
        cfAccountId: cfAccountId,
        cfSshCertificate: tunnel.sshCertificate,
        cfSshPassword: cfSshPassword,
        cfSshUsername: cfSshUsername,
        cfTunnelSecret: tunnel.tunnelSecret.toString(),
        cfTunnel: tunnel.tunnel,
        compartmentId: base.identityCompartment.id,
        instance: { name, instance },
        region: region,
        subnetId: base.publicSubnet.id,
        terraformSshPublicKey: terraformSshPublicKey,
      })

      // Create a record pointing to the instance
      new cloudflare.record.Record(this, "instance_record", {
        name: `${instance.name}.${profile}.${instance.domain}`,
        proxied: false,
        type: "A",
        value: compute.coreInstance.publicIp,
        zoneId: tunnel.cloudflareZones.zones.get(0).id,
      })
    }

    // Outputs
    /*
    new cdktf.TerraformOutput(this, "compartment-id", {
      value: base.compartmentIdOutput,
    });
    new cdktf.TerraformOutput(this, "compartment-name", {
      value: base.compartmentNameOutput,
    });
    new cdktf.TerraformOutput(this, "private-subnet-dns_label", {
      value: base.privateSubnetDnsLabelOutput,
    });
    new cdktf.TerraformOutput(this, "private-subnet-id", {
      value: base.privateSubnetIdOutput,
    });
    new cdktf.TerraformOutput(this, "private-subnet-name", {
      value: base.privateSubnetNameOutput,
    });
    new cdktf.TerraformOutput(this, "private-subnet-subnet_domain_name", {
      value: base.privateSubnetSubnetDomainNameOutput,
    });
    new cdktf.TerraformOutput(this, "public-subnet-dns_label", {
      value: base.publicSubnetDnsLabelOutput,
    });
    new cdktf.TerraformOutput(this, "public-subnet-id", {
      value: base.publicSubnetIdOutput,
    });
    new cdktf.TerraformOutput(this, "public-subnet-name", {
      value: base.publicSubnetNameOutput,
    });
    new cdktf.TerraformOutput(this, "public-subnet-subnet_domain_name", {
      value: base.publicSubnetSubnetDomainNameOutput,
    });
    new cdktf.TerraformOutput(this, "vcn-dns_label", {
      value: base.vcnDnsLabelOutput,
    });
    new cdktf.TerraformOutput(this, "vcn-domain_name", {
      value: base.vcnDomainNameOutput,
    });
    new cdktf.TerraformOutput(this, "vcn-id", {
      value: base.vcnIdOutput,
    });
    new cdktf.TerraformOutput(this, "vcn-name", {
      value: base.vcnNameOutput,
    });
    new cdktf.TerraformOutput(this, "boot-volumes", {
      value: compute.bootVolumesOutput,
    });
    new cdktf.TerraformOutput(this, "instance-OCID", {
      value: compute.instanceOcidOutput,
    });
    new cdktf.TerraformOutput(this, "instance-boot-volume", {
      value: compute.instanceBootVolumeOutput,
    });
    new cdktf.TerraformOutput(this, "instance-name", {
      value: compute.instanceNameOutput,
    });
    new cdktf.TerraformOutput(this, "instance-public-ip", {
      value: compute.instancePublicIpOutput,
    });
    */
  }
}

/*
    // Outputs
    new cdktf.TerraformOutput(this, "availability-domains", {
      value: this.availabilityDomain,
    });
    new cdktf.TerraformOutput(this, "boot-volumes", {
      value: this.bootVolumes,
    });
    new cdktf.TerraformOutput(this, "instance-OCID", {
      value: `\${zipmap(values(${this.instance.fqn})[*].display_name, values(${this.instance.fqn})[*].id)}`,
    });
    new cdktf.TerraformOutput(this, "instance-OCPUs", {
      value: `\${zipmap(values(${this.instance.fqn})[*].display_name, values(${this.instance.fqn})[*].shape_config[0].ocpus)}`,
    });
    new cdktf.TerraformOutput(this, "instance-boot-volume", {
      value: `\${values(${this.instance.fqn})[*].boot_volume_id}`,
    });
    new cdktf.TerraformOutput(this, "instance-memory-in-GBs", {
      value: `\${zipmap(values(${this.instance.fqn})[*].display_name, values(${this.instance.fqn})[*].shape_config[0].memory_in_gbs)}`,
    });
    new cdktf.TerraformOutput(this, "instance-name", {
      value: `\${values(${this.instance.fqn})[*].display_name}`,
    });
    new cdktf.TerraformOutput(this, "instance-public-ip", {
      value: `\${zipmap(values(${this.instance.fqn})[*].display_name, values(${this.instance.fqn})[*].public_ip)}`,
    });
    new cdktf.TerraformOutput(this, "instance-region", {
      value: `\${zipmap(values(${this.instance.fqn})[*].display_name, values(${this.instance.fqn})[*].region)}`,
    });
    new cdktf.TerraformOutput(this, "instance-shape", {
      value: `\${zipmap(values(${this.instance.fqn})[*].display_name, values(${this.instance.fqn})[*].shape)}`,
    });
    new cdktf.TerraformOutput(this, "instance-state", {
      value: `\${zipmap(values(${this.instance.fqn})[*].display_name, values(${this.instance.fqn})[*].state)}`,
    });
    new cdktf.TerraformOutput(this, "time-created", {
      value: `\${zipmap(values(${this.instance.fqn})[*].display_name, values(${this.instance.fqn})[*].time_created)}`,
    });
*/
