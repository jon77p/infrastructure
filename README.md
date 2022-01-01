# Infrastructure
![infrastructure status](https://healthchecks.thepi.cloud/badge/2e44545a-f7be-47c8-ac12-246c0a/Ny57Y9Wo-2/infrastructure.svg) ![OCI status](https://healthchecks.thepi.cloud/badge/2e44545a-f7be-47c8-ac12-246c0a/PZmZBtWI-2/oci.svg)

## Getting Started: [Minimal Setup]
1. `docker swarm init` on manager node
2. `docker swarm join` with correct join token on all other nodes
3. `docker network create --scope swarm --driver overlay web` on manager node
4. `docker stack deploy -c cloudflared/docker-compose.yml picluster`
5. `docker stack deploy -c traefik/docker-compose.yml picluster`
6. `docker stack deploy -c cloudflare-companion/docker-compose.yml picluster`

## Locally Applying kustomizations
1. Export environment variables to current shell
2. Run `envsubst < <(kubectl kustomize *path-to-kustomization-dir*) | kubectl apply -f -`

## Decrypting SOPS secrets for kubectl
1. `sops --decrypt *path-to-.sops.yaml* | kubectl apply -f -`

#### Credits
Portions cloned from [k8s-at-home/template-cluster-k3s](https://github.com/k8s-at-home/template-cluster-k3s)
