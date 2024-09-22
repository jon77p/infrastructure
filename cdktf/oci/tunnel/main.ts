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

export const RecordComment = `Managed by cdktf. {tag=cdktf, repo=https://github.com/jon77p/infrastructure}`

export class Tunnel extends Construct {
  public readonly tunnelSecret: random.id.Id
  public readonly cloudflareZones: cloudflare.dataCloudflareZones.DataCloudflareZones
  public readonly sshCertificate: cloudflare.zeroTrustAccessShortLivedCertificate.ZeroTrustAccessShortLivedCertificate | null
  public readonly tunnel: cloudflare.zeroTrustTunnelCloudflared.ZeroTrustTunnelCloudflared | null

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

    if (instance.instance.use_tunnel === false) {
      this.sshCertificate = null
      this.tunnel = null
      return
    }

    const sshDomain = `${
      instance.instance.is_subdomain
        ? `ssh-${instance.name}.${instance.instance.domain}`
        : `ssh.${instance.instance.domain}`
    }`

    const sshApp =
      new cloudflare.zeroTrustAccessApplication.ZeroTrustAccessApplication(
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
      new cloudflare.zeroTrustAccessShortLivedCertificate.ZeroTrustAccessShortLivedCertificate(
        this,
        "ssh_certificate",
        {
          applicationId: sshApp.id,
          zoneId: this.cloudflareZones.zones.get(0).id,
        }
      )

    new cloudflare.zeroTrustAccessPolicy.ZeroTrustAccessPolicy(
      this,
      "ssh_policy",
      {
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
      }
    )

    this.tunnel =
      new cloudflare.zeroTrustTunnelCloudflared.ZeroTrustTunnelCloudflared(
        this,
        `tunnel_${name}`,
        {
          accountId: config.accountId,
          name: instance.name,
          secret: this.tunnelSecret.b64Std,
          configSrc: "cloudflare",
        }
      )

    const tunnelDomain = `${
      instance.instance.is_subdomain
        ? `tunnel-${instance.name}.${instance.instance.domain}`
        : `tunnel.${instance.instance.domain}`
    }`

    const sshRecord = new cloudflare.record.Record(this, `ssh_app_${name}`, {
      comment: RecordComment,
      content: tunnelDomain,
      name: `${
        instance.instance.is_subdomain ? `ssh-${instance.name}` : "ssh"
      }`,
      proxied: true,
      type: "CNAME",
      zoneId: this.cloudflareZones.zones.get(0).id,
    })

    const tunnelRecord = new cloudflare.record.Record(
      this,
      `tunnel_app_${name}`,
      {
        comment: RecordComment,
        content: this.tunnel.cname,
        name: `${
          instance.instance.is_subdomain ? `tunnel-${instance.name}` : "tunnel"
        }`,
        proxied: true,
        type: "CNAME",
        zoneId: this.cloudflareZones.zones.get(0).id,
      }
    )

    new cloudflare.zeroTrustTunnelCloudflaredConfig.ZeroTrustTunnelCloudflaredConfigA(
      this,
      `tunnel_config_${name}`,
      {
        accountId: config.accountId,
        tunnelId: this.tunnel.id,
        config: {
          warpRouting: {
            enabled: true,
          },
          ingressRule: [
            {
              hostname: `${sshRecord.hostname}`,
              service: `ssh://${instance.name}:22`,
            },
            {
              hostname: "*",
              path: "^/_healthcheck$",
              service: "http_status:200",
            },
            {
              hostname: "*",
              path: "^/metrics$",
              service: "http://localhost:2000",
            },
            {
              hostname: "*",
              path: "^/ready$",
              service: "http://localhost:2000",
            },
            {
              hostname: `${tunnelRecord.hostname}`,
              service: "hello-world",
            },
            // Add all custom ingress routes for the current hostname here
            ...instance.instance.ingress.map((ingress) => ({
              hostname: `${ingress.hostname}`,
              path: ingress.path ? ingress.path : undefined,
              service: ingress.service,
              // Add all originRequest properties if they exist
              originRequest: ingress.originRequest
                ? ingress.originRequest
                : undefined,
            })),
            {
              service: "http_status:404",
            },
          ],
        },
      }
    )

    // Make sure a CNAME record exists for each unique ingress hostname
    instance.instance.ingress.forEach((ingress) => {
      // If hostname is "*", not present, or the same as the tunnel domain or ssh domain, skip
      if (
        ingress.hostname === "*" ||
        ingress.hostname === undefined ||
        ingress.hostname === tunnelDomain ||
        ingress.hostname === sshDomain
      ) {
        return
      }

      let name = ingress.hostname.replace(/\./g, "_")
      let domain = name

      // If the hostname is a subdomain, fetch the domain name
      if (ingress.hostname.split(".").length > 2) {
        domain = ingress.hostname.split(".").slice(1).join("_")
      }

      let zoneId = this.cloudflareZones.zones.get(0).id

      // If the domain does not match the tunnel domain, fetch the zone id for the domain
      if (domain !== tunnelDomain.split(".").slice(1).join("_")) {
        let zone = new cloudflare.dataCloudflareZones.DataCloudflareZones(
          this,
          `cf_zones_${domain}`,
          {
            filter: {
              accountId: config.accountId,
              lookupType: "exact",
              name: ingress.hostname.split(".").slice(1).join("."),
              status: "active",
            },
          }
        )
        zoneId = zone.zones.get(0).id
      }

      new cloudflare.record.Record(this, `ingress_record_${name}`, {
        comment: RecordComment,
        content: tunnelDomain,
        name: ingress.hostname,
        proxied: true,
        type: "CNAME",
        zoneId: zoneId,
      })
    })
  }
}
