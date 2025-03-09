#!/usr/bin/env bash

set -e  # Fail on any command error

# Debug output
echo "Matrix Arch: $MATRIX_ARCH"

# Detect architecture from matrix input, fallback to system architecture
if [ -n "$MATRIX_ARCH" ]; then
    ARCH=$MATRIX_ARCH
else
    ARCH=$(uname -m)
    # Convert system architecture to our naming convention
    case $ARCH in
        x86_64) ARCH="x64" ;;
        aarch64) ARCH="arm64" ;;
    esac
fi

# Debug output
echo "Selected Arch: $ARCH"

# Set Node.js version and architecture-specific filename
NODE_VERSION=20.15.1

BUILD_DIR="./build"
DIST_DIR="./dist"

if [ "$1" != "DONTCOPY" ]
then
    # Need to modify copy-trilium.sh to accept the target directory
    ./bin/copy-trilium.sh
fi

cd $BUILD_DIR
wget -qO- https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${ARCH}.tar.xz | tar xfJ -
mv node-v${NODE_VERSION}-linux-${ARCH} node
cd ..


rm -r $BUILD_DIR/node/lib/node_modules/npm \
    $BUILD_DIR/node/include/node \
    $BUILD_DIR/node_modules/electron* \
    $BUILD_DIR/electron*.{js,map}

printf "#!/bin/sh\n./node/bin/node src/main" > $BUILD_DIR/trilium.sh
chmod 755 $BUILD_DIR/trilium.sh

# TriliumNextTODO: is this still required? If yes → move to copy-dist/copy-trilium
cp bin/tpl/anonymize-database.sql $BUILD_DIR/

VERSION=`jq -r ".version" package.json`

mkdir $DIST_DIR
cp -r "$BUILD_DIR" "$DIST_DIR/trilium-linux-${ARCH}-server"
cd $DIST_DIR
tar cJf trilium-linux-${ARCH}-server-${VERSION}.tar.xz trilium-linux-${ARCH}-server
rm -rf trilium-linux-${ARCH}-server