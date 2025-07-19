import { setupHorizontalScrollViaWheel } from "../../widget_utils";
import ViewMode, { ViewModeArgs } from "../view_mode";
import { getBoardData } from "./data";
import attributeService from "../../../services/attributes";
import { EventData } from "../../../components/app_context";

const TPL = /*html*/`
<div class="board-view">
    <style>
        .board-view {
            overflow-x: auto;
            position: relative;
            height: 100%;
            user-select: none;
        }

        .board-view-container {
            height: 100%;
            display: flex;
            gap: 1.5em;
            padding: 1em;
        }

        .board-view-container .board-column {
            width: 250px;
            flex-shrink: 0;
            min-height: 200px;
            border: 2px solid transparent;
            border-radius: 8px;
            padding: 0.5em;
            background-color: var(--accented-background-color);
            transition: border-color 0.2s ease;
            overflow-y: auto;
        }

        .board-view-container .board-column.drag-over {
            border-color: var(--main-text-color);
            background-color: var(--hover-item-background-color);
        }

        .board-view-container .board-column h3 {
            font-size: 1em;
            margin-bottom: 0.75em;
            padding-bottom: 0.5em;
            border-bottom: 1px solid var(--main-border-color);
        }

        .board-view-container .board-note {
            box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.25);
            margin: 0.65em 0;
            padding: 0.5em;
            border-radius: 5px;
            cursor: move;
            position: relative;
            background-color: var(--main-background-color);
            border: 1px solid var(--main-border-color);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .board-view-container .board-note:hover {
            transform: translateY(-2px);
            box-shadow: 2px 4px 8px rgba(0, 0, 0, 0.35);
        }

        .board-view-container .board-note.dragging {
            opacity: 0.8;
            transform: rotate(5deg);
            z-index: 1000;
            box-shadow: 4px 8px 16px rgba(0, 0, 0, 0.5);
        }

        .board-view-container .board-note .icon {
            margin-right: 0.25em;
        }

        .board-drop-indicator {
            height: 3px;
            background-color: var(--main-text-color);
            border-radius: 2px;
            margin: 0.25em 0;
            opacity: 0;
            transition: opacity 0.2s ease;
        }

        .board-drop-indicator.show {
            opacity: 1;
        }
    </style>

    <div class="board-view-container"></div>
</div>
`;

export interface StateInfo {

};

export default class BoardView extends ViewMode<StateInfo> {

    private $root: JQuery<HTMLElement>;
    private $container: JQuery<HTMLElement>;
    private draggedNote: any = null;
    private draggedNoteElement: JQuery<HTMLElement> | null = null;

    constructor(args: ViewModeArgs) {
        super(args, "board");

        this.$root = $(TPL);
        setupHorizontalScrollViaWheel(this.$root);
        this.$container = this.$root.find(".board-view-container");

        args.$parent.append(this.$root);
    }

    async renderList(): Promise<JQuery<HTMLElement> | undefined> {
        this.$container.empty();
        await this.renderBoard(this.$container[0]);

        return this.$root;
    }

    private async renderBoard(el: HTMLElement) {
        const data = await getBoardData(this.parentNote, "status");

        for (const column of data.byColumn.keys()) {
            const columnItems = data.byColumn.get(column);
            if (!columnItems) {
                continue;
            }

            const $columnEl = $("<div>")
                .addClass("board-column")
                .attr("data-column", column)
                .append($("<h3>").text(column));

            // Allow vertical scrolling in the column, bypassing the horizontal scroll of the container.
            $columnEl.on("wheel", (event) => {
                const el = $columnEl[0];
                const needsScroll = el.scrollHeight > el.clientHeight;
                if (needsScroll) {
                    event.stopPropagation();
                }
            });

            // Setup drop zone for the column
            this.setupColumnDropZone($columnEl, column);

            for (const item of columnItems) {
                const note = item.note;
                if (!note) {
                    continue;
                }

                const $iconEl = $("<span>")
                    .addClass("icon")
                    .addClass(note.getIcon());

                const $noteEl = $("<div>")
                    .addClass("board-note")
                    .attr("data-note-id", note.noteId)
                    .attr("data-current-column", column)
                    .text(note.title);

                $noteEl.prepend($iconEl);

                // Setup drag functionality for the note
                this.setupNoteDrag($noteEl, note);

                $columnEl.append($noteEl);
            }

            $(el).append($columnEl);
        }
    }

