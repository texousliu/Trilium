// ck-find-result and ck-find-result_selected are the styles ck-editor
// uses for highlighting matches, use the same one on CodeMirror
// for consistency
import utils from "../services/utils.js";
import type FindWidget from "./find.js";
import type { FindResult } from "./find.js";

const FIND_RESULT_SELECTED_CSS_CLASSNAME = "ck-find-result_selected";
const FIND_RESULT_CSS_CLASSNAME = "ck-find-result";

export default class FindInHtml {

    private parent: FindWidget;
    private currentIndex: number;
    private $results: JQuery<HTMLElement> | null;

    constructor(parent: FindWidget) {
        this.parent = parent;
        this.currentIndex = 0;
        this.$results = null;
    }

    async performFind(searchTerm: string, matchCase: boolean, wholeWord: boolean) {
        await import("mark.js");

        const $content = await this.parent?.noteContext?.getContentElement();

        const wholeWordChar = wholeWord ? "\\b" : "";
        const regExp = new RegExp(wholeWordChar + utils.escapeRegExp(searchTerm) + wholeWordChar, matchCase ? "g" : "gi");

        return new Promise<FindResult>((res) => {
            $content?.unmark({
                done: () => {
                    $content.markRegExp(regExp, {
                        element: "span",
                        className: FIND_RESULT_CSS_CLASSNAME,
                        separateWordSearch: false,
                        caseSensitive: matchCase,
                        done: async () => {
                            this.$results = $content.find(`.${FIND_RESULT_CSS_CLASSNAME}`);
                            const scrollingContainer = $content[0].closest('.scrolling-container');
                            const containerTop = scrollingContainer?.getBoundingClientRect().top ?? 0;
                            const closestIndex = this.$results.toArray().findIndex(el => el.getBoundingClientRect().top >= containerTop);
                            this.currentIndex = closestIndex >= 0 ? closestIndex : 0;

                            await this.jumpTo();

                            res({
                                totalFound: this.$results.length,
                                currentFound: this.$results.length > 0 ? this.currentIndex + 1 : 0
                            });
                        }
                    });
                }
            });
        });
    }

    async findNext(direction: -1 | 1, currentFound: number, nextFound: number) {
        if (this.$results?.length) {
            this.currentIndex += direction;

            if (this.currentIndex < 0) {
                this.currentIndex = this.$results.length - 1;
            }

            if (this.currentIndex > this.$results.length - 1) {
                this.currentIndex = 0;
            }

            await this.jumpTo();
        }
    }

    async findBoxClosed(totalFound: number, currentFound: number) {
        const $content = await this.parent?.noteContext?.getContentElement();
        if (typeof $content?.unmark === 'function') {
            $content.unmark();
        }
    }

    async jumpTo() {
        if (this.$results?.length) {
            const $current = this.$results.eq(this.currentIndex);
            this.$results.removeClass(FIND_RESULT_SELECTED_CSS_CLASSNAME);
            $current[0].scrollIntoView();
            $current.addClass(FIND_RESULT_SELECTED_CSS_CLASSNAME);
        }
    }
}
