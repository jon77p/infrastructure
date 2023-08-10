import * as cdktf from "cdktf"
import * as cloudflare from "@cdktf/provider-cloudflare"
import path = require("path")
import * as random from "@cdktf/provider-random"
import { MultiRegionOCI } from "./oci/main"

import * as tailscale from "./.gen/providers/tailscale"

import { Construct } from "constructs"
import { App, TerraformStack, TerraformVariable, VariableType } from "cdktf"
import { OCIConfig } from "./oci/main"

require("json5/lib/register") // eslint-disable-line no-eval

class InfrastructureStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name)

    new cdktf.CloudBackend(this, {
      hostname: "app.terraform.io",
      organization: "jon77p-xyz",
      workspaces: new cdktf.NamedCloudWorkspace("infrastructure"),
    })

    // Terraform Vars
    const cfAccountId = new TerraformVariable(this, "cf_account_id", {
      description: "The Cloudflare UUID for the Account the Zone lives in.",
      sensitive: true,
      type: "string",
    })
    const cfAdminGroupId = new TerraformVariable(this, "cf_admin_group_id", {
      description: "Id of administrator Cloudflare group",
      type: "string",
    })
    const cfAllowedIdpIds = new TerraformVariable(this, "cf_allowed_idp_ids", {
      default: [],
      description: "list of allowed Cloudflare IDP ids",
      type: "list(string)",
    })
    const cfApiToken = new TerraformVariable(this, "cf_api_token", {
      description: "Cloudflare API token",
      sensitive: true,
      type: "string",
    })
    const cfEmail = new TerraformVariable(this, "cf_email", {
      description: "Cloudflare email",
      type: "string",
    })
    const cfSshPassword = new TerraformVariable(this, "cf_ssh_password", {
      description:
        "Password for user for sshing with Cloudflare short-lived certificates",
      sensitive: true,
      type: "string",
    })
    const cfSshUsername = new TerraformVariable(this, "cf_ssh_username", {
      description:
        "Username for sshing with Cloudflare short-lived certificates",
      type: "string",
    })
    const ociAuthPrivateKey = new TerraformVariable(
      this,
      "oci_auth_private_key",
      {
        description: "Private key used for authenticating to OCI for providers",
        sensitive: true,
        type: "string",
      }
    )
    const terraformSshPublicKey = new TerraformVariable(
      this,
      "terraform_ssh_public_key",
      {
        description: "Public Key for Terraform-created compute instances",
        sensitive: true,
        type: "string",
      }
    )
    const tailscale_tailnet = new TerraformVariable(this, "tailscale_tailnet", {
      description: "Tailscale tailnet",
      type: "string",
    })
    const tailscale_api_key = new TerraformVariable(this, "tailscale_api_key", {
      description: "Tailscale api key",
      sensitive: true,
      type: "string",
    })
    const gfCloudStackId = new TerraformVariable(
      this,
      "grafana_cloud_stack_id",
      {
        description: "Grafana Cloud Stack Id",
        type: "string",
      }
    )
    const gfCloudApiKey = new TerraformVariable(this, "grafana_cloud_api_key", {
      description: "Grafana Cloud API key",
      sensitive: true,
      type: "string",
    })

    const authConfig = new TerraformVariable(this, "oci", {
      description: "map containing OCI authentication information",
      type: VariableType.map(
        VariableType.object({
          user_ocid: VariableType.STRING,
          fingerprint: VariableType.STRING,
          tenancy_ocid: VariableType.STRING,
        })
      ),
      default: {},
    })

    // Read infrastructure config from local file
    const ociConfig: Map<string, OCIConfig> = require(path.join(
      __dirname,
      "infrastructure.json5",
    ))

    // Providers
    new cloudflare.provider.CloudflareProvider(this, "cloudflare", {
      apiToken: cfApiToken.value,
    })
    new random.provider.RandomProvider(this, "random")
    new tailscale.provider.TailscaleProvider(this, "tailscale", {
      apiKey: tailscale_api_key.value,
      tailnet: tailscale_tailnet.value,
    })

    // Create pre-authentication tailscale key
    const tailscale_auth_key = new tailscale.tailnetKey.TailnetKey(
      this,
      "tailscale_auth_key",
      {
        reusable: true,
        ephemeral: false,
        preauthorized: true,
      }
    )

    // Iterate over ociConfig map and create OCI constructs
    for (const [name, config] of Object.entries(ociConfig)) {
      new MultiRegionOCI(this, name, {
        name: name,
        config: config,
        authConfig: authConfig,
        ociAuthPrivateKey: ociAuthPrivateKey.value,
        cfConfig: {
          accountId: cfAccountId.value,
          adminGroupId: cfAdminGroupId.value,
          allowedIdpIds: cfAllowedIdpIds.value,
          email: cfEmail.value,
          sshPassword: cfSshPassword.value,
          sshUsername: cfSshUsername.value,
        },
        grafanaConfig: {
          stackId: gfCloudStackId.value,
          apiKey: gfCloudApiKey.value,
        },
        terraformSshPublicKey: terraformSshPublicKey.value,
        tailscale_auth_key: tailscale_auth_key.key,
      })
    }
  }
}

const app = new App()
new InfrastructureStack(app, "cdktf")
app.synth()
