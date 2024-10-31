import mime_types from "./mime_types.js";

/**
 * Identifies all the code blocks under the specified hierarchy and uses the highlight.js library to obtain the highlighted text which is then applied on to the code blocks.
 * 
 * @param $container the container under which to look for code blocks and to apply syntax highlighting to them.
 */
export function applySyntaxHighlight($container) {
    const codeBlocks = $container.find("pre code");
    for (const codeBlock of codeBlocks) {
        $(codeBlock).parent().toggleClass("hljs");

        const text = codeBlock.innerText;

        const normalizedMimeType = extractLanguageFromClassList(codeBlock);
        if (!normalizedMimeType) {
            continue;
        }

        let highlightedText = null;
        if (normalizedMimeType === mime_types.MIME_TYPE_AUTO) {
            highlightedText = hljs.highlightAuto(text);
        } else if (normalizedMimeType) {
            const language = mime_types.getHighlightJsNameForMime(normalizedMimeType);
            highlightedText = hljs.highlight(text, { language });
        }
        
        if (highlightedText) {            
            codeBlock.innerHTML = highlightedText.value;
        }
    }
}

/**
 * Given a HTML element, tries to extract the `language-` class name out of it.
 * 
 * @param {string} el the HTML element from which to extract the language tag.
 * @returns the normalized MIME type (e.g. `text-css` instead of `language-text-css`).
 */
function extractLanguageFromClassList(el) {
    const prefix = "language-";
    for (const className of el.classList) {
        if (className.startsWith(prefix)) {
            return className.substr(prefix.length);
        }
    }

    return null;
}