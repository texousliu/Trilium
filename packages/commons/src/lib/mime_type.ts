export interface MimeTypeDefinition {
    default?: boolean;
    title: string;
    mime: string;
    /** The name of the language/mime type as defined by highlight.js (or one of the aliases), in order to be used for syntax highlighting such as inside code blocks. */
    highlightJs?: string;
    /** If specified, will load the corresponding highlight.js file from the `libraries/highlightjs/${id}.js` instead of `node_modules/@highlightjs/cdn-assets/languages/${id}.min.js`. */
    highlightJsSource?: "libraries";
    /** If specified, will load the corresponding highlight file from the given path instead of `node_modules`. */
    codeMirrorSource?: string;
}

export interface MimeType extends MimeTypeDefinition {
    /**
     * True if this mime type was enabled by the user in the "Available MIME types in the dropdown" option in the Code Notes settings.
     */
    enabled: boolean;
}

/**
 * Given a MIME type in the usual format (e.g. `text/csrc`), it returns a MIME type that can be passed down to the CKEditor
 * code plugin.
 *
 * @param mimeType The MIME type to normalize, in the usual format (e.g. `text/c-src`).
 * @returns the normalized MIME type (e.g. `text-c-src`).
 */
export function normalizeMimeTypeForCKEditor(mimeType: string) {
    return mimeType.toLowerCase().replace(/[\W_]+/g, "-");
}
