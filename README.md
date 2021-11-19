# Infrastructure
![infrastructure status](https://healthchecks.jon77p.xyz/badge/4df537c4-045a-4113-9a3e-e03622/1a97Y3uV-2/infrastructure.svg)

## Getting Started: [Minimal Setup]
1. `docker swarm init` on manager node
2. `docker swarm join` with correct join token on all other nodes
3. `docker network create --scope swarm --driver overlay web` on manager node
4. `docker stack deploy -c cloudflared/docker-compose.yml picluster`
5. `docker stack deploy -c traefik/docker-compose.yml picluster`
6. `docker stack deploy -c cloudflare-companion/docker-compose.yml picluster`

#### Credits
Portions cloned from [k8s-at-home/template-cluster-k3s](https://github.com/k8s-at-home/template-cluster-k3s)
