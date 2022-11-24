import * as cdktf from "cdktf"
import * as cloudflare from "@cdktf/provider-cloudflare"
import * as OCI from "./oci/main"

import { Construct } from "constructs"
import {
  App,
  TerraformStack,
  TerraformVariable,
  Token,
  VariableType,
  Fn,
} from "cdktf"
import { OCIConfig } from "./oci/main"

import { OciProviderConfig } from "./.gen/providers/oci/provider"

import path = require("path")

class MultiRegionOCIStack extends Construct {
  constructor(
    scope: Construct,
    name: string,
    props: {
      name: string
      config: OCIConfig
      ociAuthPrivateKey: string
      cfAccountId: string
      cfAdminGroupId: string
      cfAdminServiceTokenId: string
      cfAllowedIdpIds: string[]
      cfEmail: string
      cfSshPassword: string
      cfSshUsername: string
      terraformSshPublicKey: string
      authConfig: TerraformVariable
    }
  ) {
    super(scope, name)

    // Get the auth config for the current name
    let { tenancyOcid, userOcid, fingerprint } = this.getAuthConfig(
      props.authConfig,
      props.name
    )

    // Iterate number of region times to create a provider for each configured region
    for (const region of props.config.regions) {
      let regionConfig: OciProviderConfig = {
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

      new OCI.OCI(this, Token.asString(regionConfig.alias), {
        providerConfig: {
          config: regionConfig,
          privateKey: props.ociAuthPrivateKey,
        },
        config: props.config,
        cfAccountId: props.cfAccountId,
        cfAdminGroupId: props.cfAdminGroupId,
        cfAdminServiceTokenId: props.cfAdminServiceTokenId,
        cfAllowedIdpIds: props.cfAllowedIdpIds,
        cfEmail: props.cfEmail,
        cfSshPassword: props.cfSshPassword,
        cfSshUsername: props.cfSshUsername,
        region: region,
        terraformSshPublicKey: props.terraformSshPublicKey,
      })
    }
  }

  getAuthConfig(authConfig: TerraformVariable, name: string) {
    let authConfigName = Fn.lookup(authConfig.value, name, {
      alias: "",
      user_ocid: "",
      fingerprint: "",
      tenancy_ocid: "",
      regions: [""],
    })

    // Get tenancy_ocid from authConfig as Token
    let tenancyOcid = Fn.lookup(authConfigName, "tenancy_ocid", "")

    // Get user_ocid from authConfig as Token
    let userOcid = Fn.lookup(authConfigName, "user_ocid", "")

    // Get fingerprint from authConfig as Token
    let fingerprint = Fn.lookup(authConfigName, "fingerprint", "")

    return { tenancyOcid, userOcid, fingerprint }
  }
}

class MyStack extends TerraformStack {
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
    const cfAdminServiceTokenId = new TerraformVariable(
      this,
      "cf_admin_service_token_id",
      {
        description: "Id of administrator Cloudflare service token",
        type: "string",
      }
    )
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
    const authConfig = new TerraformVariable(this, "oci", {
      description: "map containing OCI authentication information",
      type: VariableType.map(
        VariableType.object({
          alias: VariableType.STRING,
          user_ocid: VariableType.STRING,
          fingerprint: VariableType.STRING,
          tenancy_ocid: VariableType.STRING,
          regions: VariableType.LIST_STRING,
        })
      ),
      default: {},
    })

    // Providers
    new cloudflare.provider.CloudflareProvider(this, "cloudflare", {
      apiToken: cfApiToken.value,
    })

    // Read infrastructure config from local file
    const ociConfig: Map<string, OCIConfig> = require(path.join(
      __dirname,
      "infrastructure.json"
    ))

    // Resources

    // Iterate over ociConfig map and create OCI stacks
    for (const [name, config] of Object.entries(ociConfig)) {
      new MultiRegionOCIStack(this, name, {
        name: name,
        config: config,
        ociAuthPrivateKey: ociAuthPrivateKey.value,
        cfAccountId: cfAccountId.value,
        cfAdminGroupId: cfAdminGroupId.value,
        cfAdminServiceTokenId: cfAdminServiceTokenId.value,
        cfAllowedIdpIds: cfAllowedIdpIds.value,
        cfEmail: cfEmail.value,
        cfSshPassword: cfSshPassword.value,
        cfSshUsername: cfSshUsername.value,
        terraformSshPublicKey: terraformSshPublicKey.value,
        authConfig: authConfig,
      })

      // Outputs
      /*
      new TerraformOutput(this, `${name}-boot-volumes`, {
        value: oci0Stack.bootVolumesOutput,
      });
      new TerraformOutput(this, `${name}-compartment-id`, {
        value: oci0Stack.compartmentIdOutput,
      });
      new TerraformOutput(this, `${name}-compartment-name`, {
        value: oci0Stack.compartmentNameOutput,
      });
      new TerraformOutput(this, `${name}-instance-OCID`, {
        value: oci0Stack.instanceOcidOutput,
      });
      new TerraformOutput(this, `${name}-instance-boot-volume`, {
        value: oci0Stack.instanceBootVolumeOutput,
      });
      new TerraformOutput(this, `${name}-instance-name`, {
        value: oci0Stack.instanceNameOutput,
      });
      new TerraformOutput(this, `${name}-instance-public-ip`, {
        value: oci0Stack.instancePublicIpOutput,
      });
      new TerraformOutput(this, `${name}-private-subnet-dns_label`, {
        value: oci0Stack.privateSubnetDnsLabelOutput,
      });
      new TerraformOutput(this, `${name}-private-subnet-id`, {
        value: oci0Stack.privateSubnetIdOutput,
      });
      new TerraformOutput(this, `${name}-private-subnet-name`, {
        value: oci0Stack.privateSubnetNameOutput,
      });
      new TerraformOutput(this, `${name}-private-subnet-subnet_domain_name`, {
        value: oci0Stack.privateSubnetSubnetDomainNameOutput,
      });
      new TerraformOutput(this, `${name}-public-subnet-dns_label`, {
        value: oci0Stack.publicSubnetDnsLabelOutput,
      });
      new TerraformOutput(this, `${name}-public-subnet-id`, {
        value: oci0Stack.publicSubnetIdOutput,
      });
      new TerraformOutput(this, `${name}-public-subnet-name`, {
        value: oci0Stack.publicSubnetNameOutput,
      });
      new TerraformOutput(this, `${name}-public-subnet-subnet_domain_name`, {
        value: oci0Stack.publicSubnetSubnetDomainNameOutput,
      });
      new TerraformOutput(this, `${name}-vcn-dns_label`, {
        value: oci0Stack.vcnDnsLabelOutput,
      });
      new TerraformOutput(this, `${name}-vcn-domain_name`, {
        value: oci0Stack.vcnDomainNameOutput,
      });
      new TerraformOutput(this, `${name}-vcn-id`, {
        value: oci0Stack.vcnIdOutput,
      });
      new TerraformOutput(this, `${name}-vcn-name`, {
        value: oci0Stack.vcnNameOutput,
      });
      */
    }
  }
}

const app = new App()
new MyStack(app, "cdktf")
app.synth()
