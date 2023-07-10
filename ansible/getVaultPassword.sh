#! /bin/bash

# If the ANSIBLE_VAULT_PASSWORD variable isn't set, fetch it using the op cli
if [ -z "$ANSIBLE_VAULT_PASSWORD" ]; then
	export ANSIBLE_VAULT_PASSWORD=$(op read op://Infrastructure/ansible/vault/password)
fi

echo $ANSIBLE_VAULT_PASSWORD
