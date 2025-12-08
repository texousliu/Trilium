import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const rootDir = join(__dirname, "../..");
const docsDir = join(rootDir, "docs");

/**
 * The base file is used by Weblate when generating new languages for the README file.
 * The problem is that translated READMEs reside in `/docs/` while the main README is in `/`, which breaks all relative links.
 * As such, we need to use a separate base file that is in `/docs` with the right relative paths.
 * The README in the repo root remains the true base file, but it's a two-step process which requires the execution of this script.
 */
async function handleBaseFile() {
    // Read the README at root level.
    const readmePath = join(rootDir, "README.md");
    const readme = await readFile(readmePath, "utf-8");

    // Copy it into docs.
    const outputPath = join(docsDir, "README.md");
    await writeFile(outputPath, readme);
}

async function main() {
    await handleBaseFile();
}

main();
