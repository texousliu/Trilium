"use strict";

import TurndownService from "turndown";
import turndownPluginGfm from "joplin-turndown-plugin-gfm";

let instance: TurndownService | null = null;

function toMarkdown(content: string) {
    if (instance === null) {
        instance = new TurndownService({ codeBlockStyle: 'fenced' });
        instance.addRule('fencedCodeBlock', {
            filter: function (node, options) {
              return (
                options.codeBlockStyle === 'fenced' &&
                node.nodeName === 'PRE' &&
                node.firstChild !== null &&
                node.firstChild.nodeName === 'CODE'
              )
            },
          
            replacement: function (content, node, options) {
              if (!node.firstChild || !("getAttribute" in node.firstChild) || typeof node.firstChild.getAttribute !== "function") {
                return content;
              }

              var className = node.firstChild.getAttribute('class') || ''
              var language = (className.match(/language-(\S+)/) || [null, ''])[1];
              language = rewriteLanguageTag(language);
          
              return (
                '\n\n' + options.fence + language + '\n' +
                node.firstChild.textContent +
                '\n' + options.fence + '\n\n'
              )
            }
          })
        instance.use(turndownPluginGfm.gfm);
    }

    return instance.turndown(content);
}

function rewriteLanguageTag(source: string) {
    if (source === "text-x-trilium-auto") {
        return "";
    }

    return source
        .split("-")
        .at(-1);
}

export default {
    toMarkdown
};
