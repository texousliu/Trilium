import BuildHelper from "../../../scripts/build-utils";

const build = new BuildHelper("packages/pdfjs-viewer");

async function main() {
    build.copy("viewer", "");
}

main();
