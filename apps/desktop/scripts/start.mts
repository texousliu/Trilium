import { execSync, spawnSync } from "child_process";
import { isNixOS, resetPath } from "../../../scripts/utils.mjs";
import { join } from "path";

const projectRoot = join(import.meta.dirname, "..");

let LD_LIBRARY_PATH = undefined;
let electronPath = "electron";
if (isNixOS()) {
    resetPath();    
    LD_LIBRARY_PATH = execSync("nix eval --raw nixpkgs#gcc.cc.lib").toString("utf-8") + "/lib";
    electronPath = execSync("nix eval --raw nixpkgs#electron_37").toString("utf-8") + "/bin/electron";
}

execSync(`${electronPath} ./src/main.ts`, {
    stdio: "inherit",
    cwd: projectRoot,
    env: {
        ...process.env,
        NODE_OPTIONS: "--import tsx",
        NODE_ENV: "development",
        TRILIUM_ENV: "dev",
        TRILIUM_RESOURCE_DIR: "../server/src",
        BETTERSQLITE3_NATIVE_PATH: join(projectRoot, "node_modules/better-sqlite3/build/Release/better_sqlite3.node"),
        LD_LIBRARY_PATH
    }
});
