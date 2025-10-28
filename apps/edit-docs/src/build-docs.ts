process.env.TRILIUM_INTEGRATION_TEST = "memory-no-store";
process.env.TRILIUM_RESOURCE_DIR = "../server/src";
process.env.NODE_ENV = "development";

import cls from "@triliumnext/server/src/services/cls.js";
import { join, resolve } from "path";
import fsExtra, { type WriteStream } from "fs-extra";
import archiver, { type Archiver } from "archiver";
import type { ExportFormat } from "@triliumnext/server/src/services/export/zip/abstract_provider.js";

const DOCS_ROOT = "../../../docs";

async function main() {
    const i18n = await import("@triliumnext/server/src/services/i18n.js");
    await i18n.initializeTranslations();

    const sqlInit = (await import("../../server/src/services/sql_init.js")).default;
    await sqlInit.createInitialDatabase(true);

    await importData(join(__dirname, DOCS_ROOT, "User Guide"));

    console.log("DB ready!");
}

export async function importData(path: string) {
    const buffer = await createImportZip(path);
    const importService = (await import("@triliumnext/server/src/services/import/zip.js")).default;
    const TaskContext = (await import("@triliumnext/server/src/services/task_context.js")).default;
    const context = new TaskContext("no-progress-reporting", "importNotes", null);
    const becca = (await import("@triliumnext/server/src/becca/becca.js")).default;

    const rootNote = becca.getRoot();
    if (!rootNote) {
        throw new Error("Missing root note for import.");
    }
    const note = await importService.importZip(context, buffer, rootNote, {
        preserveIds: true
    });

    // Export
    const zipFilePath = "output.zip";
    const { exportToZipFile } = (await import("@triliumnext/server/src/services/export/zip.js")).default;
    await exportToZipFile(note.noteId, "share", zipFilePath);
}

async function createImportZip(path: string) {
    const inputFile = "input.zip";
    const archive = archiver("zip", {
        zlib: { level: 0 }
    });

    console.log("Archive path is ", resolve(path))
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

cls.init(main);
