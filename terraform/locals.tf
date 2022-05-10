locals {
  additional_ingress = {
    oci0 = []
    oci1 = [
      {
        name = "timemachine"
        entries = [
          {
            protocol = 6
            source   = "0.0.0.0/0"
            tcp_options = {
              min = 445
              max = 445
            }
          }
        ]
      },
      {
        name = "innernet"
        entries = [
          {
            description = "allow innernet TCP/51820 inbound"
            protocol    = 6
            source      = "0.0.0.0/0"
            source_type = "CIDR_BLOCK"
            stateless   = false
            tcp_options = {
              min = 51820
              max = 51820
            }
          },
          {
            description = "allow innernet UDP/51820 inbound"
            protocol    = 17
            source      = "0.0.0.0/0"
            source_type = "CIDR_BLOCK"
            stateless   = false
            tcp_options = {
              min = 51820
              max = 51820
            }
          }
        ]
      }
    ]
    oci2 = [],
    oci3 = []
  }
}
