import * as esbuild from "esbuild";
import { join } from "path";
import * as fs from "fs-extra";

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
            "@preact/preset-vite",
            "vite"
        ],
        splitting: false,
        loader: {
            ".css": "text",
            ".ejs": "text"
        }
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

function copy(projectDirPath: string, outDirPath: string) {
    if (outDirPath.endsWith("/")) {
        fs.mkdirpSync(join(outDirPath));
    }
    fs.copySync(join(projectDir, projectDirPath), join(outDir, outDirPath), { dereference: true });
}

async function main() {
    fs.emptyDirSync(outDir);
    await build();
    copyAssets();
}

main();
