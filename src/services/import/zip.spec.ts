import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import zip from "./zip.js";
import becca from "../../becca/becca.js";
import BNote from "../../becca/entities/bnote.js";
import TaskContext from "../task_context.js";
import cls from "../cls.js";
import sql_init from "../sql_init.js";
import { initializeTranslations } from "../i18n.js";
const scriptDir = dirname(fileURLToPath(import.meta.url));

describe("processNoteContent", () => {
    it("treats single MDX as Markdown in ZIP as text note", async () => {
        const mdxSample = fs.readFileSync(path.join(scriptDir, "samples", "mdx.zip"));
        const taskContext = TaskContext.getInstance("import-mdx", "import", {
            textImportedAsText: true
        });

        await new Promise<void>((resolve, reject) => {
            cls.init(async () => {
                initializeTranslations();
                sql_init.initializeDb();
                await sql_init.dbReady;

                const rootNote = becca.getNote("root");
                if (!rootNote) {
                    expect(rootNote).toBeTruthy();
                    return;
                }

                const importedNote = await zip.importZip(taskContext, mdxSample, rootNote as BNote);
                try {
                    expect(importedNote.mime).toBe("text/mdx");
                    expect(importedNote.type).toBe("text");
                } catch (e) {
                    reject(e);
                }
                resolve();
            });
        });
    });
})
