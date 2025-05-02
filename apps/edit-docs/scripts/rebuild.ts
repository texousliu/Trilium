/**
 * @module
 *
 * This script is used internally by the `rebuild-deps` target of the `desktop`. Normally we could use
 * `electron-rebuild` CLI directly, but it would rebuild the monorepo-level dependencies and breaks
 * the server build (and it doesn't expose a CLI option to override this).
 */

// TODO: Deduplicate with apps/desktop/scripts/rebuild.ts.

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import rebuild from "@electron/rebuild"
import { readFileSync } from "fs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(scriptDir, "..");

function getElectronVersion() {
    const packageJsonPath = join(rootDir, "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    return packageJson.devDependencies.electron;
}

function main() {
    const distDir = join(rootDir, "dist");

    rebuild({
        // We force the project root path to avoid electron-rebuild from rebuilding the monorepo-level dependency and breaking the server.
        projectRootPath: distDir,
        buildPath: distDir,
        force: true,
        electronVersion: getElectronVersion(),
    });
}

main();
