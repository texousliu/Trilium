import linkService from "../../services/link.js";
import contentRenderer from "../../services/content_renderer.js";
import attributeRenderer from "../../services/attribute_renderer.js";
import treeService from "../../services/tree.js";
import utils from "../../services/utils.js";
import type FNote from "../../entities/fnote.js";
import ViewMode, { type ViewModeArgs } from "./view_mode.js";
import { ViewTypeOptions } from "../collections/interface.js";

class ListOrGridView extends ViewMode<{}> {
    private $noteList: JQuery<HTMLElement>;

    private filteredNoteIds!: string[];
    private page?: number;
    private pageSize?: number;
    private highlightRegex?: RegExp | null;

    async renderList() {
        if (this.filteredNoteIds.length === 0 || !this.page || !this.pageSize) {
            this.$noteList.hide();
            return;
        }

        const highlightedTokens = this.parentNote.highlightedTokens || [];
        if (highlightedTokens.length > 0) {
            const regex = highlightedTokens.map((token) => utils.escapeRegExp(token)).join("|");

            this.highlightRegex = new RegExp(regex, "gi");
        } else {
            this.highlightRegex = null;
        }

        this.$noteList.show();

        return this.$noteList;
    }

    async renderNote(note: FNote, expand: boolean = false) {
        if (this.highlightRegex) {
            const Mark = new (await import("mark.js")).default($card.find(".note-book-title")[0]);
            Mark.markRegExp(this.highlightRegex, {
                element: "span",
                className: "ck-find-result"
            });
        }
    }

    async renderNoteContent(note: FNote) {
        try {
            if (this.highlightRegex) {
                const Mark = new (await import("mark.js")).default($renderedContent[0]);
                Mark.markRegExp(this.highlightRegex, {
                    element: "span",
                    className: "ck-find-result"
                });
            }
        }
    }
}

export default ListOrGridView;
