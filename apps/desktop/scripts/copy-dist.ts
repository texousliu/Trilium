import { execSync } from "child_process";
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
    fs.copySync("../server/build", path.join(DEST_DIR, "node_modules", "@triliumnext/server"));

    /**
     * Copy assets.
     */
    const assetsToCopy = new Set([
        "./package.json",
        "./forge.config.cjs",   
        "./scripts/electron-forge/desktop.ejs",
        "./scripts/electron-forge/sign-windows.cjs",
    ]);

    for (const asset of assetsToCopy) {
        log(`Copying ${asset}`);
        fs.copySync(asset, path.join(DEST_DIR, asset));
    }

    /**
     * Directories to be copied relative to the project root into <resource_dir>/src/public/app-dist.
     */
    const publicDirsToCopy = ["../server/src/public/app/doc_notes"];
    const PUBLIC_DIR = path.join(DEST_DIR, "src", "public", "app-dist");
    for (const dir of publicDirsToCopy) {
        fs.copySync(dir, path.join(PUBLIC_DIR, path.basename(dir)));
    }

    /*
     * Extract and rebuild the bettersqlite node module.
     */
    fs.moveSync(path.join(DEST_DIR, "node_modules/@triliumnext/server/node_modules/better-sqlite3"), path.join(DEST_DIR, "node_modules/better-sqlite3"));
    execSync("npm run postinstall", { cwd: DEST_DIR });

    console.log("Copying complete!")

} catch(err) {
    console.error("Error during copy:", err.message)
    process.exit(1)
}

