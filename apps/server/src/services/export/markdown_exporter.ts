import type BNote from "../../becca/entities/bnote.js";
import type { ExportContext } from "./export.js";

export default class MarkdownExporter {
    static getType() {
        return "markdown";
    }

    static async exportNote(note: BNote, exportContext: ExportContext): Promise<{ content: string; filename: string }> {
        const blob = await note.getBlob();
        const content = blob?.content || "";

        return {
            content: content,
            filename: `${note.title}.md`
        };
    }

    static getMimeType() {
        return "text/markdown";
    }

    static getFileExtension() {
        return "md";
    }
}
