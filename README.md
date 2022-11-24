# Infrastructure

![Infrastructure Status](https://healthchecks.thepi.cloud/badge/e465366a-14f0-4ef1-b81a-6abc40/dqiPLs8L-2/Infrastructure.svg)
![OCI Status](https://healthchecks.thepi.cloud/badge/e465366a-14f0-4ef1-b81a-6abc40/Pr9vresC-2/OCI.svg)
![Services Status](https://healthchecks.thepi.cloud/badge/e465366a-14f0-4ef1-b81a-6abc40/M9e2xSEP-2/Services.svg)
![Local Status](https://healthchecks.thepi.cloud/badge/e465366a-14f0-4ef1-b81a-6abc40/3iKjcFGj-2/Local.svg)
![Monitoring Status](https://healthchecks.thepi.cloud/badge/e465366a-14f0-4ef1-b81a-6abc40/NSLui28U/Monitoring.svg)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new)

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

## Credits

Portions cloned from [k8s-at-home/template-cluster-k3s](https://github.com/k8s-at-home/template-cluster-k3s)
