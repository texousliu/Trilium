# Build stage
FROM node:22.14.0-bullseye-slim AS builder

# Configure build dependencies in a single layer
# TriliumNextTODO: These don't seem to be required at all
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     autoconf \
#     automake \
#     g++ \
#     gcc \
#     libtool \
#     make \
#     nasm \
#     libpng-dev \
#     python3 \
#     && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app/build

# Copy only necessary files for build
COPY . .

# Build and cleanup in a single layer
RUN npm ci && \
    npm run build:prepare-dist && \
    npm cache clean --force && \
    mv dist/* \
      start-docker.sh \
      package-lock.json \
      /usr/src/app/ && \
    rm -rf /usr/src/app/build

#TODO: move package-lock copying into copy-dist

# Runtime stage
FROM node:22.14.0-bullseye-slim

WORKDIR /usr/src/app

# Install only runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      gosu && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /var/cache/apt/*

COPY --from=builder /usr/src/app ./

RUN sed -i "/electron/d" package.json && \
    npm ci --omit=dev && \
    npm cache clean --force

# Configure container
EXPOSE 8080
CMD [ "./start-docker.sh" ]
HEALTHCHECK --start-period=10s CMD exec gosu node node docker_healthcheck.js