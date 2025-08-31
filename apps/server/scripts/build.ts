import * as esbuild from "esbuild";
import { join } from "path";
import * as fs from "fs-extra";

const projectDir = __dirname + "/..";
const outDir = join(projectDir, "dist");

async function build() {
    esbuild.build({
        entryPoints: [ join(projectDir, "src/main.ts") ],
        tsconfig: join(projectDir, "tsconfig.app.json"),
        platform: "node",
        bundle: true,
        outdir: outDir,
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
    fs.copySync(join(projectDir, "src/assets"), join(outDir, "assets"));

    // Copy node modules
    fs.mkdir(join(outDir, "node_modules"));
    for (const module of [ "better-sqlite3", "bindings", "file-uri-to-path" ]) {
        fs.copySync(join(projectDir, "node_modules", module), join(outDir, "node_modules", module), { dereference: true });
    }

    // Copy sync worker.
    fs.copySync(join(projectDir, "node_modules/jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js"), join(outDir, "xhr-sync-worker.js"));
}

async function main() {
    fs.rmSync(outDir, { recursive: true });
    fs.mkdirSync(outDir);
    await build();
    copyAssets();
}

main();
