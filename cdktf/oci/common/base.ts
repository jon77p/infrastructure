import * as cdktf from "cdktf"
import * as oci from "../../.gen/providers/oci"
import * as Vcn from "../../.gen/modules/oracle-terraform-modules/oci/vcn"

import { Construct } from "constructs"

export interface CIDRConfig {
  vcn: string
  subnets: {
    public: string
    private: string
  }
}

export interface AdditionalIngressConfig {
  name: string
  entries: {
    description: string
    stateless: boolean
    protocol: number
    source: string
    source_type: string
    tcp_options: {}
  }[]
}

interface BaseStackConfig {
  tenancyId: string
  profile: string
  region: string
  cidrs: CIDRConfig
  additionalIngress: AdditionalIngressConfig[]
}

export class Base extends Construct {
  public readonly identityCompartment: oci.identityCompartment.IdentityCompartment
  public readonly coreVcns: oci.dataOciCoreVcns.DataOciCoreVcns
  public readonly vcn: Vcn.Vcn
  public readonly securityList: oci.coreSecurityList.CoreSecurityList
  public readonly privateSubnet: oci.coreSubnet.CoreSubnet
  public readonly publicSubnet: oci.coreSubnet.CoreSubnet

  constructor(scope: Construct, name: string, config: BaseStackConfig) {
    super(scope, name)

    const { tenancyId, profile, region, cidrs } = config

    const allProtocols = "all"
    const anywhere = "0.0.0.0/0"
    const icmpProtocol = 1
    const sshPort = 22
    const tcpProtocol = 6

    this.identityCompartment = new oci.identityCompartment.IdentityCompartment(
      this,
      "terraform",
      {
        compartmentId: tenancyId,
        description: "Compartment for Terraform resources.",
        name: "terraform",
      }
    )

    this.coreVcns = new oci.dataOciCoreVcns.DataOciCoreVcns(this, "core_vcn", {
      compartmentId: this.identityCompartment.id,
      displayName: "terraform",
    })

    /*This allows the Terraform resource name to match the original name. You can remove the call if you don't need them to match.*/
    this.coreVcns.overrideLogicalId("terraform")

    this.vcn = new Vcn.Vcn(this, "vcn", {
      compartmentId: this.identityCompartment.id,
      createInternetGateway: true,
      createNatGateway: false,
      createServiceGateway: false,
      region: region,
      vcnCidrs: [cidrs.vcn],
      vcnDnsLabel: profile,
      vcnName: "terraform",
    })

    this.securityList = new oci.coreSecurityList.CoreSecurityList(
      this,
      "security_list",
      {
        compartmentId: this.identityCompartment.id,
        displayName: "terraform",
        egressSecurityRules: [
          {
            description: "Allows all traffic for all ports",
            destination: anywhere,
            protocol: allProtocols,
          },
        ],
        ingressSecurityRules: [
          {
            description: "Allows all TCP traffic for all ports for VCN subnet",
            protocol: tcpProtocol.toString(),
            source: `\${\${${this.vcn.vcnAllAttributesOutput}.cidrBlocks.fqn}[0]}`,
          },
          {
            description: "Allow SSH inbound",
            protocol: tcpProtocol.toString(),
            source: anywhere,
            tcpOptions: {
              max: sshPort,
              min: sshPort,
            },
          },
          {
            description:
              "ICMP traffic for: 3, 4 Destination Unreachable: Fragmentation Needed and Don't Fragment was Set",
            icmpOptions: {
              code: 4,
              type: 3,
            },
            protocol: icmpProtocol.toString(),
            source: `\${\${${this.vcn.vcnAllAttributesOutput}.cidrBlocks.fqn}[0]}`,
          },
          {
            description: "ICMP traffic for: 3 Destination Unreachable",
            icmpOptions: {
              type: 3,
            },
            protocol: icmpProtocol.toString(),
            source: `\${\${${this.vcn.vcnAllAttributesOutput}.cidrBlocks.fqn}[0]}`,
          },
        ],
        vcnId: this.vcn.vcnIdOutput,
      }
    )

    /*This allows the Terraform resource name to match the original name. You can remove the call if you don't need them to match.*/
    this.securityList.overrideLogicalId("terraform")

    this.privateSubnet = new oci.coreSubnet.CoreSubnet(this, "private", {
      cidrBlock: cidrs.subnets.private,
      compartmentId: this.identityCompartment.id,
      displayName: "private",
      dnsLabel: "private",
      prohibitInternetIngress: true,
      prohibitPublicIpOnVnic: true,
      routeTableId: this.vcn.igRouteIdOutput,
      securityListIds: [this.securityList.id],
      vcnId: this.vcn.vcnIdOutput,
    })

    this.publicSubnet = new oci.coreSubnet.CoreSubnet(this, "public", {
      cidrBlock: cidrs.subnets.public,
      compartmentId: this.identityCompartment.id,
      displayName: "public",
      dnsLabel: "public",
      prohibitInternetIngress: false,
      prohibitPublicIpOnVnic: false,
      routeTableId: this.vcn.igRouteIdOutput,
      securityListIds: [this.securityList.id],
      vcnId: this.vcn.vcnIdOutput,
    })

    // Outputs
    new cdktf.TerraformOutput(this, "compartment-id", {
      value: this.identityCompartment.id,
    })
    new cdktf.TerraformOutput(this, "compartment-name", {
      value: this.identityCompartment.name,
    })
    new cdktf.TerraformOutput(this, "private-subnet-dns_label", {
      value: this.privateSubnet.dnsLabel,
    })
    new cdktf.TerraformOutput(this, "private-subnet-id", {
      value: this.privateSubnet.id,
    })
    new cdktf.TerraformOutput(this, "private-subnet-name", {
      value: this.privateSubnet.displayName,
    })
    new cdktf.TerraformOutput(this, "private-subnet-subnet_domain_name", {
      value: this.privateSubnet.subnetDomainName,
    })
    new cdktf.TerraformOutput(this, "public-subnet-dns_label", {
      value: this.publicSubnet.dnsLabel,
    })
    new cdktf.TerraformOutput(this, "public-subnet-id", {
      value: this.publicSubnet.id,
    })
    new cdktf.TerraformOutput(this, "public-subnet-name", {
      value: this.publicSubnet.displayName,
    })
    new cdktf.TerraformOutput(this, "public-subnet-subnet_domain_name", {
      value: this.publicSubnet.subnetDomainName,
    })
    new cdktf.TerraformOutput(this, "vcn-dns_label", {
      value: `${this.vcn.vcnAllAttributesOutput}.dnsLabel`,
    })
    new cdktf.TerraformOutput(this, "vcn-domain_name", {
      value: `${this.vcn.vcnAllAttributesOutput}.dnsLabel`,
    })
    new cdktf.TerraformOutput(this, "vcn-id", {
      value: this.vcn.vcnIdOutput,
    })
    new cdktf.TerraformOutput(this, "vcn-name", {
      value: `${this.vcn.vcnAllAttributesOutput}.displayName`,
    })
  }
}
