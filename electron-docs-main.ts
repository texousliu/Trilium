import fs from "fs/promises";
import fsExtra from "fs-extra";
import path from "path";
import type NoteMeta from "./src/services/meta/note_meta.js";
import type { NoteMetaFile } from "./src/services/meta/note_meta.js";
import { initializeTranslations } from "./src/services/i18n.js";
import archiver, { type Archiver } from "archiver";
import type { WriteStream } from "fs";
import debounce from "./src/public/app/services/debounce.js";
import { extractZip, initializeDatabase, startElectron } from "./electron-utils.js";
import cls from "./src/services/cls.js";
import type { AdvancedExportOptions } from "./src/services/export/zip.js";
import TaskContext from "./src/services/task_context.js";
import { deferred } from "./src/services/utils.js";

const NOTE_ID_USER_GUIDE = "pOsGYCXsbNQG";
const NOTE_ID_RELEASE_NOTES = "hD3V4hiu2VW4";
const markdownPath = path.join("docs", "User Guide");
const releaseNotesPath = path.join("docs", "Release Notes");
const htmlPath = path.join("src", "public", "app", "doc_notes", "en", "User Guide");

async function main() {
    await initializeTranslations();
    await initializeDatabase(true);

    const initializedPromise = deferred<void>();
    cls.init(async () => {
        await importData(markdownPath);
        await importData(releaseNotesPath);
        setOptions();
        initializedPromise.resolve();
    });

    await initializedPromise;
    await startElectron();

    // Wait for the import to be finished and the application to be loaded before we listen to changes.
    setTimeout(() => registerHandlers(), 10_000);
}

async function setOptions() {
    const optionsService = (await import("./src/services/options.js")).default;
    optionsService.setOption("eraseUnusedAttachmentsAfterSeconds", 10);
    optionsService.setOption("eraseUnusedAttachmentsAfterTimeScale", 60);
    optionsService.setOption("compressImages", "false");
}

async function importData(path: string) {
    const buffer = await createImportZip(path);
    const importService = (await import("./src/services/import/zip.js")).default;
    const context = new TaskContext("no-progress-reporting", "import", false);
    const becca = (await import("./src/becca/becca.js")).default;

    const rootNote = becca.getRoot();
    if (!rootNote) {
        throw new Error("Missing root note for import.");
    }
    await importService.importZip(context, buffer, rootNote, {
        preserveIds: true
    });
}

async function createImportZip(path: string) {
    const inputFile = "input.zip";
    const archive = archiver("zip", {
        zlib: { level: 0 }
    });

    archive.directory(path, "/");

    const outputStream = fsExtra.createWriteStream(inputFile);
    archive.pipe(outputStream);
    await waitForEnd(archive, outputStream);

    try {
        return await fsExtra.readFile(inputFile);
    } finally {
        await fsExtra.rm(inputFile);
    }
}

function waitForEnd(archive: Archiver, stream: WriteStream) {
    return new Promise<void>(async (res, rej) => {
        stream.on("finish", () => res());
        await archive.finalize();
    });

}

async function exportData(noteId: string, format: "html" | "markdown", outputPath: string) {
    const zipFilePath = "output.zip";

    try {
        await fsExtra.remove(outputPath);
        await fsExtra.mkdir(outputPath);

        // First export as zip.
        const { exportToZipFile } = (await import("./src/services/export/zip.js")).default;

        const exportOpts: AdvancedExportOptions = {};
        if (format === "html") {
            exportOpts.customRewriteLinks = (originalRewriteLinks, getNoteTargetUrl) => {
                return (content: string, noteMeta: NoteMeta) => {
                    content = content.replace(/src="[^"]*api\/images\/([a-zA-Z0-9_]+)\/[^"]*"/g, (match, targetNoteId) => {
                        const url = getNoteTargetUrl(targetNoteId, noteMeta);

                        return url ? `src="${url}"` : match;
                    });

                    content = content.replace(/src="[^"]*api\/attachments\/([a-zA-Z0-9_]+)\/image\/[^"]*"/g, (match, targetAttachmentId) => {
                        const url = findAttachment(targetAttachmentId);

                        return url ? `src="${url}"` : match;
                    });

                    content = content.replace(/href="[^"]*#root[^"]*attachmentId=([a-zA-Z0-9_]+)\/?"/g, (match, targetAttachmentId) => {
                        const url = findAttachment(targetAttachmentId);

                        return url ? `href="${url}"` : match;
                    });

                    content = content.replace(/href="[^"]*#root[a-zA-Z0-9_\/]*\/([a-zA-Z0-9_]+)[^"]*"/g, (match, targetNoteId) => {
                        const components = match.split("/");
                        components[components.length - 1] = `_help_${components[components.length - 1]}`;
                        return components.join("/");
                    });

                    return content;

                    function findAttachment(targetAttachmentId: string) {
                        let url;

                        const attachmentMeta = (noteMeta.attachments || []).find((attMeta) => attMeta.attachmentId === targetAttachmentId);
                        if (attachmentMeta) {
                            // easy job here, because attachment will be in the same directory as the note's data file.
                            url = attachmentMeta.dataFileName;
                        } else {
                            console.info(`Could not find attachment meta object for attachmentId '${targetAttachmentId}'`);
                        }
                        return url;
                    }
                };
            };
        }

        await exportToZipFile(noteId, format, zipFilePath, exportOpts);
        await extractZip(zipFilePath, outputPath);
    } finally {
        if (await fsExtra.exists(zipFilePath)) {
            await fsExtra.rm(zipFilePath);
        }
    }

    await cleanUpMeta(outputPath);
}

async function cleanUpMeta(outputPath: string) {
    const metaPath = path.join(outputPath, "!!!meta.json");
    const meta = JSON.parse(await fs.readFile(metaPath, "utf-8")) as NoteMetaFile;
    for (const file of meta.files) {
        file.notePosition = 1;
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

async function registerHandlers() {
    const events = (await import("./src/services/events.js")).default;
    const eraseService = (await import("./src/services/erase.js")).default;
    const debouncer = debounce(async () => {
        eraseService.eraseUnusedAttachmentsNow();
        await exportData(NOTE_ID_USER_GUIDE, "markdown", markdownPath);
        await exportData(NOTE_ID_USER_GUIDE, "html", htmlPath);
        await exportData(NOTE_ID_RELEASE_NOTES, "markdown", releaseNotesPath);
    }, 10_000);
    events.subscribe(events.ENTITY_CHANGED, async (e) => {
        if (e.entityName === "options") {
            return;
        }

        console.log("Got entity changed ", e);
        debouncer();
    });
}

await main();
