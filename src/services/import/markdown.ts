"use strict";

import { parse, Renderer, type Tokens } from "marked";
import { minify as minifyHtml } from "html-minifier";

const renderer = new Renderer({ async: false });
renderer.code = ({ text, lang, escaped }: Tokens.Code) => {
    if (!text) {
        return "";
    }

    const ckEditorLanguage = getNormalizedMimeFromMarkdownLanguage(lang);
    return `<pre><code class="language-${ckEditorLanguage}">${text}</code></pre>`;
};

import htmlSanitizer from "../html_sanitizer.js";
import importUtils from "./utils.js";
import { getMimeTypeFromHighlightJs, MIME_TYPE_AUTO, normalizeMimeTypeForCKEditor } from "./mime_type_definitions.js";

function renderToHtml(content: string, title: string) {
    let html = parse(content, {
        async: false,
        renderer: renderer
    }) as string;

    // h1 handling needs to come before sanitization
    html = importUtils.handleH1(html, title);
    html = htmlSanitizer.sanitize(html);
    html = minifyHtml(html, {
        collapseWhitespace: true
    });

    return html;
}

function getNormalizedMimeFromMarkdownLanguage(language: string | undefined) {
    if (language) {
        const highlightJsName = getMimeTypeFromHighlightJs(language);
        if (highlightJsName) {
            return normalizeMimeTypeForCKEditor(highlightJsName.mime);
        }
    }

    return MIME_TYPE_AUTO;
}

export default {
    renderToHtml
};
