import * as oci from "../../.gen/providers/oci"

import { Construct } from "constructs"

import { TerraformAsset, Fn } from "cdktf"
import * as path from "path"

import { InstanceConfig } from "../main"

interface ComputeStackConfig {
  compartmentId: string
  region: string
  terraformSshPublicKey: string
  instance: { name: string; instance: InstanceConfig }
  subnetId: string
  cfAccountId: string
  cfTunnel: {
    id: string
    name: string
  }
  cfTunnelSecret: string
  cfSshUsername: string
  cfSshPassword: string
  cfSshCertificate: {
    id: string
    aud: string
    publicKey: string
  }
}

export class Compute extends Construct {
  public readonly availabilityDomain: oci.dataOciIdentityAvailabilityDomain.DataOciIdentityAvailabilityDomain
  public readonly bootVolumes: oci.dataOciCoreBootVolumes.DataOciCoreBootVolumes
  public readonly coreInstance: oci.coreInstance.CoreInstance

  constructor(scope: Construct, name: string, config: ComputeStackConfig) {
    super(scope, name)

    const {
      compartmentId,
      terraformSshPublicKey,
      instance,
      subnetId,
      cfAccountId,
      cfTunnel,
      cfTunnelSecret,
      cfSshUsername,
      cfSshPassword,
      cfSshCertificate,
    } = config

    this.availabilityDomain =
      new oci.dataOciIdentityAvailabilityDomain.DataOciIdentityAvailabilityDomain(
        this,
        "ads",
        {
          adNumber: instance.instance.adNumber,
          compartmentId: compartmentId,
        }
      )

    this.bootVolumes = new oci.dataOciCoreBootVolumes.DataOciCoreBootVolumes(
      this,
      "all_boot_volumes",
      {
        availabilityDomain: this.availabilityDomain.name,
        compartmentId: compartmentId,
      }
    )

    // Load setup script
    const templateFile = new TerraformAsset(this, "setup-script", {
      path: path.resolve(__dirname, "setup.tpl"),
    })

    // Filter to match on boot volumes that start with the instance name and are in the available state
    this.bootVolumes.addOverride("filter", {
      "display-name": {
        regex: true,
        values: [instance.name],
      },
      state: {
        values: ["AVAILABLE"],
      },
    })

    let sourceId = `${
      this.bootVolumes.count == 1
        ? this.bootVolumes.bootVolumes.get(0).id
        : instance.instance.imageId
    }`
    let sourceType = `${this.bootVolumes.count == 1 ? "bootVolume" : "image"}`

    this.coreInstance = new oci.coreInstance.CoreInstance(
      this,
      "ubuntu_instance",
      {
        availabilityDomain: this.availabilityDomain.name,
        compartmentId: compartmentId,
        createVnicDetails: {
          assignPrivateDnsRecord: true,
          assignPublicIp: "true",
          hostnameLabel: instance.name,
          subnetId: subnetId,
        },
        displayName: instance.instance.name,
        metadata: {
          ssh_authorized_keys: `ssh-rsa ${terraformSshPublicKey} terraform`,
          user_data: Fn.base64gzip(
            Fn.templatefile(templateFile.path, {
              cf_account: cfAccountId,
              cf_tunnel_id: cfTunnel.id,
              cf_tunnel_name: cfTunnel.name,
              cf_tunnel_secret: cfTunnelSecret,
              cf_ssh_certificate: cfSshCertificate.publicKey,
              cf_ssh_username: cfSshUsername,
              cf_ssh_password: cfSshPassword,
              hostname: instance.name,
              ssh_subdomain: `${
                instance.instance.isSubdomain
                  ? `ssh-${instance.instance.name}.${instance.instance.domain}`
                  : `ssh.${instance.instance.domain}`
              }`,
              tunnel_subdomain: `${
                instance.instance.isSubdomain
                  ? `tunnel-${instance.instance.name}.${instance.instance.domain}`
                  : `tunnel.${instance.instance.domain}`
              }`,
            })
          ),
        },
        preserveBootVolume: true,
        shape: instance.instance.shape,
        shapeConfig: {
          memoryInGbs: instance.instance.memory,
          ocpus: instance.instance.ocpus,
        },
        sourceDetails: {
          sourceId: sourceId,
          sourceType: sourceType,
        },
      }
    )
  }
}
