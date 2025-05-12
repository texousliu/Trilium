import { EditorView, Decoration, MatchDecorator, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { StateEffect, Compartment, EditorSelection, RangeSet } from "@codemirror/state";

const searchMatchDecoration = Decoration.mark({ class: "cm-searchMatch" });

interface Match {
    from: number;
    to: number;
}

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
        matches!: RangeSet<Decoration>;
        totalFound: number;
        private parsedMatches: Match[];

        constructor(public view: EditorView) {
            this.parsedMatches = [];
            this.totalFound = 0;
            this.updateSearchData(view);
        }

        updateSearchData(view: EditorView) {
            const matches = matcher.createDeco(view);
            const cursor = matches.iter();
            while (cursor.value) {
                this.parsedMatches.push({
                    from: cursor.from,
                    to: cursor.to
                });
                cursor.next();
            }

            this.matches = matches;
            this.totalFound = this.parsedMatches.length;
        }

        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
                this.updateSearchData(update.view);
            }
        }

        scrollToMatch(matchIndex: number) {
            if (this.parsedMatches.length <= matchIndex) {
                return;
            }

            const pos = this.parsedMatches[matchIndex];
            this.view.dispatch({
                effects: EditorView.scrollIntoView(pos.from, { y: "center" }),
                scrollIntoView: true
            });
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
