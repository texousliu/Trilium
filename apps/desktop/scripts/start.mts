import { execSync, spawnSync } from "child_process";
import { isNixOS, resetPath } from "../../../scripts/utils.mjs";
import { join } from "path";

const projectRoot = join(import.meta.dirname, "..");

if (isNixOS()) {
    resetPath();    
}

execSync("electron ./src/main.ts", {
    stdio: "inherit",
    cwd: projectRoot,
    env: {
        ...process.env,
        NODE_OPTIONS: "--import tsx",
        NODE_ENV: "development",
        TRILIUM_ENV: "dev",
        TRILIUM_DATA_DIR: "data",
        TRILIUM_RESOURCE_DIR: "../server/src"
    }
});
