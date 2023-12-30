import * as onepassword from "./.gen/providers/onepassword"
import * as localExec from "cdktf-local-exec";
import * as cdktf from "cdktf";

import { Construct } from "constructs";

function Setup1Password(scope: Construct) {
  const arch = "amd64"

  // Fetch 1Password CLI version with typescript
  const version = fetch("https://app-updates.agilebits.com/check/1/0/CLI2/en/2.0.0/N").then((response) => {
    // Parse version from response as JSON
    return response.json().then((json: any) => {
      // Check if version is available
      if (!json["version"]) {
        throw new Error("No version found");
      }

      // Return version
      return json["version"];
    });
  });

  const command = `curl -sSfo op.zip "https://cache.agilebits.com/dist/1P/op2/pkg/v${version}/op_linux_${arch}_v${version}.zip" && unzip -od /usr/local/bin/ op.zip && rm op.zip`

  // const opPath = "tools/op"
  const install = new localExec.LocalExec(scope, "1password-install", {
    cwd: ".",
    command: command,
  });

  return {
    path: '/usr/local/bin/op',
    install: install
  }
}

export interface SecretsConfig {
}

export class Secrets extends Construct {
  constructor(scope: Construct, name: string, _: SecretsConfig) {
    super(scope, name)

    // Initialize local-exec provider
    new localExec.Provider(this, "local-exec");

    // Setup 1Password
    const setup = Setup1Password(this)

    new cdktf.TerraformOutput(this, "op-path", {
      value: setup.path,
    });

    return;

    // Initialize 1Password provider
    new onepassword.provider.OnepasswordProvider(this, "onepassword", {
      serviceAccountToken: process.env.OP_SERVICE_ACCOUNT_TOKEN,
      opCliPath: cdktf.Fn.join("/", [setup.install.cwd, "op"]),
    });

    // Fetch the 1Password Infrastructure vault
    const vault = new onepassword.dataOnepasswordVault.DataOnepasswordVault(this, "vault", {
      name: "Infrastructure",
      provisioners: [
        // setup.install,
      ],
    });

    // Fetch the 1Password item for the Terraform login
    const item = new onepassword.dataOnepasswordItem.DataOnepasswordItem(this, "item", {
      vault: vault.id,
      title: "terraform",
    });

    // Create output for the result
    new cdktf.TerraformOutput(this, "item-output", {
      value: item.title,
    });
  }
}
