import hljs from "../node_modules/highlight.js/es/core.js";
import { normalizeMimeTypeForCKEditor, type MimeType } from "@triliumnext/commons";
import syntaxDefinitions from "./syntax_highlighting.js";
import { type Theme } from "./themes.js";
import { type HighlightOptions } from "highlight.js";

export { default as Themes } from "./themes.js";

const registeredMimeTypes = new Set<string>();
const unsupportedMimeTypes = new Set<string>();

export async function ensureMimeTypes(mimeTypes: MimeType[]) {
    for (const mimeType of mimeTypes) {
        if (!mimeType.enabled) {
            continue;
        }

        const mime = normalizeMimeTypeForCKEditor(mimeType.mime);
        if (registeredMimeTypes.has(mime)) {
            continue;
        }

        registeredMimeTypes.add(mime);
        const loader = syntaxDefinitions[mime];
        if (!loader) {
            unsupportedMimeTypes.add(mime);
            continue;
        }

        const language = (await loader()).default;
        hljs.registerLanguage(mime, language);
    }
}

export function highlight(code: string, options: HighlightOptions) {
    if (unsupportedMimeTypes.has(options.language)) {
        return null;
    }

    if (!registeredMimeTypes.has(options.language)) {
        console.warn(`Unable to find highlighting for ${options.language}.`);
        return null;
    }

    return hljs.highlight(code, options);
}

export async function loadTheme(theme: Theme) {
    console.log("Got", theme.default);
}

export const { highlightAuto } = hljs;
