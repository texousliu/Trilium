export default async () => {
    const beccaLoader = (await import("../../src/becca/becca_loader")).default;
    const becca = (await import("../../src/becca/becca")).default;
    const cls = (await import("../../src/services/cls")).default;
    const log = (await import("../../src/services/log")).default;
    const sql = (await import("../../src/services/sql")).default;

    cls.init(() => {
        // emergency disabling of image compression since it appears to make problems in migration to 0.61
        sql.execute(`UPDATE options SET value = 'false' WHERE name = 'compressImages'`);

        beccaLoader.load();

        for (const note of Object.values(becca.notes)) {
            try {
                const attachment = note.convertToParentAttachment({ autoConversion: true });

                if (attachment) {
                    log.info(`Auto-converted note '${note.noteId}' into attachment '${attachment.attachmentId}'.`);
                }
            } catch (e) {
                log.error(`Cannot convert note '${note.noteId}' to attachment: ${e.message} ${e.stack}`);
            }
        }
    });
};
