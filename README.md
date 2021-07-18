## Getting Started: [Minimal Setup]
1. `docker swarm init` on manager node
2. `docker swarm join` with correct join token on all other nodes
3. `docker network create --scope swarm --driver overlay web` on manager node
4. `docker stack deploy -c cloudflared/docker-compose.yml picluster`
5. `docker stack deploy -c traefik/docker-compose.yml picluster`
6. `docker stack deploy -c cloudflare-companion/docker-compose.yml picluster`
