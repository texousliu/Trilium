import { extractZip, importData, initializeDatabase, startElectron } from "./electron-utils.js";
import { initializeTranslations } from "./src/services/i18n.js";
import fs from "fs";
import debounce from "./src/public/app/services/debounce.js";

const DEMO_NOTE_ID = "demo";
const DEMO_ZIP_PATH = "db/demo.zip";

async function main() {
    await initializeTranslations();
    await initializeDatabase();

    const demoBuffer = fs.readFileSync(DEMO_ZIP_PATH);
    await importData(demoBuffer, DEMO_NOTE_ID);

    await startElectron();
    await registerHandlers();
}

async function registerHandlers() {
    const events = (await import("./src/services/events.js")).default;
    const eraseService = (await import("./src/services/erase.js")).default;
    const debouncer = debounce(async () => {
        console.log("Exporting data");
        eraseService.eraseUnusedAttachmentsNow();
        await exportData();
        await extractZip(DEMO_ZIP_PATH, "demo");
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
    const { exportToZipFile } = (await import("./src/services/export/zip.js")).default;
    await exportToZipFile(DEMO_NOTE_ID, "html", DEMO_ZIP_PATH);
}

await main();
