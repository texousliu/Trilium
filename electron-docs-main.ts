import fs from "fs/promises";
import fsExtra from "fs-extra";
import path from "path";
import type NoteMeta from "./src/services/meta/note_meta.js";
import type { NoteMetaFile } from "./src/services/meta/note_meta.js";
import cls from "./src/services/cls.js";
import { initializeTranslations } from "./src/services/i18n.js";

const NOTE_ID_USER_GUIDE = "pOsGYCXsbNQG";
const destRootPath = path.join("src", "public", "app", "doc_notes", "en", "User Guide");

async function startElectron() {
    await import("./electron-main.js");
}

async function main() {
    await initializeTranslations();
    await initializeDatabase();

    await startElectron();
    // await exportData();
}

async function initializeDatabase() {
    const sqlInit = (await import("./src/services/sql_init.js")).default;

    cls.init(() => {
        if (!sqlInit.isDbInitialized()) {
            sqlInit.createInitialDatabase();
        }
    });
}

async function exportData() {
    const zipFilePath = "output.zip";

    const deferred = (await import("./src/services/utils.js")).deferred;

    try {
        await fsExtra.remove(destRootPath);
        await fsExtra.mkdir(destRootPath);

        // First export as zip.
        const { exportToZipFile } = (await import("./src/services/export/zip.js")).default;
        await exportToZipFile(NOTE_ID_USER_GUIDE, "html", zipFilePath);

        const promise = deferred<void>()
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
            promise.resolve();
        }, 1000);
        await promise;
    } finally {
        if (await fsExtra.exists(zipFilePath)) {
            await fsExtra.rm(zipFilePath);
        }
    }

    await cleanUpMeta();
}

async function cleanUpMeta() {
    const metaPath = path.join(destRootPath, "!!!meta.json");
    const meta = JSON.parse(await fs.readFile(metaPath, "utf-8")) as NoteMetaFile;
    for (const file of meta.files) {
        traverse(file);
    }

    function traverse(el: NoteMeta) {
        for (const child of el.children || []) {
            traverse(child);
        }

        el.isExpanded = false;
    }

    await fs.writeFile(metaPath, JSON.stringify(meta, null, 4));
}

await main();
