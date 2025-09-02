import { join } from "path";
import { cpSync, existsSync, mkdirSync, rmSync } from "fs";
import { execSync } from "child_process";
import { rebuild } from "@electron/rebuild"
import { getElectronPath, isNixOS } from "../../../scripts/utils.mjs";
import packageJson from "../package.json" with { type: "json" };

const desktopProjectRoot = join(import.meta.dirname, "..");
const workspaceRoot = join(desktopProjectRoot, "../..");

function copyNativeDependencies() {
    const destPath = join(desktopProjectRoot, "node_modules/better-sqlite3");
    
    if (existsSync(destPath)) {
        rmSync(destPath, { recursive: true });
    }
    mkdirSync(destPath);
    cpSync(join(workspaceRoot, "node_modules/better-sqlite3"), destPath, { recursive: true, dereference: true });
}

function rebuildNativeDependencies() {
    const electronVersion = determineElectronVersion();

    if (!electronVersion) {
        console.error("Unable to determine Electron version.");
        process.exit(1);
    }

    console.log(`Rebuilding ${desktopProjectRoot} with ${electronVersion}...`);

    rebuild({
        projectRootPath: desktopProjectRoot,
        buildPath: desktopProjectRoot,
        electronVersion
    });
}

function determineElectronVersion() {
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

copyNativeDependencies();
rebuildNativeDependencies();
