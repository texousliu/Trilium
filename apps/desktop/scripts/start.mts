import { execSync } from "child_process";
import { getElectronPath, isNixOS } from "../../../scripts/utils.mjs";
import { join } from "path";

const projectRoot = join(import.meta.dirname, "..");
const LD_LIBRARY_PATH = isNixOS() && execSync("nix eval --raw nixpkgs#gcc.cc.lib").toString("utf-8") + "/lib";

execSync(`${getElectronPath()} ./src/main.ts`, {
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
