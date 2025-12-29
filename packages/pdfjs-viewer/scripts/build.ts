import { join } from "path";
import BuildHelper from "../../../scripts/build-utils";
import { build as esbuild } from "esbuild";

const build = new BuildHelper("packages/pdfjs-viewer");

async function main() {
    build.copy("viewer", "web");
    await buildScript("web/custom.mjs");
    build.copy("src/custom.css", "web/custom.css");
    build.copy("/node_modules/pdfjs-dist/build/pdf.mjs", "build/pdf.mjs");
    build.copy("/node_modules/pdfjs-dist/build/pdf.worker.mjs", "build/pdf.worker.mjs");
}

async function buildScript(outPath: string) {
    await esbuild({
        entryPoints: [join(build.projectDir, "src/custom.ts")],
        tsconfig: join(build.projectDir, "tsconfig.app.json"),
        bundle: true,
        outfile: join(build.outDir, outPath),
        format: "esm",
        platform: "browser",
        minify: true,
    });
}

main();
