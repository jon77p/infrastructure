oci --auth security_token iam user list | jq '.data | map(.["compartment-id"]) | unique | flatten | .[0]' | tr -d '\"'
