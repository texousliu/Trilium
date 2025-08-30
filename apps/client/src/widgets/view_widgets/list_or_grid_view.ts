import linkService from "../../services/link.js";
import contentRenderer from "../../services/content_renderer.js";
import froca from "../../services/froca.js";
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
        const $pager = this.$noteList.find(".note-list-pager").empty();
        if (!this.page || !this.pageSize) {
            return;
        }

        const pageCount = Math.ceil(this.filteredNoteIds.length / this.pageSize);

        $pager.toggle(pageCount > 1);

        let lastPrinted;

        for (let i = 1; i <= pageCount; i++) {
            if (pageCount < 20 || i <= 5 || pageCount - i <= 5 || Math.abs(this.page - i) <= 2) {
                lastPrinted = true;

                const startIndex = (i - 1) * this.pageSize + 1;
                const endIndex = Math.min(this.filteredNoteIds.length, i * this.pageSize);

                $pager.append(
                    i === this.page
                        ? $("<span>").text(i).css("text-decoration", "underline").css("font-weight", "bold")
                        : $('<a href="javascript:">')
                            .text(i)
                            .attr("title", `Page of ${startIndex} - ${endIndex}`)
                            .on("click", () => {
                                this.page = i;
                                this.renderList();
                            }),
                    " &nbsp; "
                );
            } else if (lastPrinted) {
                $pager.append("... &nbsp; ");

                lastPrinted = false;
            }
        }

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
                            : (await linkService.createLink(notePath, { showNotePath: this.showNotePath })).addClass("note-book-title")
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

        const $expander = $card.find("> .note-book-header .note-expander");

        if (expand || this.viewType === "grid") {
            $card.addClass("expanded");
            $expander.addClass("bx-chevron-down").removeClass("bx-chevron-right");
        } else {
            $card.removeClass("expanded");
            $expander.addClass("bx-chevron-right").removeClass("bx-chevron-down");
        }

        if ((expand || this.viewType === "grid") && $card.find(".note-book-content").length === 0) {
            $card.append(await this.renderNoteContent(note));
        }
    }

    async renderNoteContent(note: FNote) {
        const $content = $('<div class="note-book-content">');

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

            $content.append($renderedContent);
            $content.addClass(`type-${type}`);
        } catch (e) {
            console.warn(`Caught error while rendering note '${note.noteId}' of type '${note.type}'`);
            console.error(e);

            $content.append("rendering error");
        }

        if (this.viewType === "list") {
            const imageLinks = note.getRelations("imageLink");

            const childNotes = (await note.getChildNotes()).filter((childNote) => !imageLinks.find((rel) => rel.value === childNote.noteId));

            for (const childNote of childNotes) {
                $content.append(await this.renderNote(childNote));
            }
        }

        return $content;
    }
}

export default ListOrGridView;
