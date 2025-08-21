# Docker
To run a Docker build:

```
./bin/builder-docker.sh
```

To run the built Docker image:

```
sudo docker run -p 8081:8080 triliumnext/trilium:v0.90.6-beta
```

To enter a shell in the Docker container:

```
sudo docker run -it --entrypoint=/bin/sh TriliumNext/Trilium:0.63-latest
```