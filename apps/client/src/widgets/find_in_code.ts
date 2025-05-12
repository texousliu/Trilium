// ck-find-result and ck-find-result_selected are the styles ck-editor
// uses for highlighting matches, use the same one on CodeMirror
// for consistency
import utils from "../services/utils.js";
import type FindWidget from "./find.js";

const FIND_RESULT_SELECTED_CSS_CLASSNAME = "ck-find-result_selected";
const FIND_RESULT_CSS_CLASSNAME = "ck-find-result";

// TODO: Deduplicate.
interface Match {
    className: string;
    clear(): void;
    find(): {
        from: number;
        to: number;
    };
}

export default class FindInCode {

    private parent: FindWidget;
    private findResult?: Match[] | null;

    constructor(parent: FindWidget) {
        this.parent = parent;
    }

    async getCodeEditor() {
        return this.parent.noteContext?.getCodeEditor();
    }

    async performFind(searchTerm: string, matchCase: boolean, wholeWord: boolean) {
        const codeEditor = await this.getCodeEditor();
        if (!codeEditor) {
            return { totalFound: 0, currentFound: 0 };
        }

        const { totalFound, currentFound } = await codeEditor.performFind(searchTerm, matchCase, wholeWord);
        return { totalFound, currentFound };
    }

    async findNext(direction: number, currentFound: number, nextFound: number) {
        const codeEditor = await this.getCodeEditor();
        if (!codeEditor) {
            return;
        }

        codeEditor.findNext(direction, currentFound, nextFound);
    }

    async findBoxClosed(totalFound: number, currentFound: number) {
        const codeEditor = await this.getCodeEditor();
        codeEditor?.cleanSearch();
        codeEditor?.focus();
    }
    async replace(replaceText: string) {
        // this.findResult may be undefined and null
        if (!this.findResult || this.findResult.length === 0) {
            return;
        }
        let currentFound = -1;
        this.findResult.forEach((marker, index) => {
            const pos = marker.find();
            if (pos) {
                if (marker.className === FIND_RESULT_SELECTED_CSS_CLASSNAME) {
                    currentFound = index;
                    return;
                }
            }
        });
        if (currentFound >= 0) {
            let marker = this.findResult[currentFound];
            let pos = marker.find();
            const codeEditor = await this.getCodeEditor();
            const doc = codeEditor?.doc;
            if (doc) {
                doc.replaceRange(replaceText, pos.from, pos.to);
            }
            marker.clear();

            let nextFound;
            if (currentFound === this.findResult.length - 1) {
                nextFound = 0;
            } else {
                nextFound = currentFound;
            }
            this.findResult.splice(currentFound, 1);
            if (this.findResult.length > 0) {
                this.findNext(0, nextFound, nextFound);
            }
        }
    }
    async replaceAll(replaceText: string) {
        if (!this.findResult || this.findResult.length === 0) {
            return;
        }
        const codeEditor = await this.getCodeEditor();
        const doc = codeEditor?.doc;
        codeEditor?.operation(() => {
            if (!this.findResult) {
                return;
            }

            for (let currentFound = 0; currentFound < this.findResult.length; currentFound++) {
                let marker = this.findResult[currentFound];
                let pos = marker.find();
                doc?.replaceRange(replaceText, pos.from, pos.to);
                marker.clear();
            }
        });
        this.findResult = [];
    }
}
