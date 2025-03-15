"use strict";

import { parse, Renderer, type Tokens } from "marked";
import { minify as minifyHtml } from "html-minifier";

// Keep renderer code up to date with https://github.com/markedjs/marked/blob/master/src/Renderer.ts.
const renderer = new Renderer({ async: false });
renderer.code = ({ text, lang, escaped }: Tokens.Code) => {
    if (!text) {
        return "";
    }

    const ckEditorLanguage = getNormalizedMimeFromMarkdownLanguage(lang);
    return `<pre><code class="language-${ckEditorLanguage}">${text}</code></pre>`;
};
renderer.blockquote = ({ tokens }: Tokens.Blockquote) => {
    const body = renderer.parser.parse(tokens);

    const admonitionMatch = /^<p>\[\!([A-Z]+)\]/.exec(body);
    if (Array.isArray(admonitionMatch) && admonitionMatch.length === 2) {
        const type = admonitionMatch[1].toLowerCase();

        if (ADMONITION_TYPE_MAPPINGS[type]) {
            const bodyWithoutHeader = body
                .replace(/^<p>\[\!([A-Z]+)\]/, "<p>")
                .replace(/^<p><\/p>/, ""); // Having a heading will generate an empty paragraph that we need to remove.

            return `<aside class="admonition ${type}">\n${bodyWithoutHeader}</aside>\n`;
        }
    }

    return `<blockquote>\n${body}</blockquote>\n`;
};

import htmlSanitizer from "../html_sanitizer.js";
import importUtils from "./utils.js";
import { getMimeTypeFromHighlightJs, MIME_TYPE_AUTO, normalizeMimeTypeForCKEditor } from "./mime_type_definitions.js";
import { ADMONITION_TYPE_MAPPINGS } from "../export/markdown.js";

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
