import fs from "fs-extra";
import path from "path";

const DEST_DIR = "./build";

const VERBOSE = process.env.VERBOSE;

function log(...args: any[]) {
    if (VERBOSE) {
        console.log(...args);
    }
}

const ROOT_DIR = "../..";
const CLIENT_DIR = "../client";

try {
    const assetsToCopy = new Set([
        // copy node_module, to avoid downloading packages a 2nd time during pruning
        "./node_modules",
        `${CLIENT_DIR}/libraries`,
        "./translations",
        "./db",
        "./config-sample.ini",
        "./package.json",
        `${ROOT_DIR}/LICENSE`,
        `${ROOT_DIR}/README.md`,        
        `./tpl/`,
        "./scripts/cleanupNodeModules.ts",        
        "./src/views/",
        "./src/etapi/etapi.openapi.yaml",
        "./src/routes/api/openapi.json",
        "./src/public/icon.png",
        "./src/public/manifest.webmanifest",
        "./src/public/robots.txt",
        "./src/public/fonts",
        `${CLIENT_DIR}/stylesheets`,
        "./src/public/translations",
        `${ROOT_DIR}/packages/turndown-plugin-gfm/src`
    ]);

    for (const asset of assetsToCopy) {
        log(`Copying ${asset}`);
        fs.copySync(asset, path.normalize(path.join(DEST_DIR, asset)));
    }

    /**
     * Directories to be copied relative to the project root into <resource_dir>/src/public/app-dist.
     */
    const publicDirsToCopy = ["./src/public/app/doc_notes"];
    const PUBLIC_DIR = path.join(DEST_DIR, "src", "public", "app-dist");
    for (const dir of publicDirsToCopy) {
        fs.copySync(dir, path.normalize(path.join(PUBLIC_DIR, path.basename(dir))));
    }

    console.log("Copying complete!")

} catch(err) {
    console.error("Error during copy:", err.message)
    process.exit(1)
}

