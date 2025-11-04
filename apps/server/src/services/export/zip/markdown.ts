import NoteMeta from "../../meta/note_meta"
import { ZipExportProvider } from "./abstract_provider.js"
import mdService from "../markdown.js";
import type BNote from "../../../becca/entities/bnote.js";
import type BBranch from "../../../becca/entities/bbranch.js";
import type { ExportFormat } from "./abstract_provider.js";

export default class MarkdownExportProvider extends ZipExportProvider {

    prepareMeta() { }

    prepareContent(title: string, content: string | Buffer, noteMeta: NoteMeta, note: BNote | undefined, branch: BBranch): string | Buffer {
        if (noteMeta.format === "markdown" && typeof content === "string") {
            content = this.rewriteFn(content, noteMeta);
            content = mdService.toMarkdown(content);

            if (content.trim().length > 0 && !content.startsWith("# ")) {
                content = `\
# ${title}\r
${content}`;
            }
        } else if (noteMeta.type === "markdown" && typeof content === "string") {
            // Handle markdown note type - keep as markdown for markdown export
            content = this.rewriteFn(content, noteMeta);
            // For markdown note type, content is already in markdown format
            if (content.trim().length > 0 && !content.startsWith("# ")) {
                content = `# ${title}\r
${content}`;
            }
        }
        return content;
    }

    mapExtension(type: string | null, mime: string, existingExtension: string, format: ExportFormat) {
        // Handle markdown note type
        if (type === "markdown") {
            return "md";
        }
        // Use parent implementation for other types
        return super.mapExtension(type, mime, existingExtension, format);
    }

    afterDone() { }

}
