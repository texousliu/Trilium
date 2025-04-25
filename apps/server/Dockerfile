FROM node:22.14.0-alpine

# Install runtime dependencies
RUN apk add --no-cache su-exec shadow

WORKDIR /usr/src/app

COPY /apps/server/dist /usr/src/app
COPY /apps/server/start-docker.sh /usr/src/app

# Add application user
RUN adduser -s /bin/false node; exit 0

# Configure container
EXPOSE 8080
CMD [ "sh", "./start-docker.sh" ]
HEALTHCHECK --start-period=10s CMD exec su-exec node node docker_healthcheck.js