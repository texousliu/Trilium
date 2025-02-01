#!/usr/bin/env bash

if ! command -v magick &> /dev/null; then
  echo "This tool requires ImageMagick to be installed in order to create the icons."
  exit 1
fi

if ! command -v inkscape &> /dev/null; then
  echo "This tool requires Inkscape to be render sharper SVGs than ImageMagick."
  exit 1
fi

script_dir=$(realpath $(dirname $0))
output_dir="$script_dir/../../images/app-icons/tray"

for file in *.svg; do
    name=$(basename $file .svg)
    inkscape -w 16 -h 16 "$file" -o "$output_dir/$name-16.png"
    magick "$output_dir/$name-16.png" -channel RGB -negate "$output_dir/$name-inverted-16.png"
done