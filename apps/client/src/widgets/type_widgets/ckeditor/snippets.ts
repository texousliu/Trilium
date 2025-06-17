import search from "../../../services/search";
import type { TemplateDefinition } from "@triliumnext/ckeditor5";

/**
 * Generates the list of snippets based on the user's notes to be passed down to the CKEditor configuration.
 *
 * @returns the list of templates.
 */
export default async function getTemplates() {
    const definitions: TemplateDefinition[] = [];
    const snippets = await search.searchForNotes("#textSnippet");
    for (const snippet of snippets) {
        definitions.push({
            title: snippet.title,
            data: await snippet.getContent() ?? ""
        })
    }
    return definitions;
}
