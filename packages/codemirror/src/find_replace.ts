import { EditorView, Decoration, MatchDecorator, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { Range, RangeSet } from "@codemirror/state";

const searchMatchDecoration = Decoration.mark({ class: "cm-searchMatch" });
const activeMatchDecoration = Decoration.mark({ class: "cm-activeMatch" });

interface Match {
    from: number;
    to: number;
}

export class SearchHighlighter {
    matches: RangeSet<Decoration>;
    activeMatch?: Range<Decoration>;

    currentFound: number;
    totalFound: number;
    matcher?: MatchDecorator;
    private parsedMatches: Match[];

    constructor(public view: EditorView) {
        this.parsedMatches = [];
        this.currentFound = 0;
        this.totalFound = 0;

        this.matches = RangeSet.empty;
    }

    searchFor(searchTerm: string, matchCase: boolean, wholeWord: boolean) {
        if (!searchTerm) {
            this.matches = RangeSet.empty;
            return;
        }

        // Escape the search term for use in RegExp
        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordBoundary = wholeWord ? "\\b" : "";
        const flags = matchCase ? "g" : "gi";
        const regex = new RegExp(`${wordBoundary}${escapedTerm}${wordBoundary}`, flags);

        this.matcher = new MatchDecorator({
            regexp: regex,
            decoration: searchMatchDecoration,
        });
        this.#updateSearchData(this.view);
        this.#scrollToMatchNearestSelection();
    }

    replaceActiveMatch(replacementText: string) {
        if (!this.parsedMatches.length || this.currentFound === 0) return;

        const matchIndex = this.currentFound - 1;
        const match = this.parsedMatches[matchIndex];

        this.view.dispatch({
            changes: { from: match.from, to: match.to, insert: replacementText }
        });
    }

    scrollToMatch(matchIndex: number) {
        if (this.parsedMatches.length <= matchIndex) {
            return;
        }

        const match = this.parsedMatches[matchIndex];
        this.currentFound = matchIndex + 1;
        this.activeMatch = activeMatchDecoration.range(match.from, match.to);
        this.view.dispatch({
            effects: EditorView.scrollIntoView(match.from, { y: "center" }),
            scrollIntoView: true
        });
    }

    update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
            this.#updateSearchData(update.view);
        }
    }

    destroy() {
        // Do nothing.
    }

    #updateSearchData(view: EditorView) {
        if (!this.matcher) {
            return;
        }

        const matches = this.matcher.createDeco(view);
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

    #scrollToMatchNearestSelection() {
        const cursorPos = this.view.state.selection.main.head;
        let index = 0;
        for (const match of this.parsedMatches) {
            if (match.from >= cursorPos) {
                this.scrollToMatch(index);
                return;
            }

            index++;
        }
    }

    static deco = (v: SearchHighlighter) => v.matches;
}

export function createSearchHighlighter() {
    return ViewPlugin.fromClass(SearchHighlighter, {
        decorations: v => {
            if (v.activeMatch) {
                return v.matches.update({ add: [v.activeMatch] });
            } else {
                return v.matches;
            }
        },
        provide: (plugin) => plugin
    });
}

export const searchMatchHighlightTheme = EditorView.baseTheme({
    ".cm-searchMatch": {
        backgroundColor: "rgba(255, 255, 0, 0.4)",
        borderRadius: "2px"
    },
    ".cm-activeMatch": {
        backgroundColor: "rgba(255, 165, 0, 0.6)",
        borderRadius: "2px",
        outline: "2px solid orange"
    }
});
