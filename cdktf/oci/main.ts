import * as cloudflare from "@cdktf/provider-cloudflare"
import * as oci from "../.gen/providers/oci"
import { OciProviderConfig } from "../.gen/providers/oci/provider"

import { Base, NetworkingConfig } from "./common/base"
import * as Compute from "./compute/main"
import { Tunnel, CFConfig } from "./tunnel/main"

import { Construct } from "constructs"
import { Token, TerraformVariable, Fn } from "cdktf"

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
  is_subdomain: boolean
  ad_number: number
  region: string
  image_id: string
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
  tailscale_auth_key: string
}

export class OCI extends Construct {
  constructor(scope: Construct, name: string, props: OCIProps) {
    super(scope, name)

    const {
      config,
      providerConfig,
      region,
      cfConfig,
      terraformSshPublicKey,
      tailscale_auth_key,
    } = props

    const profile = providerConfig.config.alias
      ? providerConfig.config.alias
      : "missing"
    const tenancyId = Token.asString(providerConfig.config.tenancyOcid)

    // OCI Provider
    const ociProvider = new oci.provider.OciProvider(this, `${name}-oci`, {
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
            secret: tunnel.tunnelSecret.id,
          },
          compartmentId: base.identityCompartment.id,
          instance: { name: instanceName, instance },
          region: region,
          subnetId: base.publicSubnet.id,
          terraformSshPublicKey: terraformSshPublicKey,
          ociProvider,
          tailscale_auth_key,
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
  }
}

export class MultiRegionOCI extends Construct {
  constructor(
    scope: Construct,
    name: string,
    props: {
      name: string
      config: OCIConfig
      authConfig: TerraformVariable
      ociAuthPrivateKey: string
      cfConfig: CFConfig
      terraformSshPublicKey: string
      tailscale_auth_key: string
    }
  ) {
    super(scope, name)

    // Get the auth config for the current name
    const { tenancyOcid, userOcid, fingerprint } = this.getAuthConfig(
      props.authConfig,
      props.name
    )

    // Iterate number of region times to create a provider for each configured region
    for (const region of props.config.regions) {
      const regionConfig: OciProviderConfig = {
        alias: `${
          props.config.regions.length > 1
            ? `${props.name}-${region}`
            : props.name
        }`,
        tenancyOcid,
        userOcid,
        fingerprint,
        region,
      }

      new OCI(this, Token.asString(regionConfig.alias), {
        providerConfig: {
          config: regionConfig,
          privateKey: props.ociAuthPrivateKey,
        },
        config: props.config,
        cfConfig: props.cfConfig,
        region: region,
        terraformSshPublicKey: props.terraformSshPublicKey,
        tailscale_auth_key: props.tailscale_auth_key,
      })
    }
  }

  getAuthConfig(authConfig: TerraformVariable, name: string) {
    // This is one solution that matches what was used in the original terraform code
    /*
    return {
      tenancyOcid: `\${var.oci[\"${name}\"].tenancy_ocid}`,
      userOcid: `\${var.oci[\"${name}\"].user_ocid}`,
      fingerprint: `\${var.oci[\"${name}\"].fingerprint}`,
    }
    */

    // Below is WORKING for output values, but rendered cdk.tf.json is different than terraform
    const authConfigName = Fn.lookup(authConfig.value, name, {
      alias: "",
      user_ocid: "",
      fingerprint: "",
      tenancy_ocid: "",
      regions: [""],
    })

    // Get tenancy_ocid from authConfig as Token
    const tenancyOcid = Fn.lookup(authConfigName, "tenancy_ocid", "")

    // Get user_ocid from authConfig as Token
    const userOcid = Fn.lookup(authConfigName, "user_ocid", "")

    // Get fingerprint from authConfig as Token
    const fingerprint = Fn.lookup(authConfigName, "fingerprint", "")

    return { tenancyOcid, userOcid, fingerprint }
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
