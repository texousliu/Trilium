/**
 * @module
 *
 * This script synchronizes the `package.json` version of the monorepo (root `package.json`)
 * into the apps, so that it is properly displayed.
 */

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

function patchPackageJson(packageJsonPath: string, version: string) {
    // Read the version from package.json and process it.
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    // Write the adjusted version back in.
    packageJson.version = version;
    const formattedJson = JSON.stringify(packageJson, null, 2);
    fs.writeFileSync(packageJsonPath, formattedJson);
}

function getVersion(packageJsonPath: string) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    return packageJson.version;
}

function main() {
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    const version = getVersion(join(scriptDir, "..", "package.json"));

    for (const appName of ["server", "client"]) {
        patchPackageJson(join(scriptDir, "..", "apps", appName, "package.json"), version);
    }

    for (const packageName of ["commons"]) {
        patchPackageJson(join(scriptDir, "..", "packages", packageName, "package.json"), version);
    }
}

main();
