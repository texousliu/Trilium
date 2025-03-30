import cls from "./src/services/cls.js";

export async function initializeDatabase() {
    const sqlInit = (await import("./src/services/sql_init.js")).default;

    cls.init(() => {
        if (!sqlInit.isDbInitialized()) {
            sqlInit.createInitialDatabase();
        }
    });
}

export async function startElectron() {
    await import("./electron-main.js");
}

export function importData(input: Buffer, rootId: string) {
    return new Promise<void>((resolve, reject) => {
        cls.init(async () => {
            const beccaLoader = ((await import("./src/becca/becca_loader.js")).default);
            const notes = ((await import("./src/services/notes.js")).default);
            beccaLoader.load();
            const becca = ((await import("./src/becca/becca.js")).default);
            const utils = ((await import("./src/services/utils.js")).default);
            const eraseService = ((await import("./src/services/erase.js")).default);
            const deleteId = utils.randomString(10);

            const existingNote = becca.getNote(rootId);
            if (existingNote) {
                existingNote.deleteNote(deleteId);
            }
            eraseService.eraseNotesWithDeleteId(deleteId);

            const { note } = notes.createNewNoteWithTarget("into", "none_root", {
                parentNoteId: "root",
                noteId: rootId,
                title: "User Guide",
                content: "The sub-children of this note are automatically synced.",
                type: "text"
            });

            const TaskContext = (await import("./src/services/task_context.js")).default;
            const { importZip } = ((await import("./src/services/import/zip.js")).default);
            const context = new TaskContext("no-report");
            await importZip(context, input, note, { preserveIds: true });

            const { runOnDemandChecks } = (await import("./src/services/consistency_checks.js")).default;
            await runOnDemandChecks(true);

            becca.reset();
            beccaLoader.load();

            resolve();
        });
    });

}
