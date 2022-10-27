import * as cdktf from "cdktf"
import * as cloudflare from "@cdktf/provider-cloudflare"
import * as OCI from "./oci/main"

import { Construct } from "constructs"
import { App, TerraformStack } from "cdktf"
import { OCIAuthConfig, OCIConfig } from "./oci/main"

import path = require("path")

class MultiRegionOCIStack extends TerraformStack {
  constructor(
    scope: Construct,
    name: string,
    props: {
      name: string
      config: OCI.OCIConfig
      ociAuthPrivateKey: string
      cfAccountId: string
      cfAdminGroupId: string
      cfAdminServiceTokenId: string
      cfAllowedIdpIds: string[]
      cfEmail: string
      cfSshPassword: string
      cfSshUsername: string
      terraformSshPublicKey: string
    }
  ) {
    super(scope, name)

    // new cdktf.RemoteBackend(this, {
    //   organization: "jon77p-xyz",
    //   workspaces: [
    //     {
    //       name: "infrastructure",
    //     },
    //   ],
    // });

    new cdktf.CloudBackend(this, {
      hostname: "app.terraform.io",
      organization: "jon77p-xyz",
      workspaces: new cdktf.NamedCloudWorkspace("infrastructure"),
    })

    const authConfigVar = new cdktf.TerraformVariable(this, "oci", {
      description: "map containing OCI authentication information",
      default: Map<string, OCIAuthConfig>,
      // type: "map(object({alias = string, user_ocid = string, fingerprint = string, tenancy_ocid = string, regions = list(string)}))",
      // type: cdktf.VariableType.map(cdktf.VariableType.object(OCIAuthConfig)),
    })

    const authConfigValue = authConfigVar.value as Map<string, OCIAuthConfig>
    let allAuthConfig = new Map<string, OCIAuthConfig>()

    authConfigValue.forEach((value, key) => {
      allAuthConfig.set(key, value)
    })

    let authConfig = allAuthConfig.get(props.name) || {
      alias: "",
      user_ocid: "",
      fingerprint: "",
      tenancy_ocid: "",
      regions: []
    }

    // Iterate number of region times to create a provider for each region
    for (let i = 0; i < authConfig.regions.length; i++) {
      let region = authConfig.regions[i]

      let regionConfig: OCI.OCIAuthConfig = {
        ...authConfig,
        alias: `${
          authConfig.regions.length > 1
            ? `${props.name}-region${i}`
            : props.name
        }`,
      }

      new OCI.OCI(this, props.name, {
        providerConfig: {
          config: regionConfig,
          privateKey: props.ociAuthPrivateKey,
        },
        ociConfig: props.config,
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
}

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name)

    // new cdktf.RemoteBackend(this, {
    //   organization: "jon77p-xyz",
    //   workspaces: [
    //     {
    //       name: "infrastructure",
    //     },
    //   ],
    // });

    new cdktf.CloudBackend(this, {
      hostname: "app.terraform.io",
      organization: "jon77p-xyz",
      workspaces: new cdktf.NamedCloudWorkspace("infrastructure"),
    })

    // Terraform Vars
    const cfAccountId = new cdktf.TerraformVariable(this, "cf_account_id", {
      description: "The Cloudflare UUID for the Account the Zone lives in.",
      sensitive: true,
      type: "string",
    })
    const cfAdminGroupId = new cdktf.TerraformVariable(
      this,
      "cf_admin_group_id",
      {
        description: "Id of administrator Cloudflare group",
        type: "string",
      }
    )
    const cfAdminServiceTokenId = new cdktf.TerraformVariable(
      this,
      "cf_admin_service_token_id",
      {
        description: "Id of administrator Cloudflare service token",
        type: "string",
      }
    )
    const cfAllowedIdpIds = new cdktf.TerraformVariable(
      this,
      "cf_allowed_idp_ids",
      {
        default: [],
        description: "list of allowed Cloudflare IDP ids",
        type: "list(string)",
      }
    )
    const cfApiToken = new cdktf.TerraformVariable(this, "cf_api_token", {
      description: "Cloudflare API token",
      sensitive: true,
      type: "string",
    })
    const cfEmail = new cdktf.TerraformVariable(this, "cf_email", {
      description: "Cloudflare email",
      type: "string",
    })
    const cfSshPassword = new cdktf.TerraformVariable(this, "cf_ssh_password", {
      description:
        "Password for user for sshing with Cloudflare short-lived certificates",
      sensitive: true,
      type: "string",
    })
    const cfSshUsername = new cdktf.TerraformVariable(this, "cf_ssh_username", {
      description:
        "Username for sshing with Cloudflare short-lived certificates",
      type: "string",
    })
    const ociAuthPrivateKey = new cdktf.TerraformVariable(
      this,
      "oci_auth_private_key",
      {
        description: "Private key used for authenticating to OCI for providers",
        sensitive: true,
        type: "string",
      }
    )
    const terraformSshPublicKey = new cdktf.TerraformVariable(
      this,
      "terraform_ssh_public_key",
      {
        description: "Public Key for Terraform-created compute instances",
        sensitive: true,
        type: "string",
      }
    )

    // Providers
    new cloudflare.provider.CloudflareProvider(this, "cloudflare", {
      apiToken: cfApiToken.value,
    })

    // Read infrastructure config from local file
    let ociConfig: Map<string, OCIConfig> = require(path.join(
      __dirname,
      "infrastructure.json"
    ))

    // Resources

    // Iterate over ociConfig map and create OCI stacks
    for (let [name, config] of Object.entries(ociConfig)) {
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
      })
    }

