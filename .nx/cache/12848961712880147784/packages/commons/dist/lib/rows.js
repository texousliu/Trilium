// TODO: Booleans should probably be numbers instead (as SQLite does not have booleans.);
// TODO: check against schema.sql which properties really are "optional"
/**
 * There are many different Note types, some of which are entirely opaque to the
 * end user. Those types should be used only for checking against, they are
 * not for direct use.
 */ export const ALLOWED_NOTE_TYPES = [
    "file",
    "image",
    "search",
    "noteMap",
    "launcher",
    "doc",
    "contentWidget",
    "text",
    "relationMap",
    "render",
    "canvas",
    "mermaid",
    "book",
    "webView",
    "code",
    "mindMap",
    "geoMap"
];

//# sourceMappingURL=rows.js.map