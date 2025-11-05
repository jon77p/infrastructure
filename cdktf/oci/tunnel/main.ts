import * as random from "@cdktf/provider-random"

import { DnsRecord } from "@cdktf/provider-cloudflare/lib/dns-record"
import { DataCloudflareZones } from "@cdktf/provider-cloudflare/lib/data-cloudflare-zones"
import { ZeroTrustAccessShortLivedCertificate } from "@cdktf/provider-cloudflare/lib/zero-trust-access-short-lived-certificate"
import { ZeroTrustAccessApplication } from "@cdktf/provider-cloudflare/lib/zero-trust-access-application"
import { ZeroTrustAccessPolicy } from "@cdktf/provider-cloudflare/lib/zero-trust-access-policy"
import { ZeroTrustTunnelCloudflared } from "@cdktf/provider-cloudflare/lib/zero-trust-tunnel-cloudflared"
import { ZeroTrustTunnelCloudflaredConfigA } from "@cdktf/provider-cloudflare/lib/zero-trust-tunnel-cloudflared-config"

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
  public readonly cloudflareZones: DataCloudflareZones
  public readonly sshCertificate: ZeroTrustAccessShortLivedCertificate | null
  public readonly tunnel: ZeroTrustTunnelCloudflared | null

  constructor(scope: Construct, name: string, props: TunnelProps) {
    super(scope, name)

    const { config, instance } = props

    // Create a random string for the tunnel secret
    this.tunnelSecret = new random.id.Id(this, "tunnel_secret", {
      byteLength: 35,
    })

    this.cloudflareZones = new DataCloudflareZones(this, "cf_zones", {
      account: {
        id: config.accountId,
      },
      // default name filter operator is "equal"
      name: `${instance.instance.domain}`,
      status: "active",
    })

    if (instance.instance.use_tunnel === false) {
      this.sshCertificate = null
      this.tunnel = null
      return
    }

    let zoneId = this.cloudflareZones.result.get(0).id

    const sshDomain = `${
      instance.instance.is_subdomain
        ? `ssh-${instance.name}.${instance.instance.domain}`
        : `ssh.${instance.instance.domain}`
    }`

    const sshPolicy = new ZeroTrustAccessPolicy(this, "ssh_policy", {
      accountId: config.accountId,
      decision: "allow",
      include: [
        {
          group: { id: config.adminGroupId },
        },
      ],
      name: `Policy for ${sshDomain}`,
    })

    const sshApp = new ZeroTrustAccessApplication(this, "ssh_app", {
      allowedIdps: config.allowedIdpIds,
      appLauncherVisible: false,
      autoRedirectToIdentity: true,
      domain: sshDomain,
      name: sshDomain,
      sessionDuration: "24h",
      type: "ssh",
      skipInterstitial: true,
      zoneId: zoneId,
      policies: [
        {
          id: sshPolicy.id,
          precedence: 2,
        },
      ],
    })

    this.sshCertificate = new ZeroTrustAccessShortLivedCertificate(
      this,
      "ssh_certificate",
      {
        appId: sshApp.id,
        zoneId: zoneId,
      }
    )

    this.tunnel = new ZeroTrustTunnelCloudflared(this, `tunnel_${name}`, {
      accountId: config.accountId,
      name: instance.name,
      tunnelSecret: this.tunnelSecret.b64Std,
      configSrc: "cloudflare",
    })

    const tunnelDomain = `${
      instance.instance.is_subdomain
        ? `tunnel-${instance.name}.${instance.instance.domain}`
        : `tunnel.${instance.instance.domain}`
    }`

    const sshRecord = new DnsRecord(this, `ssh_app_${name}`, {
      comment: RecordComment,
      content: tunnelDomain,
      name: `${
        instance.instance.is_subdomain ? `ssh-${instance.name}` : "ssh"
      }`,
      proxied: true,
      type: "CNAME",
      zoneId: zoneId,
      ttl: 300,
    })

    const tunnelRecord = new DnsRecord(this, `tunnel_app_${name}`, {
      comment: RecordComment,
      content: this.tunnel.name,
      name: `${
        instance.instance.is_subdomain ? `tunnel-${instance.name}` : "tunnel"
      }`,
      proxied: true,
      type: "CNAME",
      zoneId: zoneId,
      ttl: 300,
    })

    new ZeroTrustTunnelCloudflaredConfigA(this, `tunnel_config_${name}`, {
      accountId: config.accountId,
      tunnelId: this.tunnel.id,
      warpRoutingEnabled: true,
      config: {
        ingress: [
          {
            hostname: `${sshRecord.content}`,
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
            hostname: `${tunnelRecord.content}`,
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
    })

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

      // If the domain does not match the tunnel domain, fetch the zone id for the domain
      if (domain !== tunnelDomain.split(".").slice(1).join("_")) {
        let zone = new DataCloudflareZones(this, `cf_zones_${domain}`, {
          account: {
            id: config.accountId,
          },
          // default name filter operator is "equal"
          name: ingress.hostname.split(".").slice(1).join("."),
          status: "active",
        })
        zoneId = zone.result.get(0).id
      }

      new DnsRecord(this, `ingress_record_${name}`, {
        comment: RecordComment,
        content: tunnelDomain,
        name: ingress.hostname,
        proxied: true,
        type: "CNAME",
        zoneId: zoneId,
        ttl: 300,
      })
    })
  }
}
