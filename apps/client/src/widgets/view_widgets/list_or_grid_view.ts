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
    private showNotePath?: boolean;
    private highlightRegex?: RegExp | null;

    constructor(viewType: ViewTypeOptions, args: ViewModeArgs) {
        super(args, viewType);
        this.$noteList = $(TPL);
        this.$noteList.addClass(`${this.viewType}-view`);
    }

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

        this.renderPager();

        return this.$noteList;
    }

    renderPager() {



        // no need to distinguish "note" vs "notes" since in case of one result, there's no paging at all
        $pager.append(`<span class="note-list-pager-total-count">(${this.filteredNoteIds.length} notes)</span>`);
    }

    async renderNote(note: FNote, expand: boolean = false) {
        const { $renderedAttributes } = await attributeRenderer.renderNormalAttributes(note);

        const $card = $('<div class="note-book-card">')
            .append(
                $('<h5 class="note-book-header">')
                    .append(
                        this.viewType === "grid"
                            ? $('<span class="note-book-title">').text(await treeService.getNoteTitle(note.noteId, this.parentNote.noteId))
                    )
                    .append($renderedAttributes)
            );

        if (this.viewType === "grid") {
            $card
                .addClass("block-link")
                .attr("data-href", `#${notePath}`)
                .on("click", (e) => linkService.goToLink(e));
        }

        $expander.on("click", () => this.toggleContent($card, note, !$card.hasClass("expanded")));

        if (this.highlightRegex) {
            const Mark = new (await import("mark.js")).default($card.find(".note-book-title")[0]);
            Mark.markRegExp(this.highlightRegex, {
                element: "span",
                className: "ck-find-result"
            });
        }

        await this.toggleContent($card, note, expand);

        return $card;
    }

    async toggleContent($card: JQuery<HTMLElement>, note: FNote, expand: boolean) {
        if (this.viewType === "list" && ((expand && $card.hasClass("expanded")) || (!expand && !$card.hasClass("expanded")))) {
            return;
        }

        if ((this.viewType === "grid")) {
            $card.append(await this.renderNoteContent(note));
        }
    }

    async renderNoteContent(note: FNote) {
        try {
            const { $renderedContent, type } = await contentRenderer.getRenderedContent(note, {
                trim: this.viewType === "grid" // for grid only short content is needed
            });

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
