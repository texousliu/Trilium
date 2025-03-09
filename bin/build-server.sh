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
NODE_ARCH=$ARCH

# Debug output
echo "Node arch: $NODE_ARCH"

# Special case for x64 in Node.js downloads
if [ "$NODE_ARCH" = "x64" ]; then
    NODE_FILENAME="x64"
elif [ "$NODE_ARCH" = "arm64" ]; then
    NODE_FILENAME="arm64"
fi

# Debug output
echo "Node filename: $NODE_FILENAME"

BUILD_DIR="./build"
DIST_DIR="./dist"

if [ "$1" != "DONTCOPY" ]
then
    # Need to modify copy-trilium.sh to accept the target directory
    ./bin/copy-trilium.sh
fi

cd $BUILD_DIR
wget https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_FILENAME}.tar.xz
tar xfJ node-v${NODE_VERSION}-linux-${NODE_FILENAME}.tar.xz
rm node-v${NODE_VERSION}-linux-${NODE_FILENAME}.tar.xz
mv node-v${NODE_VERSION}-linux-${NODE_FILENAME} node
cd ..


rm -r $BUILD_DIR/node/lib/node_modules/npm
rm -r $BUILD_DIR/node/include/node

rm -r $BUILD_DIR/node_modules/electron*
rm -r $BUILD_DIR/electron*.js

printf "#!/bin/sh\n./node/bin/node src/main" > $BUILD_DIR/trilium.sh
chmod 755 $BUILD_DIR/trilium.sh

cp bin/tpl/anonymize-database.sql $BUILD_DIR/

cp -r translations $BUILD_DIR/

VERSION=`jq -r ".version" package.json`

mkdir $DIST_DIR
cp -r "$BUILD_DIR" "$DIST_DIR/trilium-linux-${ARCH}-server"
cd $DIST_DIR
tar cJf trilium-linux-${ARCH}-server-${VERSION}.tar.xz trilium-linux-${ARCH}-server
