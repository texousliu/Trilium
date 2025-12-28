import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const inputDir = process.argv[2];
if (!inputDir) {
    console.error('Please provide the input directory as the first argument.');
    process.exit(1);
}

for (const pack of [ "basic", "brands" ]) {
    const fileName = pack === "basic" ? "boxicons" : `boxicons-${pack}`;
    const jsonPath = `${inputDir}/${pack}/${fileName}.json`;
    const inputData = JSON.parse(readFileSync(jsonPath, "utf-8"));
    const icons = {};

    for (const [ key, value ] of Object.entries(inputData)) {
        if (key.startsWith("variable-selector")) continue;

        let name = key;
        if (name.startsWith('bx-')) {
            name = name.slice(3);
        }
        if (name.startsWith('bxs-')) {
            name = name.slice(4);
        }
        icons[key] = {
            glyph: String.fromCodePoint(value as number),
            terms: [ name ]
        };
    }

    const manifest = {
        icons
    };
    const outputPath = join(`${inputDir}/${pack}/generated-manifest.json`);
    writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
}
