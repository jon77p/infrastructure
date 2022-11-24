import * as cloudflare from "@cdktf/provider-cloudflare"
import * as random from "@cdktf/provider-random"

import { Construct } from "constructs"

import { InstanceConfig } from "../main"

interface TunnelStackConfig {
  cfAccountId: string
  cfAllowedIdpIds: string[]
  cfAdminGroupId: string
  cfAdminServiceTokenId: string
  instance: { name: string; instance: InstanceConfig }
}

export class Tunnel extends Construct {
  public readonly tunnelSecret: random.id.Id
  public readonly cloudflareZones: cloudflare.dataCloudflareZones.DataCloudflareZones
  public readonly sshCertificate: cloudflare.accessCaCertificate.AccessCaCertificate
  public readonly tunnel: cloudflare.argoTunnel.ArgoTunnel

  constructor(scope: Construct, name: string, config: TunnelStackConfig) {
    super(scope, name)

    const {
      cfAccountId,
      cfAllowedIdpIds,
      cfAdminGroupId,
      cfAdminServiceTokenId,
      instance,
    } = config

    // Initialize random provider
    new random.provider.RandomProvider(this, `${name}-random`, {
      alias: `${name}-random`,
    })

    // Create a random string for the tunnel secret
    this.tunnelSecret = new random.id.Id(this, "tunnel_secret", {
      byteLength: 35,
    })

    this.cloudflareZones =
      new cloudflare.dataCloudflareZones.DataCloudflareZones(this, "cf_zones", {
        filter: {
          accountId: cfAccountId,
          lookupType: "exact",
          name: instance.instance.domain,
          status: "active",
        },
      })

    const sshDomain = `${
      instance.instance.isSubdomain
        ? `ssh-${instance.name}.${instance.instance.domain}`
        : `ssh.${instance.instance.domain}`
    }`

    const sshApp = new cloudflare.accessApplication.AccessApplication(
      this,
      "ssh_app",
      {
        allowedIdps: cfAllowedIdpIds,
        appLauncherVisible: false,
        autoRedirectToIdentity: true,
        domain: sshDomain,
        name: sshDomain,
        sessionDuration: "24h",
        type: "ssh",
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
          group: [cfAdminGroupId],
        },
      ],
      name: `Policy for ${sshDomain}`,
      precedence: 2,
      zoneId: this.cloudflareZones.zones.get(0).id,
    })

    new cloudflare.accessPolicy.AccessPolicy(this, "ssh_service_token_policy", {
      applicationId: sshApp.id,
      decision: "non_identity",
      include: [
        {
          serviceToken: [cfAdminServiceTokenId],
        },
      ],
      name: `Service Token Auth Policy for ${sshDomain}`,
      precedence: 1,
      zoneId: this.cloudflareZones.zones.get(0).id,
    })

    this.tunnel = new cloudflare.argoTunnel.ArgoTunnel(this, `tunnel_${name}`, {
      accountId: cfAccountId,
      name: name,
      secret: this.tunnelSecret.b64Std,
    })

    const tunnelDomain = `${
      instance.instance.isSubdomain
        ? `tunnel-${instance.name}.${instance.instance.domain}`
        : `tunnel.${instance.instance.domain}`
    }`

    new cloudflare.record.Record(this, `ssh_app_${name}`, {
      name: `${instance.instance.isSubdomain ? `ssh-${instance.name}` : "ssh"}`,
      proxied: true,
      type: "CNAME",
      value: tunnelDomain,
      zoneId: this.cloudflareZones.zones.get(0).id,
    })

    new cloudflare.record.Record(this, `tunnel_app_${name}`, {
      name: `${
        instance.instance.isSubdomain ? `tunnel-${instance.name}` : "tunnel"
      }`,
      proxied: true,
      type: "CNAME",
      value: `${this.tunnel.fqn}.cfargotunnel.com`,
      zoneId: this.cloudflareZones.zones.get(0).id,
    })
  }
}
