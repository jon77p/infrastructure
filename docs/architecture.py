#!python3

import os
import json

from diagrams import Diagram, Cluster, Edge
from diagrams.generic.os import Ubuntu
from diagrams.onprem.network import Internet
from diagrams.onprem.container import Docker
from diagrams.onprem.network import Traefik
from diagrams.onprem.monitoring import Grafana, Prometheus
from diagrams.onprem.storage import Glusterfs
from diagrams.onprem.vcs import Gitea
from diagrams.custom import Custom
from urllib.request import urlretrieve
from diagrams.generic.blank import Blank

with open("icons.json", "r") as fd:
    icons = json.load(fd)

for k in icons:
    i = icons[k]
    if i["url"] is not None and not os.path.isfile(i["icon"]):
        urlretrieve(i["url"], i["icon"])

with Diagram("Infrastructure", direction="TB"):
    internet = Custom("", icons["cloudflare"]["icon"])

    with Cluster("Pi Cluster", direction="TB"):
        docker = Docker()

        with Cluster("Pi 1", direction="TB") as pi1:
            controller = Docker("Docker Swarm Manager")
            glusterfs1 = Glusterfs("glusterfs")

        with Cluster("Pi 2", direction="TB") as pi2:
            agent = Docker("Docker Swarm Node")
            glusterfs2 = Glusterfs("glusterfs")

    with Cluster("Containers"):
        with Cluster("External"):
            cloudflared = Custom("cloudflared", icons["cloudflareCloud"]["icon"])
            traefik = Traefik("traefik")

        with Cluster("Internal"):
            visualizer = Custom("visualizer", icons["visualizer"]["icon"])
            gitea = Gitea("Gitea")
            allaboutsecurity = Custom("allaboutsecurity.xyz", icons["ghost"]["icon"])
            ghost = Custom("Ghost", icons["ghost"]["icon"])

            vscode = Custom("VSCode Server", icons["vscode"]["icon"])
            firefly = Custom("Firefly III", icons["firefly"]["icon"])
            fireflycsv = Custom("Firefly CSV", icons["firefly"]["icon"])

            gaps = Custom("Gaps", icons["gaps"]["icon"])

            grafana = Grafana("Grafana")
            homeassistant = Custom("Home Assistant", icons["homeassistant"]["icon"])

            netbox = Custom("NetBox", icons["netbox"]["icon"])
            nodered = Custom("Node-Red", icons["nodered"]["icon"])
            pihole = Custom("Pi-Hole", icons["pihole"]["icon"])

            prometheus = Prometheus("Prometheus")
            portainer = Custom("Portainer", icons["portainer"]["icon"])

            speedtest = Custom("Speedtest", icons["speedtest"]["icon"])
            spotifytrends = Custom("Spotify Trends", icons["spotify"]["icon"])
            ssh = Custom("SSH", icons["ssh"]["icon"])
            taskcafe = Custom("TaskCafe", icons["taskcafe"]["icon"])
            youtubedl = Custom("YouTube-DL", icons["youtube"]["icon"])

    glusterfs1 - Edge(color="brown", style="dashed") - glusterfs2
    docker >> [controller, agent]
    traefik >> controller

    internet >> Edge(color="firebrick", style="dashed") >> cloudflared >> traefik

    traefik >> visualizer
    traefik >> gitea
    traefik >> allaboutsecurity
    traefik >> vscode
    traefik >> firefly
    traefik >> fireflycsv
    traefik >> gaps
    traefik >> grafana
    traefik >> homeassistant
    traefik >> netbox
    traefik >> nodered
    traefik >> pihole
    traefik >> prometheus
    traefik >> portainer
    traefik >> speedtest
    traefik >> spotifytrends
    traefik >> ssh
    traefik >> taskcafe
    traefik >> youtubedl

    # exit(-1)
    visualizer >> docker
    gitea >> docker
    allaboutsecurity >> ghost >> docker
    vscode >> docker
    firefly >> docker
    fireflycsv >> docker
    gaps >> docker
    grafana >> docker
    homeassistant >> docker
    netbox >> docker
    nodered >> docker
    pihole >> docker
    prometheus >> docker
    speedtest >> docker
    spotifytrends >> docker
    ssh >> docker
    taskcafe >> docker
    youtubedl >> docker
