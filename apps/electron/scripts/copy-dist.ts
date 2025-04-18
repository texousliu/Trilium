import fs from "fs-extra";
import path from "path";

const DEST_DIR = "./build";

const VERBOSE = process.env.VERBOSE;

function log(...args: any[]) {
    if (VERBOSE) {
        console.log(...args);
    }
}

try {
    /**
     * Copy the server.
     */
    fs.copySync("../server/build", DEST_DIR);

    /**
     * Copy assets.
     */
    const assetsToCopy = new Set([
        "./forge.config.cjs",   
        "./bin/electron-forge/desktop.ejs",
        "./bin/electron-forge/sign-windows.cjs",
    ]);

    for (const asset of assetsToCopy) {
        log(`Copying ${asset}`);
        fs.copySync(asset, path.join(DEST_DIR, asset));
    }

    /**
     * Directories to be copied relative to the project root into <resource_dir>/src/public/app-dist.
     */
    const publicDirsToCopy = ["./src/public/app/doc_notes"];
    const PUBLIC_DIR = path.join(DEST_DIR, "src", "public", "app-dist");
    for (const dir of publicDirsToCopy) {
        fs.copySync(dir, path.join(PUBLIC_DIR, path.basename(dir)));
    }

    console.log("Copying complete!")

} catch(err) {
    console.error("Error during copy:", err.message)
    process.exit(1)
}

