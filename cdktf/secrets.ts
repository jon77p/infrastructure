import * as onepassword from "./.gen/providers/onepassword"
import * as localExec from "cdktf-local-exec";
import * as cdktf from "cdktf";

import { Construct } from "constructs";

function Setup1Password(scope: Construct) {
  const opPath = "tools/op"
  const install = new localExec.LocalExec(scope, "1password-install", {
    cwd: ".",
    command: `ARCH="amd64"; \
      OP_VERSION="v$(curl https://app-updates.agilebits.com/check/1/0/CLI2/en/2.0.0 -s | grep -Eo '[0-9]+\.[0-9]+\.[0-9]+')"; \
      curl -sSfo op.zip \
      https://cache.agilebits.com/dist/1P/op2/pkg/"$OP_VERSION"/op_linux_"$ARCH"_"$OP_VERSION".zip \
      && mkdir -p tools \
      && unzip -od tools op.zip \
      && rm op.zip \
      && chmod 0755 tools/op \
      && export PATH="$PATH:$(pwd)/tools" \
      && echo $PATH \
      && op --version`
  });

  return {
    path: opPath,
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
