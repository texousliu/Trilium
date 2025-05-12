import { EditorView, Decoration, MatchDecorator, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { StateEffect, Compartment } from "@codemirror/state";

const searchMatchDecoration = Decoration.mark({ class: "cm-searchMatch" });

export function createSearchHighlighter(view: EditorView, searchTerm: string, matchCase: boolean, wholeWord: boolean) {
    // Escape the search term for use in RegExp
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordBoundary = wholeWord ? "\\b" : "";
    const flags = matchCase ? "g" : "gi";
    const regex = new RegExp(`${wordBoundary}${escapedTerm}${wordBoundary}`, flags);

    const matcher = new MatchDecorator({
        regexp: regex,
        decoration: searchMatchDecoration,
    });

    return ViewPlugin.fromClass(class SearchHighlighter {
        matches = matcher.createDeco(view);
        totalFound = this.matches.size;

        constructor(public view: EditorView) { }

        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
                this.matches = matcher.createDeco(update.view);
            }
        }

        destroy() {
            // Do nothing.
        }

        static deco = (v: SearchHighlighter) => v.matches;
    }, {
        decorations: v => v.matches,
        provide: (plugin) => plugin
    });
}


export const searchMatchHighlightTheme = EditorView.baseTheme({
    ".cm-searchMatch": {
        backgroundColor: "rgba(255, 255, 0, 0.4)",
        borderRadius: "2px"
    }
});
