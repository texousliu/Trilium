import * as esbuild from "esbuild";
import { join } from "path";
import * as child_process from "child_process";
import BuildHelper from "../../../scripts/build-utils";

const projectDir = __dirname + "/..";
const outDir = join(projectDir, "dist");
const build = new BuildHelper("apps/server");

async function runBuild() {
    esbuild.build({
        entryPoints: [
            join(projectDir, "src/main.ts"),
            join(projectDir, "src/docker_healthcheck.ts")
        ],
        tsconfig: join(projectDir, "tsconfig.app.json"),
        platform: "node",
        bundle: true,
        outdir: outDir,
        outExtension: {
            ".js": ".cjs"
        },
        format: "cjs",
        external: [
            "electron",
            "@electron/remote",
            "better-sqlite3",
            "./xhr-sync-worker.js",
            "vite"
        ],
        splitting: false,
        loader: {
            ".css": "text",
            ".ejs": "text"
        },
        define: {
            "process.env.NODE_ENV": JSON.stringify("production"),
        },
        minify: true
    });
}

function copyAssets() {
    // Copy server assets
    build.copy("src/assets", "assets/");

    // Copy node modules
    for (const module of [ "better-sqlite3", "bindings", "file-uri-to-path" ]) {
        build.copy(`node_modules/${module}`, `node_modules/${module}/`);
    }

    // Copy sync worker.
    build.copy("node_modules/jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js", "xhr-sync-worker.js");

    // Copy share templates.
    build.copy("../../packages/share-theme/src/templates", "share-theme/templates/");
}

function buildAndCopyClient() {
    // Trigger the build.
    child_process.execSync("pnpm build", { cwd: join(projectDir, "../client"), stdio: "inherit" });

    // Copy the artifacts.
    build.copy("../client/dist", "public/");

    // Remove unnecessary files.
    build.deleteFromOutput("public/webpack-stats.json");
}

async function main() {
    await runBuild();
    copyAssets();
    buildAndCopyClient();
}

main();
