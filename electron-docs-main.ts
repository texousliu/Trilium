import fs from "fs/promises";
import fsExtra from "fs-extra";
import path from "path";

const NOTE_ID_USER_GUIDE = "pOsGYCXsbNQG";

async function startElectron() {
    await import("./electron-main.js");
}

async function main() {
    await startElectron();
    await exportData();
}

async function exportData() {
    const zipFilePath = "output.zip";
    const destRootPath = path.join("src", "public", "app", "doc_notes", "en", "User Guide");

    await fsExtra.remove(destRootPath);
    await fsExtra.mkdir(destRootPath);

    // First export as zip.
    const { exportToZipFile } = (await import("./src/services/export/zip.js")).default;
    await exportToZipFile(NOTE_ID_USER_GUIDE, "html", zipFilePath);

    setTimeout(async () => {
        // Then extract the zip.
        const { readZipFile, readContent } = (await import("./src/services/import/zip.js"));
        await readZipFile(await fs.readFile(zipFilePath), async (zip, entry) => {
            // We ignore directories since they can appear out of order anyway.
            if (!entry.fileName.endsWith("/")) {
                const destPath = path.join(destRootPath, entry.fileName);
                const fileContent = await readContent(zip, entry);

                await fsExtra.mkdirs(path.dirname(destPath));
                await fs.writeFile(destPath, fileContent);
            }

            zip.readEntry();
        });
    }, 1000);
}

await main();
