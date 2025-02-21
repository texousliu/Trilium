import { beforeAll, describe, expect, it } from "vitest";
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

async function testImport(fileName: string, mimetype: string): Promise<BNote> {
    const mdxSample = fs.readFileSync(path.join(scriptDir, "samples", fileName));
    const taskContext = TaskContext.getInstance("import-mdx", "import", {
        textImportedAsText: true
    });

    return new Promise<BNote>((resolve, reject) => {
        cls.init(async () => {
            const rootNote = becca.getNote("root");
            if (!rootNote) {
                reject("Missing root note.");
            }

            const importedNote = single.importSingleFile(taskContext, {
                originalname: fileName,
                mimetype,
                buffer: mdxSample
            }, rootNote as BNote);
            resolve(importedNote);
        });
    });
}

describe("processNoteContent", () => {
    beforeAll(async () => {
        initializeTranslations();
        sql_init.initializeDb();
        await sql_init.dbReady;
    });

    it("treats single MDX as Markdown", async () => {
        const importedNote = await testImport("Text Note.mdx", "text/mdx");
        expect(importedNote.mime).toBe("text/html");
        expect(importedNote.type).toBe("text");
        expect(importedNote.title).toBe("Text Note");
    });

    it("supports HTML note with UTF-16 (w/ BOM) from Microsoft Outlook", async () => {
        const importedNote = await testImport("IREN Reports Q2 FY25 Results.htm", "text/html");
        expect(importedNote.mime).toBe("text/html");
        expect(importedNote.title).toBe("IREN Reports Q2 FY25 Results");
        expect(importedNote.getContent().toString().substring(0, 5)).toEqual("<html");
    });
})