    // Outputs
    /*
    new cdktf.TerraformOutput(this, "oci0-boot-volumes", {
      value: oci0Stack.bootVolumesOutput,
    });
    new cdktf.TerraformOutput(this, "oci0-compartment-id", {
      value: oci0Stack.compartmentIdOutput,
    });
    new cdktf.TerraformOutput(this, "oci0-compartment-name", {
      value: oci0Stack.compartmentNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci0-instance-OCID", {
      value: oci0Stack.instanceOcidOutput,
    });
    new cdktf.TerraformOutput(this, "oci0-instance-boot-volume", {
      value: oci0Stack.instanceBootVolumeOutput,
    });
    new cdktf.TerraformOutput(this, "oci0-instance-name", {
      value: oci0Stack.instanceNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci0-instance-public-ip", {
      value: oci0Stack.instancePublicIpOutput,
    });
    new cdktf.TerraformOutput(this, "oci0-private-subnet-dns_label", {
      value: oci0Stack.privateSubnetDnsLabelOutput,
    });
    new cdktf.TerraformOutput(this, "oci0-private-subnet-id", {
      value: oci0Stack.privateSubnetIdOutput,
    });
    new cdktf.TerraformOutput(this, "oci0-private-subnet-name", {
      value: oci0Stack.privateSubnetNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci0-private-subnet-subnet_domain_name", {
      value: oci0Stack.privateSubnetSubnetDomainNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci0-public-subnet-dns_label", {
      value: oci0Stack.publicSubnetDnsLabelOutput,
    });
    new cdktf.TerraformOutput(this, "oci0-public-subnet-id", {
      value: oci0Stack.publicSubnetIdOutput,
    });
    new cdktf.TerraformOutput(this, "oci0-public-subnet-name", {
      value: oci0Stack.publicSubnetNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci0-public-subnet-subnet_domain_name", {
      value: oci0Stack.publicSubnetSubnetDomainNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci0-vcn-dns_label", {
      value: oci0Stack.vcnDnsLabelOutput,
    });
    new cdktf.TerraformOutput(this, "oci0-vcn-domain_name", {
      value: oci0Stack.vcnDomainNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci0-vcn-id", {
      value: oci0Stack.vcnIdOutput,
    });
    new cdktf.TerraformOutput(this, "oci0-vcn-name", {
      value: oci0Stack.vcnNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci1-boot-volumes", {
      value: moduleOci1.bootVolumesOutput,
    });
    new cdktf.TerraformOutput(this, "oci1-compartment-id", {
      value: moduleOci1.compartmentIdOutput,
    });
    new cdktf.TerraformOutput(this, "oci1-compartment-name", {
      value: moduleOci1.compartmentNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci1-instance-OCID", {
      value: moduleOci1.instanceOcidOutput,
    });
    new cdktf.TerraformOutput(this, "oci1-instance-boot-volume", {
      value: moduleOci1.instanceBootVolumeOutput,
    });
    new cdktf.TerraformOutput(this, "oci1-instance-name", {
      value: moduleOci1.instanceNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci1-instance-public-ip", {
      value: moduleOci1.instancePublicIpOutput,
    });
    new cdktf.TerraformOutput(this, "oci1-private-subnet-dns_label", {
      value: moduleOci1.privateSubnetDnsLabelOutput,
    });
    new cdktf.TerraformOutput(this, "oci1-private-subnet-id", {
      value: moduleOci1.privateSubnetIdOutput,
    });
    new cdktf.TerraformOutput(this, "oci1-private-subnet-name", {
      value: moduleOci1.privateSubnetNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci1-private-subnet-subnet_domain_name", {
      value: moduleOci1.privateSubnetSubnetDomainNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci1-public-subnet-dns_label", {
      value: moduleOci1.publicSubnetDnsLabelOutput,
    });
    new cdktf.TerraformOutput(this, "oci1-public-subnet-id", {
      value: moduleOci1.publicSubnetIdOutput,
    });
    new cdktf.TerraformOutput(this, "oci1-public-subnet-name", {
      value: moduleOci1.publicSubnetNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci1-public-subnet-subnet_domain_name", {
      value: moduleOci1.publicSubnetSubnetDomainNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci1-vcn-dns_label", {
      value: moduleOci1.vcnDnsLabelOutput,
    });
    new cdktf.TerraformOutput(this, "oci1-vcn-domain_name", {
      value: moduleOci1.vcnDomainNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci1-vcn-id", {
      value: moduleOci1.vcnIdOutput,
    });
    new cdktf.TerraformOutput(this, "oci1-vcn-name", {
      value: moduleOci1.vcnNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region0-boot-volumes", {
      value: moduleOci2Region0.bootVolumesOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region0-compartment-id", {
      value: moduleOci2Region0.compartmentIdOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region0-compartment-name", {
      value: moduleOci2Region0.compartmentNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region0-instance-OCID", {
      value: moduleOci2Region0.instanceOcidOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region0-instance-boot-volume", {
      value: moduleOci2Region0.instanceBootVolumeOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region0-instance-name", {
      value: moduleOci2Region0.instanceNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region0-instance-public-ip", {
      value: moduleOci2Region0.instancePublicIpOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region0-private-subnet-dns_label", {
      value: moduleOci2Region0.privateSubnetDnsLabelOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region0-private-subnet-id", {
      value: moduleOci2Region0.privateSubnetIdOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region0-private-subnet-name", {
      value: moduleOci2Region0.privateSubnetNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region0-private-subnet-subnet_domain_name", {
      value: moduleOci2Region0.privateSubnetSubnetDomainNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region0-public-subnet-dns_label", {
      value: moduleOci2Region0.publicSubnetDnsLabelOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region0-public-subnet-id", {
      value: moduleOci2Region0.publicSubnetIdOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region0-public-subnet-name", {
      value: moduleOci2Region0.publicSubnetNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region0-public-subnet-subnet_domain_name", {
      value: moduleOci2Region0.publicSubnetSubnetDomainNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region0-vcn-dns_label", {
      value: moduleOci2Region0.vcnDnsLabelOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region0-vcn-domain_name", {
      value: moduleOci2Region0.vcnDomainNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region0-vcn-id", {
      value: moduleOci2Region0.vcnIdOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region0-vcn-name", {
      value: moduleOci2Region0.vcnNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region1-boot-volumes", {
      value: moduleOci2Region1.bootVolumesOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region1-compartment-id", {
      value: moduleOci2Region1.compartmentIdOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region1-compartment-name", {
      value: moduleOci2Region1.compartmentNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region1-instance-OCID", {
      value: moduleOci2Region1.instanceOcidOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region1-instance-boot-volume", {
      value: moduleOci2Region1.instanceBootVolumeOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region1-instance-name", {
      value: moduleOci2Region1.instanceNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region1-instance-public-ip", {
      value: moduleOci2Region1.instancePublicIpOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region1-private-subnet-dns_label", {
      value: moduleOci2Region1.privateSubnetDnsLabelOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region1-private-subnet-id", {
      value: moduleOci2Region1.privateSubnetIdOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region1-private-subnet-name", {
      value: moduleOci2Region1.privateSubnetNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region1-private-subnet-subnet_domain_name", {
      value: moduleOci2Region1.privateSubnetSubnetDomainNameOutput,
  });
    new cdktf.TerraformOutput(this, "oci2-region1-public-subnet-dns_label", {
      value: moduleOci2Region1.publicSubnetDnsLabelOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region1-public-subnet-id", {
      value: moduleOci2Region1.publicSubnetIdOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region1-public-subnet-name", {
      value: moduleOci2Region1.publicSubnetNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region1-public-subnet-subnet_domain_name", {
      value: moduleOci2Region1.publicSubnetSubnetDomainNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region1-vcn-dns_label", {
      value: moduleOci2Region1.vcnDnsLabelOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region1-vcn-domain_name", {
      value: moduleOci2Region1.vcnDomainNameOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region1-vcn-id", {
      value: moduleOci2Region1.vcnIdOutput,
    });
    new cdktf.TerraformOutput(this, "oci2-region1-vcn-name", {
      value: moduleOci2Region1.vcnNameOutput,
    });
    */
  }
}

const app = new App()
new MyStack(app, "cdktf")
app.synth()
