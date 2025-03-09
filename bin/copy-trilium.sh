#!/usr/bin/env bash

set -e  # Fail on any command error
shopt -s globstar

if [[ $# -eq 0 ]] ; then
    echo "Missing argument of target directory"
    exit 1
fi
if ! [[ $(which npm) ]]; then
    echo "Missing npm"
    exit 1
fi

# Trigger the build
echo Build start
npm run build:prepare-dist
echo Build finished

# Patch package.json main
sed -i 's/.\/dist\/electron-main.js/electron-main.js/g' "$DIR/package.json"

script_dir=$(realpath $(dirname $0))
cp -R "$script_dir/../build/src" "$DIR"
cp "$script_dir/../build/electron-main.js" "$DIR"

# run in subshell (so we return to original dir)
(cd $DIR && npm ci --omit=dev)

if [[ -d "$DIR"/node_modules ]]; then
    # cleanup of useless files in dependencies
    for d in 'image-q/demo' \
        '@excalidraw/excalidraw/dist/excalidraw-assets-dev' '@excalidraw/excalidraw/dist/excalidraw.development.js' '@excalidraw/excalidraw/dist/excalidraw-with-preact.development.js' \
        'mermaid/dist/mermaid.js' \
        'boxicons/svg' 'boxicons/node_modules/react'/* \
        '@jimp/plugin-print/fonts' 'jimp/browser' 'jimp/fonts'; do
        [[ -e "$DIR"/node_modules/"$d" ]] && rm -r "$DIR"/node_modules/"$d"
    done

    # delete all tests (there are often large images as test file for jimp etc.)
    for d in 'test' 'docs' 'demo' 'example'; do
        find "$DIR"/node_modules -name "$d" -exec rm -rf {} +
    done
fi

find $DIR/libraries -name "*.map" -type f -delete
find $DIR/node_modules -name "*.map" -type f -delete
find $DIR -name "*.ts" -type f -delete

d="$DIR"/src/public
[[ -d "$d"/app-dist ]] || mkdir -pv "$d"/app-dist
cp -r "$d"/app/doc_notes "$d"/app-dist/

rm -rf "$d"/app
unset f d DIR
