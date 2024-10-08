import * as oci from "../../.gen/providers/oci"

import { Construct } from "constructs"

import { TerraformAsset, Fn, TerraformOutput } from "cdktf"
import * as path from "path"

import { InstanceConfig, GrafanaConfig } from "../main"
import { CFConfig, Tunnel } from "../tunnel/main"

interface ComputeProps {
  compartmentId: string
  region: string
  terraformSshPublicKey: string
  instance: { name: string; instance: InstanceConfig }
  subnetId: string
  cfConfig: CFConfig
  tunnel: Tunnel
  grafanaConfig: GrafanaConfig
  ociProvider: oci.provider.OciProvider
  tailscale_auth_key: string
}

export class Compute extends Construct {
  public readonly coreInstance: oci.coreInstance.CoreInstance

  constructor(scope: Construct, name: string, props: ComputeProps) {
    super(scope, name)

    const {
      compartmentId,
      ociProvider,
      terraformSshPublicKey,
      instance,
      subnetId,
      cfConfig,
      tunnel,
      grafanaConfig,
      tailscale_auth_key,
    } = props

    const availabilityDomain =
      new oci.dataOciIdentityAvailabilityDomain.DataOciIdentityAvailabilityDomain(
        this,
        "ads",
        {
          compartmentId: compartmentId,
          provider: ociProvider,
          adNumber: instance.instance.ad_number,
        }
      )

    const bootVolumes = new oci.dataOciCoreBootVolumes.DataOciCoreBootVolumes(
      this,
      "all_boot_volumes",
      {
        compartmentId: compartmentId,
        provider: ociProvider,
        availabilityDomain: availabilityDomain.name,
        filter: [
          {
            name: "display_name",
            values: [instance.name],
            regex: true,
          },
          {
            name: "state",
            values: ["AVAILABLE"],
          },
        ],
      }
    )

    // Load setup script
    const templateFile = new TerraformAsset(this, "setup-script", {
      path: path.resolve(__dirname, "setup.tpl"),
    })

    let cfPublicKey = "unknown"
    let tunnelID = "unknown"
    let tunnelName = "unknown"
    let tunnelSecret = "unknown"
    if (instance.instance.use_tunnel) {
      cfPublicKey = tunnel.sshCertificate?.publicKey ?? "unknown"
      tunnelID = tunnel.tunnel?.id ?? "unknown"
      tunnelName = tunnel.tunnel?.name ?? "unknown"
      tunnelSecret = tunnel.tunnelSecret.b64Std
    }

    this.coreInstance = new oci.coreInstance.CoreInstance(
      this,
      "ubuntu_instance",
      {
        compartmentId: compartmentId,
        provider: ociProvider,
        availabilityDomain: availabilityDomain.name,
        createVnicDetails: {
          assignPrivateDnsRecord: true,
          assignPublicIp: "true",
          hostnameLabel: instance.name,
          subnetId: subnetId,
        },
        displayName: instance.instance.name,
        metadata: {
          user_data: Fn.base64gzip(
            Fn.templatefile(templateFile.path, {
              cf_account: cfConfig.accountId,
              use_tunnel: instance.instance.use_tunnel,
              cf_tunnel_id: tunnelID,
              cf_tunnel_name: tunnelName,
              cf_tunnel_secret: tunnelSecret,
              cf_ssh_certificate: cfPublicKey,
              cf_ssh_username: cfConfig.sshUsername,
              cf_ssh_password: cfConfig.sshPassword,
              grafana_cloud_stack_id: grafanaConfig.stackId,
              grafana_cloud_api_key: grafanaConfig.apiKey,
              tailscale_auth_key: tailscale_auth_key,
              terraformSshPublicKey,
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
          isPreserveBootVolumeEnabled: true,
          /*eslint-disable no-useless-escape */
          sourceType: `\${\"${Fn.lengthOf(
            bootVolumes.bootVolumes
          )}\" == 1 ? "bootVolume" : "image"}`,
          sourceId: `\${\"${Fn.lengthOf(
            bootVolumes.bootVolumes
          )}\" == 1 ? "\${${bootVolumes.bootVolumes.get(0).id}}" : "${
            instance.instance.image_id
          }"}`,
          /*eslint-enable no-useless-escape */
        },
      }
    )

    // Switch to using the boot volume from the previous run if it exists
    if (Fn.lengthOf(bootVolumes.bootVolumes) > 0) {
      this.coreInstance.sourceDetails.sourceType = "bootVolume"
      this.coreInstance.sourceDetails.sourceId =
        bootVolumes.bootVolumes.get(0).id
    }

    // Outputs
    new TerraformOutput(this, "instance-display-name", {
      value: this.coreInstance.displayName,
    })
    new TerraformOutput(this, "instance-hostname", {
      value: this.coreInstance.createVnicDetails.hostnameLabel,
    })
    new TerraformOutput(this, "instance-source-details", {
      value: this.coreInstance.sourceDetails,
    })
    new TerraformOutput(this, "instance-boot-volume", {
      value: this.coreInstance.bootVolumeId,
    })
    new TerraformOutput(this, "boot-volumes", {
      value: bootVolumes,
    })
  }
}
