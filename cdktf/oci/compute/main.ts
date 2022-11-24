import * as oci from "../../.gen/providers/oci"

import { Construct } from "constructs"

import { TerraformAsset, Fn, TerraformOutput } from "cdktf"
import * as path from "path"

import { InstanceConfig } from "../main"
import { CFConfig } from "../tunnel/main"

interface ComputeProps {
  compartmentId: string
  region: string
  terraformSshPublicKey: string
  instance: { name: string; instance: InstanceConfig }
  subnetId: string
  cfConfig: CFConfig
  cfTunnel: {
    id: string
    name: string
    secret: string
  }
  cfSshCertificate: {
    id: string
    aud: string
    publicKey: string
  }
  ociProvider: oci.provider.OciProvider
}

export class Compute extends Construct {
  public readonly availabilityDomain: oci.dataOciIdentityAvailabilityDomain.DataOciIdentityAvailabilityDomain
  public readonly bootVolumes: oci.dataOciCoreBootVolumes.DataOciCoreBootVolumes
  public readonly coreInstance: oci.coreInstance.CoreInstance

  constructor(scope: Construct, name: string, props: ComputeProps) {
    super(scope, name)

    const {
      compartmentId,
      terraformSshPublicKey,
      instance,
      subnetId,
      cfConfig,
      cfTunnel,
      cfSshCertificate,
      ociProvider,
    } = props

    this.availabilityDomain =
      new oci.dataOciIdentityAvailabilityDomain.DataOciIdentityAvailabilityDomain(
        this,
        "ads",
        {
          compartmentId: compartmentId,
          provider: ociProvider,
          adNumber: instance.instance.adNumber,
        }
      )

    this.bootVolumes = new oci.dataOciCoreBootVolumes.DataOciCoreBootVolumes(
      this,
      "all_boot_volumes",
      {
        compartmentId: compartmentId,
        provider: ociProvider,
        availabilityDomain: this.availabilityDomain.name,
      }
    )

    // Load setup script
    const templateFile = new TerraformAsset(this, "setup-script", {
      path: path.resolve(__dirname, "setup.tpl"),
    })

    // Filter to match on boot volumes that start with the instance name and are in the available state
    this.bootVolumes.addOverride("filter", [
      {
        name: "display-name",
        regex: true,
        values: [instance.name],
      },
      {
        name: "state",
        values: ["AVAILABLE"],
      },
    ])

    const sourceId = `${
      this.bootVolumes.count == 1
        ? this.bootVolumes.bootVolumes.get(0).id
        : instance.instance.imageId
    }`
    const sourceType = `${this.bootVolumes.count == 1 ? "bootVolume" : "image"}`

    this.coreInstance = new oci.coreInstance.CoreInstance(
      this,
      "ubuntu_instance",
      {
        compartmentId: compartmentId,
        provider: ociProvider,
        availabilityDomain: this.availabilityDomain.name,
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
              cf_account: cfConfig.accountId,
              cf_tunnel_id: cfTunnel.id,
              cf_tunnel_name: cfTunnel.name,
              cf_tunnel_secret: cfTunnel.secret,
              cf_ssh_certificate: cfSshCertificate.publicKey,
              cf_ssh_username: cfConfig.sshUsername,
              cf_ssh_password: cfConfig.sshPassword,
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

    // Outputs
    new TerraformOutput(this, "boot-volumes", {
      value: this.bootVolumes,
    })
    new TerraformOutput(this, "instance-OCID", {
      value: this.coreInstance.id,
    })
    new TerraformOutput(this, "instance-boot-volume", {
      value: this.coreInstance.bootVolumeId,
    })
    new TerraformOutput(this, "instance-name", {
      value: this.coreInstance.displayName,
    })
    new TerraformOutput(this, "instance-public-ip", {
      value: this.coreInstance.publicIp,
    })
  }
}
