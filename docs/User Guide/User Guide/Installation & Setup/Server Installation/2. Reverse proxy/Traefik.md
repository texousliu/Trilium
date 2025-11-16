# Traefik
Configure Traefik proxy and HTTPS. See [#7768](https://github.com/TriliumNext/Trilium/issues/7768#issuecomment-3539165814) for reference

### Build the docker-compose file

Setting up Traefik as reverse proxy requires setting the following labels:

```yaml
    labels:
      - traefik.enable=true
      - traefik.http.routers.trilium.entrypoints=https
      - traefik.http.routers.trilium.rule=Host(`trilium.mydomain.tld`)
      - traefik.http.routers.trilium.tls=true
      - traefik.http.routers.trilium.service=trilium
      - traefik.http.services.trilium.loadbalancer.server.port=8080
      # scheme must be HTTP instead of the usual HTTPS because Trilium listens on HTTP internally
      - traefik.http.services.trilium.loadbalancer.server.scheme=http
      - traefik.docker.network=proxy
      # forward HTTP to HTTPS
      - traefik.http.routers.trilium.middlewares=trilium-headers@docker
      - traefik.http.middlewares.trilium-headers.headers.customrequestheaders.X-Forwarded-Proto=https
```

### Setup needed environment variables
After setting up a reverse proxy, make sure to configure the <a class="reference-link" href="Trusted%20proxy.md">Trusted proxy</a>.

### Example `docker-compose.yaml`

```yaml
services:
  trilium:
    image: triliumnext/trilium
    container_name: trilium
    networks:
      - traefik-proxy
    environment:
      - TRILIUM_NETWORK_TRUSTEDREVERSEPROXY=my-traefik-host-ip
    volumes:
      - /path/to/data=/home/node/trilium-data
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
    labels:
      - traefik.enable=true
      - traefik.http.routers.trilium.entrypoints=https
      - traefik.http.routers.trilium.rule=Host(`trilium.mydomain.tld`)
      - traefik.http.routers.trilium.tls=true
      - traefik.http.routers.trilium.service=trilium
      - traefik.http.services.trilium.loadbalancer.server.port=8080
      # scheme must be HTTP instead of the usual HTTPS because of how trilium works
      - traefik.http.services.trilium.loadbalancer.server.scheme=http
      - traefik.docker.network=traefik-proxy
      # Tell Trilium the original request was HTTPS
      - traefik.http.routers.trilium.middlewares=trilium-headers@docker
      - traefik.http.middlewares.trilium-headers.headers.customrequestheaders.X-Forwarded-Proto=https

networks:
  traefik-proxy:
    external: true
```
