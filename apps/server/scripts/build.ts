import * as esbuild from "esbuild";
import { join } from "path";
import * as fs from "fs-extra";
import * as child_process from "child_process";

const projectDir = __dirname + "/..";
const outDir = join(projectDir, "dist");

async function build() {
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
    copy("src/assets", "assets/");

    // Copy node modules
    for (const module of [ "better-sqlite3", "bindings", "file-uri-to-path" ]) {
        copy(`node_modules/${module}`, `node_modules/${module}/`);
    }

    // Copy sync worker.
    copy("node_modules/jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js", "xhr-sync-worker.js");

    // Copy share templates.
    copy("../../packages/share-theme/src/templates", "share-theme/templates/");
}

function buildAndCopyClient() {
    // Trigger the build.
    child_process.execSync("pnpm build", { cwd: join(projectDir, "../client"), stdio: "inherit" });

    // Copy the artifacts.
    copy("../client/dist", "public/");

    // Remove unnecessary files.
    deleteFromOutput("public/webpack-stats.json");
}

function copy(projectDirPath: string, outDirPath: string) {
    if (outDirPath.endsWith("/")) {
        fs.mkdirpSync(join(outDirPath));
    }
    fs.copySync(join(projectDir, projectDirPath), join(outDir, outDirPath), { dereference: true });
}

function deleteFromOutput(path: string) {
    fs.rmSync(join(outDir, path), { recursive: true });
}

async function main() {
    fs.emptyDirSync(outDir);
    await build();
    copyAssets();
    buildAndCopyClient();
}

main();
