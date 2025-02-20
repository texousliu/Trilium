import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import becca from "../../becca/becca.js";
import BNote from "../../becca/entities/bnote.js";
import TaskContext from "../task_context.js";
import cls from "../cls.js";
import sql_init from "../sql_init.js";
import { initializeTranslations } from "../i18n.js";
import single from "./single.js";
const scriptDir = dirname(fileURLToPath(import.meta.url));

describe("processNoteContent", () => {
    it("treats single MDX as Markdown", async () => {
        const mdxSample = fs.readFileSync(path.join(scriptDir, "samples", "Text Note.mdx"));
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
                    reject("Missing root note.");
                }

                const importedNote = single.importSingleFile(taskContext, {
                    originalname: "Text Note.mdx",
                    mimetype: "text/mdx",
                    buffer: mdxSample
                }, rootNote as BNote);
                try {
                    expect(importedNote.mime).toBe("text/html");
                    expect(importedNote.type).toBe("text");
                    expect(importedNote.title).toBe("Text Note");
                } catch (e) {
                    reject(e);
                }
                resolve();
            });
        });
    });
})
