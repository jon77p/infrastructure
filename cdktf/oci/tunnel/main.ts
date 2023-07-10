import * as cloudflare from "@cdktf/provider-cloudflare"
import * as random from "@cdktf/provider-random"

import { Construct } from "constructs"

import { InstanceConfig } from "../main"

export interface CFConfig {
  accountId: string
  email: string
  allowedIdpIds: string[]
  adminGroupId: string
  sshUsername: string
  sshPassword: string
}

interface TunnelProps {
  config: CFConfig
  instance: { name: string; instance: InstanceConfig }
}

export class Tunnel extends Construct {
  public readonly tunnelSecret: random.id.Id
  public readonly cloudflareZones: cloudflare.dataCloudflareZones.DataCloudflareZones
  public readonly sshCertificate: cloudflare.accessCaCertificate.AccessCaCertificate
  public readonly tunnel: cloudflare.tunnel.Tunnel

  constructor(scope: Construct, name: string, props: TunnelProps) {
    super(scope, name)

    const { config, instance } = props

    // Create a random string for the tunnel secret
    this.tunnelSecret = new random.id.Id(this, "tunnel_secret", {
      byteLength: 35,
    })

    this.cloudflareZones =
      new cloudflare.dataCloudflareZones.DataCloudflareZones(this, "cf_zones", {
        filter: {
          accountId: config.accountId,
          lookupType: "exact",
          name: instance.instance.domain,
          status: "active",
        },
      })

    const sshDomain = `${
      instance.instance.is_subdomain
        ? `ssh-${instance.name}.${instance.instance.domain}`
        : `ssh.${instance.instance.domain}`
    }`

    const sshApp = new cloudflare.accessApplication.AccessApplication(
      this,
      "ssh_app",
      {
        allowedIdps: config.allowedIdpIds,
        appLauncherVisible: false,
        autoRedirectToIdentity: true,
        domain: sshDomain,
        name: sshDomain,
        sessionDuration: "24h",
        type: "ssh",
        skipInterstitial: true,
        zoneId: this.cloudflareZones.zones.get(0).id,
      }
    )

    this.sshCertificate =
      new cloudflare.accessCaCertificate.AccessCaCertificate(
        this,
        "ssh_certificate",
        {
          applicationId: sshApp.id,
          zoneId: this.cloudflareZones.zones.get(0).id,
        }
      )

    new cloudflare.accessPolicy.AccessPolicy(this, "ssh_policy", {
      applicationId: sshApp.id,
      decision: "allow",
      include: [
        {
          group: [config.adminGroupId],
        },
      ],
      name: `Policy for ${sshDomain}`,
      precedence: 2,
      zoneId: this.cloudflareZones.zones.get(0).id,
    })

    this.tunnel = new cloudflare.tunnel.Tunnel(this, `tunnel_${name}`, {
      accountId: config.accountId,
      name: instance.name,
      secret: this.tunnelSecret.b64Std,
    })

    const tunnelDomain = `${
      instance.instance.is_subdomain
        ? `tunnel-${instance.name}.${instance.instance.domain}`
        : `tunnel.${instance.instance.domain}`
    }`

    new cloudflare.record.Record(this, `ssh_app_${name}`, {
      name: `${
        instance.instance.is_subdomain ? `ssh-${instance.name}` : "ssh"
      }`,
      proxied: true,
      type: "CNAME",
      value: tunnelDomain,
      zoneId: this.cloudflareZones.zones.get(0).id,
    })

    new cloudflare.record.Record(this, `tunnel_app_${name}`, {
      name: `${
        instance.instance.is_subdomain ? `tunnel-${instance.name}` : "tunnel"
      }`,
      proxied: true,
      type: "CNAME",
      value: this.tunnel.cname,
      zoneId: this.cloudflareZones.zones.get(0).id,
    })
  }
}
