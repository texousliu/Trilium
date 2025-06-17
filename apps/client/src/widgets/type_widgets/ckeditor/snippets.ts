import debounce from "debounce";
import froca from "../../../services/froca.js";
import type LoadResults from "../../../services/load_results.js";
import search from "../../../services/search.js";
import type { TemplateDefinition } from "@triliumnext/ckeditor5";
import appContext from "../../../components/app_context.js";

interface TemplateData {
    title: string;
    content: string | undefined;
}

let templateCache: Map<string, TemplateData> = new Map();
const debouncedHandleContentUpdate = debounce(handleContentUpdate, 1000);

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
        templateCache.set(snippet.noteId, {
            title: snippet.title,
            content: await snippet.getContent()
        });

        definitions.push({
            title: snippet.title,
            data: () => templateCache.get(snippet.noteId)?.content ?? ""
        })
    }
    return definitions;
}

function handleFullReload() {
    console.warn("Full text editor reload needed");
    appContext.triggerCommand("reloadTextEditor");
}

async function handleContentUpdate(affectedNoteIds: string[]) {
    const updatedNoteIds = new Set(affectedNoteIds);
    const templateNoteIds = new Set(templateCache.keys());
    const affectedTemplateNoteIds = templateNoteIds.intersection(updatedNoteIds);

    console.log("Got ", affectedTemplateNoteIds);

    await froca.getNotes(affectedNoteIds);

    let fullReloadNeeded = false;
    for (const affectedTemplateNoteId of affectedTemplateNoteIds) {
        const template = await froca.getNote(affectedTemplateNoteId);
        if (!template) {
            console.warn("Unable to obtain template with ID ", affectedTemplateNoteId);
            continue;
        }

        const newTitle = template.title;
        if (templateCache.get(affectedTemplateNoteId)?.title !== newTitle) {
            fullReloadNeeded = true;
            break;
        }

        templateCache.set(affectedTemplateNoteId, {
            title: template.title,
            content: await template.getContent()
        });
    }

    if (fullReloadNeeded) {
        handleFullReload();
    }
}

export function updateTemplateCache(loadResults: LoadResults): boolean {
    const affectedNoteIds = loadResults.getNoteIds();
    if (affectedNoteIds.length > 0) {
        debouncedHandleContentUpdate(affectedNoteIds);
    }

    if (loadResults.getAttributeRows().find((attr) =>
            attr.type === "label" &&
            attr.name === "textSnippet")) {
        handleFullReload();
    }

    return false;
}
