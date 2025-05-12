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
        const codeEditor = await this.getCodeEditor();
        codeEditor?.replace(replaceText);
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
