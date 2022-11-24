import * as cloudflare from "@cdktf/provider-cloudflare"
import * as oci from "../.gen/providers/oci"

import { Base, NetworkingConfig } from "./common/base"
import * as Compute from "./compute/main"
import { Tunnel, CFConfig } from "./tunnel/main"

import { Construct } from "constructs"
import { Token, TerraformOutput } from "cdktf"

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

interface OCIProps {
  config: OCIConfig
  providerConfig: { config: oci.provider.OciProviderConfig; privateKey: string }
  region: string
  cfConfig: CFConfig
  terraformSshPublicKey: string
}

export class OCI extends Construct {
  constructor(scope: Construct, name: string, props: OCIProps) {
    super(scope, name)

    const { config, providerConfig, region, cfConfig, terraformSshPublicKey } =
      props

    const profile = providerConfig.config.alias
      ? providerConfig.config.alias
      : "missing"
    const tenancyId = Token.asString(providerConfig.config.tenancyOcid)

    // Providers
    new TerraformOutput(this, `${name}-provider-config`, {
      value: providerConfig.config,
    })

    let ociProvider = new oci.provider.OciProvider(this, `${name}-oci`, {
      tenancyOcid: providerConfig.config.tenancyOcid,
      userOcid: providerConfig.config.userOcid,
      fingerprint: providerConfig.config.fingerprint,
      privateKey: providerConfig.privateKey,
      region: region,
      alias: providerConfig.config.alias,
    })

    // Create base infrastructure
    const base = new Base(this, `${name}-base`, {
      networking: config.networking,
      profile: profile,
      region: region,
      tenancyId: tenancyId,
      ociProvider,
    })

    // Iterate over instances and create compute and tunnel resources
    for (const [instanceName, instance] of Object.entries(config.instances)) {
      // Skip if the instance is not in the current region
      if (instance.region !== region) {
        continue
      }

      // Create a tunnel for each instance
      const tunnel = new Tunnel(this, `${name}-${instanceName}-tunnel`, {
        config: cfConfig,
        instance: { name: instanceName, instance },
      })

      // Create each instance
      const compute = new Compute.Compute(
        this,
        `${name}-${instanceName}-compute`,
        {
          cfConfig,
          cfSshCertificate: tunnel.sshCertificate,
          cfTunnel: {
            name: tunnel.tunnel.name,
            id: tunnel.tunnel.id,
            secret: tunnel.tunnelSecret.toString(),
          },
          compartmentId: base.identityCompartment.id,
          instance: { name: instanceName, instance },
          region: region,
          subnetId: base.publicSubnet.id,
          terraformSshPublicKey: terraformSshPublicKey,
          ociProvider,
        }
      )

      // Create a record pointing to the instance
      new cloudflare.record.Record(this, `${name}-${instanceName}-record`, {
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
