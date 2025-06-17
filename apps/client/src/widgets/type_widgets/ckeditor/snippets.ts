import debounce from "debounce";
import froca from "../../../services/froca.js";
import type LoadResults from "../../../services/load_results.js";
import search from "../../../services/search.js";
import type { TemplateDefinition } from "@triliumnext/ckeditor5";

let templateCache: Map<string, string | undefined> = new Map();
const debouncedHandleUpdate = debounce(handleUpdate, 1000);

/**
 * Generates the list of snippets based on the user's notes to be passed down to the CKEditor configuration.
 *
 * @returns the list of templates.
 */
export default async function getTemplates() {
    // Build the definitions and populate the cache.
    const snippets = await search.searchForNotes("#textSnippet");
    const definitions: TemplateDefinition[] = [];
    for (const snippet of snippets) {
        templateCache.set(snippet.noteId, await snippet.getContent());

        definitions.push({
            title: snippet.title,
            data: () => templateCache.get(snippet.noteId) ?? ""
        })
    }
    return definitions;
}

async function handleUpdate(affectedNoteIds: string[]) {
    const updatedNoteIds = new Set(affectedNoteIds);
    const templateNoteIds = new Set(templateCache.keys());
    const affectedTemplateNoteIds = templateNoteIds.intersection(updatedNoteIds);

    console.log("Got ", affectedTemplateNoteIds);

    await froca.getNotes(affectedNoteIds);

    for (const affectedTemplateNoteId of affectedTemplateNoteIds) {
        const template = await froca.getNote(affectedTemplateNoteId);
        if (!template) {
            console.warn("Unable to obtain template with ID ", affectedTemplateNoteId);
            continue;
        }

        templateCache.set(affectedTemplateNoteId, await template.getContent());
    }
}

export function updateTemplateCache(loadResults: LoadResults): boolean {
    const affectedNoteIds = loadResults.getNoteIds();
    if (affectedNoteIds.length > 0) {
        debouncedHandleUpdate(affectedNoteIds);
    }


    return false;
}
