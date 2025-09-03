import { join, resolve } from "path";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "fs";
import { execSync } from "child_process";
import { rebuild } from "@electron/rebuild"
import { getElectronPath, isNixOS } from "./utils.mjs";

const workspaceRoot = join(import.meta.dirname, "..");

function copyNativeDependencies(projectRoot: string) {
    const destPath = join(projectRoot, "node_modules/better-sqlite3");
    
    if (existsSync(destPath)) {
        rmSync(destPath, { recursive: true });
    }
    mkdirSync(destPath);
    cpSync(join(workspaceRoot, "node_modules/better-sqlite3"), destPath, { recursive: true, dereference: true });
}

function rebuildNativeDependencies(projectRoot: string) {
    const electronVersion = determineElectronVersion(projectRoot);

    if (!electronVersion) {
        console.error("Unable to determine Electron version.");
        process.exit(1);
    }

    console.log(`Rebuilding ${projectRoot} with ${electronVersion}...`);

    const resolvedPath = resolve(projectRoot);
    rebuild({
        projectRootPath: resolvedPath,
        buildPath: resolvedPath,
        electronVersion,
        force: true
    });
}

function determineElectronVersion(projectRoot: string) {
    const packageJson = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf-8"));

    if (isNixOS()) {
        console.log("Detected NixOS, reading Electron version from PATH");

        try {
            return execSync(`${getElectronPath()} --version`, { }).toString("utf-8");
        } catch (e) {
            console.error("Got error while trying to read the Electron version from shell. Make sure that an Electron version is in the PATH (e.g. `nix-shell -p electron`)");
            process.exit(1);
        }
    } else {
        console.log("Using Electron version from package.json");
        return packageJson.devDependencies.electron;
    }
}

for (const projectRoot of [ "apps/desktop", "apps/edit-docs" ]) {
    copyNativeDependencies(projectRoot);
    rebuildNativeDependencies(projectRoot);
}
