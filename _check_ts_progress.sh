#!/usr/bin/env bash

cd src/public
cloc HEAD \
    --git --md \
    --include-lang=javascript,typescript \
    --found=filelist.txt

grep -R \.js$ filelist.txt
rm filelist.txt