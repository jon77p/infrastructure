import * as cdktf from "cdktf"
import * as oci from "../../.gen/providers/oci"
import * as Vcn from "../../.gen/modules/oracle-terraform-modules/oci/vcn"

import { Construct } from "constructs"
import { Token } from "cdktf"

export interface SubnetConfig {
  cidr: string
}

export interface NetworkingConfig {
  vcn: {
    cidr: string
    subnets: {
      public: SubnetConfig
      private: SubnetConfig
    }
  }
  security: {
    ingress: AdditionalIngressConfig[]
  }
}

export interface AdditionalIngressConfig {
  name: string
  entries: oci.coreSecurityList.CoreSecurityListIngressSecurityRules[]
}

interface BaseProps {
  compartmentId: string
  profile: string
  region: string
  networking: NetworkingConfig
  ociProvider: oci.provider.OciProvider
}

export class Base extends Construct {
  public readonly coreVcns: oci.dataOciCoreVcns.DataOciCoreVcns
  public readonly vcn: Vcn.Vcn
  public readonly securityList: oci.coreSecurityList.CoreSecurityList
  public readonly privateSubnet: oci.coreSubnet.CoreSubnet
  public readonly publicSubnet: oci.coreSubnet.CoreSubnet

  constructor(scope: Construct, name: string, props: BaseProps) {
    super(scope, name)

    const { compartmentId, profile, region, networking, ociProvider } = props

    const allProtocols = "all"
    const anywhere = "0.0.0.0/0"
    const icmpProtocol = "1"
    const sshPort = 22
    const tcpProtocol = "6"

    this.coreVcns = new oci.dataOciCoreVcns.DataOciCoreVcns(this, "core_vcn", {
      compartmentId,
      provider: ociProvider,
      displayName: "terraform",
    })

    this.vcn = new Vcn.Vcn(this, "vcn", {
      compartmentId,
      providers: [ociProvider],
      createInternetGateway: true,
      createNatGateway: false,
      createServiceGateway: false,
      region: region,
      vcnCidrs: [networking.vcn.cidr],
      // Remove all '-' characters from profile for vcnDnsLabel
      vcnDnsLabel: profile.replace(/-/g, ""),
      vcnName: "terraform",
    })

    // Get the first vcn cidr
    const vcnCidrFQN = Token.asString(this.vcn.vcnCidrs?.at(0))

    let ingressRules: oci.coreSecurityList.CoreSecurityListIngressSecurityRules[] =
      [
        {
          description: "Allows all TCP traffic for all ports for VCN subnet",
          protocol: tcpProtocol,
          source: vcnCidrFQN,
        },
        {
          description: "Allow SSH inbound",
          protocol: tcpProtocol,
          source: anywhere,
          tcpOptions: {
            max: sshPort,
            min: sshPort,
          },
        },
        {
          description:
            "ICMP traffic for: 3, 4 Destination Unreachable: Fragmentation Needed and Don't Fragment was Set",
          protocol: icmpProtocol,
          source: vcnCidrFQN,
          sourceType: "CIDR_BLOCK",
          icmpOptions: {
            code: 4,
            type: 3,
          },
        },
        {
          description: "ICMP traffic for: 3 Destination Unreachable",
          protocol: icmpProtocol,
          source: vcnCidrFQN,
          sourceType: "CIDR_BLOCK",
          icmpOptions: {
            type: 3,
          },
        },
      ]

    // Add additional ingress rules to the default rules
    networking.security.ingress.forEach((ingress) => {
      ingressRules = ingressRules.concat(ingress.entries)
    })

    this.securityList = new oci.coreSecurityList.CoreSecurityList(
      this,
      "security_list",
      {
        compartmentId,
        provider: ociProvider,
        displayName: "terraform",
        egressSecurityRules: [
          {
            description: "Allows all traffic for all ports",
            destination: anywhere,
            protocol: allProtocols,
          },
        ],
        ingressSecurityRules: ingressRules,
        vcnId: this.vcn.vcnIdOutput,
      }
    )

    this.privateSubnet = new oci.coreSubnet.CoreSubnet(this, "private", {
      compartmentId,
      provider: ociProvider,
      displayName: "private",
      cidrBlock: networking.vcn.subnets.private.cidr,
      dnsLabel: "private",
      prohibitInternetIngress: true,
      prohibitPublicIpOnVnic: true,
      routeTableId: this.vcn.igRouteIdOutput,
      securityListIds: [this.securityList.id],
      vcnId: this.vcn.vcnIdOutput,
    })

    this.publicSubnet = new oci.coreSubnet.CoreSubnet(this, "public", {
      compartmentId,
      provider: ociProvider,
      displayName: "public",
      cidrBlock: networking.vcn.subnets.public.cidr,
      dnsLabel: "public",
      prohibitInternetIngress: false,
      prohibitPublicIpOnVnic: false,
      routeTableId: this.vcn.igRouteIdOutput,
      securityListIds: [this.securityList.id],
      vcnId: this.vcn.vcnIdOutput,
    })

    // Outputs
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
      value: this.vcn.vcnDnsLabel,
    })
    new cdktf.TerraformOutput(this, "vcn-domain_name", {
      value: this.vcn.vcnDnsLabel,
    })
    new cdktf.TerraformOutput(this, "vcn-id", {
      value: this.vcn.vcnIdOutput,
    })
    new cdktf.TerraformOutput(this, "vcn-name", {
      value: this.vcn.vcnName,
    })
  }
}
