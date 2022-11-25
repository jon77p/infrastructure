import * as cloudflare from "@cdktf/provider-cloudflare"
import * as oci from "../.gen/providers/oci"

import { Base, NetworkingConfig } from "./common/base"
import * as Compute from "./compute/main"
import { Tunnel, CFConfig } from "./tunnel/main"

import { Construct } from "constructs"
import { Token, TerraformVariable, Fn, TerraformOutput } from "cdktf"

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
  home_region: string
  networking: NetworkingConfig
  instances: Map<string, InstanceConfig>
}

interface OCIProps {
  config: OCIConfig
  ociProvider: oci.provider.OciProvider
  region: string
  compartmentId: string
  cfConfig: CFConfig
  terraformSshPublicKey: string
  tailscale_auth_key: string
}

export class OCI extends Construct {
  constructor(scope: Construct, name: string, props: OCIProps) {
    super(scope, name)

    const {
      config,
      ociProvider,
      region,
      compartmentId,
      cfConfig,
      terraformSshPublicKey,
      tailscale_auth_key,
    } = props

    const profile = Token.asString(ociProvider.alias)

    // Create base infrastructure
    const base = new Base(this, `${name}-base`, {
      networking: config.networking,
      profile: profile,
      region: region,
      ociProvider,
      compartmentId,
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
            secret: tunnel.tunnelSecret.b64Std,
          },
          compartmentId,
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

    // Create record store for providers
    const ociProviders: Record<string, oci.provider.OciProvider> = {}

    // Create providers for all regions
    for (const region of props.config.regions) {
      const alias = `${
        props.config.regions.length > 1 ? `${props.name}-${region}` : props.name
      }`

      let ociProvider = new oci.provider.OciProvider(this, `${alias}-oci`, {
        tenancyOcid,
        userOcid,
        fingerprint,
        privateKey: props.ociAuthPrivateKey,
        region,
        alias,
      })

      ociProviders[region] = ociProvider
    }

    // Create a compartment for the resources
    // Note: the compartment can only be created by a provider in the home region
    // And the compartment is unique across all regions
    const identityCompartment = new oci.identityCompartment.IdentityCompartment(
      this,
      "terraform",
      {
        compartmentId: tenancyOcid,
        provider: ociProviders[props.config.home_region],
        description: "Compartment for Terraform resources.",
        name: "terraform",
      }
    )

    new TerraformOutput(this, "compartment-id", {
      value: identityCompartment.id,
    })
    new TerraformOutput(this, "compartment-name", {
      value: identityCompartment.name,
    })

    // Iterate number of region times to create a provider for each configured region
    for (const region of props.config.regions) {
      const alias = `${
        props.config.regions.length > 1 ? `${props.name}-${region}` : props.name
      }`

      new OCI(this, Token.asString(alias), {
        config: props.config,
        cfConfig: props.cfConfig,
        ociProvider: ociProviders[region],
        compartmentId: identityCompartment.id,
        region,
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
      user_ocid: "",
      fingerprint: "",
      tenancy_ocid: "",
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
