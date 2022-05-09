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
      }
    ]
    oci2 = [],
    oci3 = []
  }
}
