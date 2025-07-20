import { setupHorizontalScrollViaWheel } from "../../widget_utils";
import ViewMode, { ViewModeArgs } from "../view_mode";
import { getBoardData } from "./data";
import attributeService from "../../../services/attributes";
import branchService from "../../../services/branches";
import noteCreateService from "../../../services/note_create";
import appContext, { EventData } from "../../../components/app_context";
import { BoardData } from "./config";
import SpacedUpdate from "../../../services/spaced_update";
import { showNoteContextMenu } from "./context_menu";
import BoardApi from "./api";

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

        .board-new-item {
            margin-top: 0.5em;
            padding: 0.5em;
            border: 2px dashed var(--main-border-color);
            border-radius: 5px;
            text-align: center;
            color: var(--muted-text-color);
            cursor: pointer;
            transition: all 0.2s ease;
            background-color: transparent;
        }

        .board-new-item:hover {
            border-color: var(--main-text-color);
            color: var(--main-text-color);
            background-color: var(--hover-item-background-color);
        }

        .board-new-item .icon {
            margin-right: 0.25em;
        }
    </style>

    <div class="board-view-container"></div>
</div>
`;

export default class BoardView extends ViewMode<BoardData> {

    private $root: JQuery<HTMLElement>;
    private $container: JQuery<HTMLElement>;
    private spacedUpdate: SpacedUpdate;
    private draggedNote: any = null;
    private draggedBranch: any = null;
    private draggedNoteElement: JQuery<HTMLElement> | null = null;
    private persistentData: BoardData;
    private api?: BoardApi;

    constructor(args: ViewModeArgs) {
        super(args, "board");

        this.$root = $(TPL);
        setupHorizontalScrollViaWheel(this.$root);
        this.$container = this.$root.find(".board-view-container");
        this.spacedUpdate = new SpacedUpdate(() => this.onSave(), 5_000);
        this.persistentData = {
            columns: []
        };

        args.$parent.append(this.$root);
    }

    async renderList(): Promise<JQuery<HTMLElement> | undefined> {
        this.$container.empty();
        await this.renderBoard(this.$container[0]);

        return this.$root;
    }

    private async renderBoard(el: HTMLElement) {
        const persistedData = await this.viewStorage.restore() ?? this.persistentData;
        this.persistentData = persistedData;

        const data = await getBoardData(this.parentNote, "status", persistedData);
        const columns = Array.from(data.byColumn.keys()) || [];
        this.api = new BoardApi(columns);
        showNoteContextMenu({
            $container: this.$container,
            api: this.api
        });

        if (data.newPersistedData) {
            this.persistentData = data.newPersistedData;
            this.viewStorage.store(this.persistentData);
        }

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
                const branch = item.branch;
                if (!note) {
                    continue;
                }

                const $iconEl = $("<span>")
                    .addClass("icon")
                    .addClass(note.getIcon());

                const $noteEl = $("<div>")
                    .addClass("board-note")
                    .attr("data-note-id", note.noteId)
                    .attr("data-branch-id", branch.branchId)
                    .attr("data-current-column", column)
                    .text(note.title);

                $noteEl.prepend($iconEl);
                $noteEl.on("click", () => appContext.triggerCommand("openInPopup", { noteIdOrPath: note.noteId }));

                // Setup drag functionality for the note
                this.setupNoteDrag($noteEl, note, branch);

                $columnEl.append($noteEl);
            }

            // Add "New item" link at the bottom of the column
            const $newItemEl = $("<div>")
                .addClass("board-new-item")
                .attr("data-column", column)
                .html('<span class="icon bx bx-plus"></span>New item');

            $newItemEl.on("click", () => {
                this.createNewItem(column);
            });

            $columnEl.append($newItemEl);

            $(el).append($columnEl);
        }
    }

    private setupNoteDrag($noteEl: JQuery<HTMLElement>, note: any, branch: any) {
        $noteEl.attr("draggable", "true");

        $noteEl.on("dragstart", (e) => {
            this.draggedNote = note;
            this.draggedBranch = branch;
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
            this.draggedBranch = null;
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

            const draggedNoteElement = this.draggedNoteElement;
            const draggedNote = this.draggedNote;
            const draggedBranch = this.draggedBranch;
            if (draggedNote && draggedNoteElement && draggedBranch) {
                const currentColumn = draggedNoteElement.attr("data-current-column");

                // Capture drop indicator position BEFORE removing it
                const dropIndicator = $columnEl.find(".board-drop-indicator.show");
                let targetBranchId: string | null = null;
                let moveType: "before" | "after" | null = null;

                if (dropIndicator.length > 0) {
                    // Find the note element that the drop indicator is positioned relative to
                    const nextNote = dropIndicator.next(".board-note");
                    const prevNote = dropIndicator.prev(".board-note");

                    if (nextNote.length > 0) {
                        targetBranchId = nextNote.attr("data-branch-id") || null;
                        moveType = "before";
                    } else if (prevNote.length > 0) {
                        targetBranchId = prevNote.attr("data-branch-id") || null;
                        moveType = "after";
                    }
                }

                // Now remove the drop indicator
                $columnEl.find(".board-drop-indicator").removeClass("show");

                try {
                    // Handle column change
                    if (currentColumn !== column) {
                        await this.api?.changeColumn(draggedNote.noteId, column);
                    }

                    // Handle position change (works for both same column and different column moves)
                    if (targetBranchId && moveType) {
                        if (moveType === "before") {
                            console.log("Move before branch:", draggedBranch.branchId, "to", targetBranchId);
                            await branchService.moveBeforeBranch([draggedBranch.branchId], targetBranchId);
                        } else if (moveType === "after") {
                            console.log("Move after branch:", draggedBranch.branchId, "to", targetBranchId);
                            await branchService.moveAfterBranch([draggedBranch.branchId], targetBranchId);
                        }
                    }

                    // Update the UI
                    if (dropIndicator.length > 0) {
                        dropIndicator.after(draggedNoteElement);
                    } else {
                        $columnEl.append(draggedNoteElement);
                    }

                    // Update the data attributes
                    draggedNoteElement.attr("data-current-column", column);

                    // Show success feedback
                    console.log(`Moved note "${draggedNote.title}" from "${currentColumn}" to "${column}"`);
                } catch (error) {
                    console.error("Failed to update note position:", error);
                    // Optionally show user-facing error message
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

    private async createNewItem(column: string) {
        try {
            // Get the parent note path
            const parentNotePath = this.parentNote.noteId;

            // Create a new note as a child of the parent note
            const { note: newNote } = await noteCreateService.createNote(parentNotePath, {
                activate: false
            });

            if (newNote) {
                // Set the status label to place it in the correct column
                await attributeService.setLabel(newNote.noteId, "status", column);

                // Refresh the board to show the new item
                await this.renderList();

                // Optionally, open the new note for editing
                appContext.triggerCommand("openInPopup", { noteIdOrPath: newNote.noteId });
            }
        } catch (error) {
            console.error("Failed to create new item:", error);
        }
    }

    async onEntitiesReloaded({ loadResults }: EventData<"entitiesReloaded">) {
        // React to changes in "status" attribute for notes in this board
        if (loadResults.getAttributeRows().some(attr => attr.name === "status" && this.noteIds.includes(attr.noteId!))) {
            return true;
        }

        // React to changes in note title.
        if (loadResults.getNoteIds().some(noteId => this.noteIds.includes(noteId))) {
            return true;
        }

        // React to changes in branches for subchildren (e.g., moved, added, or removed notes)
        if (loadResults.getBranchRows().some(branch => this.noteIds.includes(branch.noteId!))) {
            return true;
        }

        return false;
    }

    private onSave() {
        this.viewStorage.store(this.persistentData);
    }

}
