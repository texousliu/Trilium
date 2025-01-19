"use strict";

import mimeTypes from "mime-types";
import path from "path";
import type { TaskData } from "../task_context_interface.js";

const CODE_MIME_TYPES = new Set([
    "application/json",
    "message/http",
    "text/css",
    "text/html",
    "text/plain",
    "text/x-clojure",
    "text/x-csharp",
    "text/x-c++src",
    "text/x-csrc",
    "text/x-dockerfile",
    "text/x-erlang",
    "text/x-feature",
    "text/x-go",
    "text/x-groovy",
    "text/x-haskell",
    "text/x-java",
    "text/x-kotlin",
    "text/x-lua",
    "text/x-markdown",
    "text/xml",
    "text/x-objectivec",
    "text/x-pascal",
    "text/x-perl",
    "text/x-php",
    "text/x-python",
    "text/x-ruby",
    "text/x-rustsrc",
    "text/x-scala",
    "text/x-sh",
    "text/x-sql",
    "text/x-stex",
    "text/x-swift",
    "text/x-yaml"
]);

const CODE_MIME_TYPES_OVERRIDE = new Map([
    ["application/javascript", "application/javascript;env=frontend"],
    ["application/x-javascript", "application/javascript;env=frontend"],
    // possibly later migrate to text/markdown as primary MIME
    ["text/markdown", "text/x-markdown"]
]);

// extensions missing in mime-db
const EXTENSION_TO_MIME: Record<string, string> = {
    ".c": "text/x-csrc",
    ".cs": "text/x-csharp",
    ".clj": "text/x-clojure",
    ".erl": "text/x-erlang",
    ".hrl": "text/x-erlang",
    ".feature": "text/x-feature",
    ".go": "text/x-go",
    ".groovy": "text/x-groovy",
    ".hs": "text/x-haskell",
    ".lhs": "text/x-haskell",
    ".http": "message/http",
    ".kt": "text/x-kotlin",
    ".m": "text/x-objectivec",
    ".py": "text/x-python",
    ".rb": "text/x-ruby",
    ".scala": "text/x-scala",
    ".swift": "text/x-swift"
};

/** @returns false if MIME is not detected */
function getMime(fileName: string) {
    if (fileName.toLowerCase() === "dockerfile") {
        return "text/x-dockerfile";
    }

    const ext = path.extname(fileName).toLowerCase();

    if (ext in EXTENSION_TO_MIME) {
        return EXTENSION_TO_MIME[ext];
    }

    return mimeTypes.lookup(fileName);
}

function getType(options: TaskData, mime: string) {
    mime = mime ? mime.toLowerCase() : "";

    if (options.textImportedAsText && (mime === "text/html" || ["text/markdown", "text/x-markdown"].includes(mime))) {
        return "text";
    } else if (options.codeImportedAsCode && CODE_MIME_TYPES.has(mime)) {
        return "code";
    } else if (mime.startsWith("image/")) {
        return "image";
    } else {
        return "file";
    }
}

function normalizeMimeType(mime: string) {
    mime = mime ? mime.toLowerCase() : "";

    if (CODE_MIME_TYPES.has(mime)) {
        return mime;
    } else if (CODE_MIME_TYPES_OVERRIDE.get(mime)) {
        return CODE_MIME_TYPES_OVERRIDE.get(mime);
    }

    return undefined;
}

export default {
    getMime,
    getType,
    normalizeMimeType
};
