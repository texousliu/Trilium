import type { ImportContext } from "./import_context.js";
import type { NoteImportData } from "./import.js";
import path from "path";

export default class MarkdownImporter {
    static getType() {
        return "markdown";
    }

    static getMimeTypes() {
        return ["text/markdown", "text/x-markdown"];
    }

    static getFileExtensions() {
        return ["md", "markdown"];
    }

    static async import(importContext: ImportContext, file: any, parentNoteId: string): Promise<NoteImportData> {
        const content = file.content || "";
        const title = path.basename(file.name, path.extname(file.name));

        return {
            title: title,
            content: content,
            type: "markdown",
            mime: "text/markdown",
            attributes: [],
            children: []
        };
    }
}
