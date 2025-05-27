import { extractZip, initializeDatabase, startElectron } from "./utils.js";
import { initializeTranslations } from "@triliumnext/server/src/services/i18n.js";
import debounce from "@triliumnext/client/src/services/debounce.js";
import fs from "fs/promises";
import { join } from "path";

// Paths are relative to apps/edit-docs/dist.
const DEMO_ZIP_PATH = join(__dirname, "../../server/src/assets/db/demo.zip");
const OUTPUT_DIR = join(__dirname, "../demo");

async function main() {
    const initializedPromise = startElectron(() => {
        // Wait for the import to be finished and the application to be loaded before we listen to changes.
        setTimeout(() => registerHandlers(), 10_000);
    });

    await initializeTranslations();
    await initializeDatabase(false);
    initializedPromise.resolve();
}

async function registerHandlers() {
    const events = (await import("@triliumnext/server/src/services/events.js")).default;
    const eraseService = (await import("@triliumnext/server/src/services/erase.js")).default;
    const debouncer = debounce(async () => {
        console.log("Exporting data");
        eraseService.eraseUnusedAttachmentsNow();
        await exportData();

        await fs.rmdir(OUTPUT_DIR, { recursive: true }).catch(() => {});
        await extractZip(DEMO_ZIP_PATH, OUTPUT_DIR);
    }, 10_000);
    events.subscribe(events.ENTITY_CHANGED, async (e) => {
        if (e.entityName === "options") {
            return;
        }

        console.log("Got entity changed ", e);
        debouncer();
    });
}

async function exportData() {
    const { exportToZipFile } = (await import("@triliumnext/server/src/services/export/zip.js")).default;
    await exportToZipFile("root", "html", DEMO_ZIP_PATH);
}

main();
