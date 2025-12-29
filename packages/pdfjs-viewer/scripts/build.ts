import BuildHelper from "../../../scripts/build-utils";

const build = new BuildHelper("packages/pdfjs-viewer");

async function main() {
    build.copy("viewer", "web");
    build.copy("src/custom.mjs", "web/custom.mjs");
    build.copy("/node_modules/pdfjs-dist/build/pdf.mjs", "build/pdf.mjs");
    build.copy("/node_modules/pdfjs-dist/build/pdf.worker.mjs", "build/pdf.worker.mjs");
}

main();
