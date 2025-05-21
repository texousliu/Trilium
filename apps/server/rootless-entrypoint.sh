#!/bin/sh
# Rootless entrypoint script for Trilium Notes
# Works with both Debian and Alpine-based images

# Check if runtime UID/GID match the expected values
if [ "${TRILIUM_UID}" != "$(id -u)" ] || [ "${TRILIUM_GID}" != "$(id -g)" ]; then
  echo "Detected UID:GID mismatch (current: $(id -u):$(id -g), expected: ${TRILIUM_UID}:${TRILIUM_GID})"
  # Check GID mismatch
  if [ "${TRILIUM_GID}" != "$(id -g)" ]; then
    echo "ERROR: Cannot change GID at runtime in rootless mode."
    echo "       Please use docker run with --user ${TRILIUM_UID}:${TRILIUM_GID} instead."
    exit 1
  fi
  # Check UID mismatch
  if [ "${TRILIUM_UID}" != "$(id -u)" ]; then
    echo "ERROR: Cannot change UID at runtime in rootless mode."
    echo "       Please use docker run with --user ${TRILIUM_UID}:${TRILIUM_GID} instead."
    exit 1
  fi
fi

# Make sure data directory has correct permissions
mkdir -p "${TRILIUM_DATA_DIR}"

# Start the app
exec node ./main