    private setupNoteDrag($noteEl: JQuery<HTMLElement>, note: any) {
        $noteEl.attr("draggable", "true");

        $noteEl.on("dragstart", (e) => {
            this.draggedNote = note;
            this.draggedNoteElement = $noteEl;
            $noteEl.addClass("dragging");

            // Set drag data
            const originalEvent = e.originalEvent as DragEvent;
            if (originalEvent.dataTransfer) {
                originalEvent.dataTransfer.effectAllowed = "move";
                originalEvent.dataTransfer.setData("text/plain", note.noteId);
            }
        });

        $noteEl.on("dragend", () => {
            $noteEl.removeClass("dragging");
            this.draggedNote = null;
            this.draggedNoteElement = null;

            // Remove all drop indicators
            this.$container.find(".board-drop-indicator").removeClass("show");
        });
    }

    private setupColumnDropZone($columnEl: JQuery<HTMLElement>, column: string) {
        $columnEl.on("dragover", (e) => {
            e.preventDefault();
            const originalEvent = e.originalEvent as DragEvent;
            if (originalEvent.dataTransfer) {
                originalEvent.dataTransfer.dropEffect = "move";
            }

            if (this.draggedNote) {
                $columnEl.addClass("drag-over");
                this.showDropIndicator($columnEl, e);
            }
        });

        $columnEl.on("dragleave", (e) => {
            // Only remove drag-over if we're leaving the column entirely
            const rect = $columnEl[0].getBoundingClientRect();
            const originalEvent = e.originalEvent as DragEvent;
            const x = originalEvent.clientX;
            const y = originalEvent.clientY;

            if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                $columnEl.removeClass("drag-over");
                $columnEl.find(".board-drop-indicator").removeClass("show");
            }
        });

        $columnEl.on("drop", async (e) => {
            e.preventDefault();
            $columnEl.removeClass("drag-over");
            $columnEl.find(".board-drop-indicator").removeClass("show");

            if (this.draggedNote && this.draggedNoteElement) {
                const currentColumn = this.draggedNoteElement.attr("data-current-column");

                if (currentColumn !== column) {
                    try {
                        // Update the note's status label
                        await attributeService.setLabel(this.draggedNote.noteId, "status", column);

                        // Move the note element to the new column
                        const dropIndicator = $columnEl.find(".board-drop-indicator.show");
                        if (dropIndicator.length > 0) {
                            dropIndicator.after(this.draggedNoteElement);
                        } else {
                            $columnEl.append(this.draggedNoteElement);
                        }

                        // Update the data attribute
                        this.draggedNoteElement.attr("data-current-column", column);

                        // Show success feedback (optional)
                        console.log(`Moved note "${this.draggedNote.title}" from "${currentColumn}" to "${column}"`);
                    } catch (error) {
                        console.error("Failed to update note status:", error);
                        // Optionally show user-facing error message
                    }
                }
            }
        });
    }

    private showDropIndicator($columnEl: JQuery<HTMLElement>, e: JQuery.DragOverEvent) {
        const originalEvent = e.originalEvent as DragEvent;
        const mouseY = originalEvent.clientY;
        const columnRect = $columnEl[0].getBoundingClientRect();
        const relativeY = mouseY - columnRect.top;

        // Find existing drop indicator or create one
        let $dropIndicator = $columnEl.find(".board-drop-indicator");
        if ($dropIndicator.length === 0) {
            $dropIndicator = $("<div>").addClass("board-drop-indicator");
            $columnEl.append($dropIndicator);
        }

        // Find the best position to insert the note
        const $notes = this.draggedNoteElement ?
            $columnEl.find(".board-note").not(this.draggedNoteElement) :
            $columnEl.find(".board-note");
        let insertAfterElement: HTMLElement | null = null;

        $notes.each((_, noteEl) => {
            const noteRect = noteEl.getBoundingClientRect();
            const noteMiddle = noteRect.top + noteRect.height / 2 - columnRect.top;

            if (relativeY > noteMiddle) {
                insertAfterElement = noteEl;
            }
        });

        // Position the drop indicator
        if (insertAfterElement) {
            $(insertAfterElement).after($dropIndicator);
        } else {
            // Insert at the beginning (after the header)
            const $header = $columnEl.find("h3");
            $header.after($dropIndicator);
        }

        $dropIndicator.addClass("show");
    }

    async onEntitiesReloaded({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.getAttributeRows().some(attr => attr.name === "status" && this.noteIds.includes(attr.noteId!))) {
            return true;
        }

        return false;
    }

}
