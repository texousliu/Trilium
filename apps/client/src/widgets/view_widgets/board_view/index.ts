import { setupHorizontalScrollViaWheel } from "../../widget_utils";
import ViewMode, { ViewModeArgs } from "../view_mode";
import attributeService from "../../../services/attributes";
import branchService from "../../../services/branches";
import noteCreateService from "../../../services/note_create";
import appContext, { EventData } from "../../../components/app_context";
import { BoardData } from "./config";
import SpacedUpdate from "../../../services/spaced_update";
import { setupContextMenu } from "./context_menu";
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
            cursor: pointer;
            position: relative;
            transition: background-color 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .board-view-container .board-column h3:hover {
            background-color: var(--hover-item-background-color);
            border-radius: 4px;
            padding: 0.25em 0.5em;
            margin: -0.25em -0.5em 0.75em -0.5em;
        }

        .board-view-container .board-column h3.editing {
            background-color: var(--main-background-color);
            border: 1px solid var(--main-text-color);
            border-radius: 4px;
            padding: 0.25em 0.5em;
            margin: -0.25em -0.5em 0.75em -0.5em;
        }

        .board-view-container .board-column h3 input {
            background: transparent;
            border: none;
            outline: none;
            font-size: inherit;
            font-weight: inherit;
            color: inherit;
            width: 100%;
            font-family: inherit;
        }

        .board-view-container .board-column h3 .edit-icon {
            opacity: 0;
            font-size: 0.8em;
            margin-left: 0.5em;
            transition: opacity 0.2s ease;
            color: var(--muted-text-color);
        }

        .board-view-container .board-column h3:hover .edit-icon {
            opacity: 1;
        }

        .board-view-container .board-column h3.editing .edit-icon {
            display: none;
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

        .board-add-column {
            width: 180px;
            flex-shrink: 0;
            height: 60px;
            border: 2px dashed var(--main-border-color);
            border-radius: 8px;
            padding: 0.5em;
            background-color: transparent;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: var(--muted-text-color);
            font-size: 0.9em;
            align-self: flex-start;
        }

        .board-add-column:hover {
            border-color: var(--main-text-color);
            color: var(--main-text-color);
            background-color: var(--hover-item-background-color);
        }

        .board-add-column.editing {
            border-style: solid;
            border-color: var(--main-text-color);
            background-color: var(--main-background-color);
        }

        .board-add-column .icon {
            margin-right: 0.5em;
            font-size: 1.2em;
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
        this.api = await BoardApi.build(this.parentNote, this.viewStorage);
        setupContextMenu({
            $container: this.$container,
            api: this.api
        });

        for (const column of this.api.columns) {
            const columnItems = this.api.getColumn(column);
            if (!columnItems) {
                continue;
            }

            // Find the column data to get custom title
            const columnTitle = column;

            const $columnEl = $("<div>")
                .addClass("board-column")
                .attr("data-column", column);

            const $titleEl = $("<h3>")
                .attr("data-column-value", column);

            const { $titleText, $editIcon } = this.createTitleStructure(columnTitle);
            $titleEl.append($titleText, $editIcon);

            // Make column title editable
            this.setupColumnTitleEdit($titleEl, column, columnItems);

            $columnEl.append($titleEl);

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

        // Add "Add Column" button at the end
        const $addColumnEl = $("<div>")
            .addClass("board-add-column")
            .html('<span class="icon bx bx-plus"></span>Add Column');

        $addColumnEl.on("click", (e) => {
            e.stopPropagation();
            this.startCreatingNewColumn($addColumnEl);
        });

        $(el).append($addColumnEl);
    }

    private setupNoteDrag($noteEl: JQuery<HTMLElement>, note: any, branch: any) {
        $noteEl.attr("draggable", "true");

        // Mouse drag events
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

        // Touch drag events
        let isDragging = false;
        let startY = 0;
        let startX = 0;
        let dragThreshold = 10; // Minimum distance to start dragging

        $noteEl.on("touchstart", (e) => {
            const touch = (e.originalEvent as TouchEvent).touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            isDragging = false;
        });

        $noteEl.on("touchmove", (e) => {
            e.preventDefault(); // Prevent scrolling
            const touch = (e.originalEvent as TouchEvent).touches[0];
            const deltaX = Math.abs(touch.clientX - startX);
            const deltaY = Math.abs(touch.clientY - startY);

            // Start dragging if we've moved beyond threshold
            if (!isDragging && (deltaX > dragThreshold || deltaY > dragThreshold)) {
                isDragging = true;
                this.draggedNote = note;
                this.draggedBranch = branch;
                this.draggedNoteElement = $noteEl;
                $noteEl.addClass("dragging");
            }

            if (isDragging) {
                // Find element under touch point
                const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                if (elementBelow) {
                    const $columnEl = $(elementBelow).closest('.board-column');

                    if ($columnEl.length > 0) {
                        // Remove drag-over from all columns
                        this.$container.find('.board-column').removeClass('drag-over');
                        $columnEl.addClass('drag-over');

                        // Show drop indicator
                        this.showDropIndicatorAtPoint($columnEl, touch.clientY);
                    } else {
                        // Remove all drag indicators if not over a column
                        this.$container.find('.board-column').removeClass('drag-over');
                        this.$container.find(".board-drop-indicator").removeClass("show");
                    }
                }
            }
        });

        $noteEl.on("touchend", async (e) => {
            if (isDragging) {
                const touch = (e.originalEvent as TouchEvent).changedTouches[0];
                const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                if (elementBelow) {
                    const $columnEl = $(elementBelow).closest('.board-column');

                    if ($columnEl.length > 0) {
                        const column = $columnEl.attr('data-column');
                        if (column && this.draggedNote && this.draggedNoteElement && this.draggedBranch) {
                            await this.handleNoteDrop($columnEl, column);
                        }
                    }
                }

                // Clean up
                $noteEl.removeClass("dragging");
                this.draggedNote = null;
                this.draggedBranch = null;
                this.draggedNoteElement = null;
                this.$container.find('.board-column').removeClass('drag-over');
                this.$container.find(".board-drop-indicator").removeClass("show");
            }
            isDragging = false;
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

                    // Update the data attributes
                    draggedNoteElement.attr("data-current-column", column);

                    // Show success feedback
                    console.log(`Moved note "${draggedNote.title}" from "${currentColumn}" to "${column}"`);

                    // Refresh the board to reflect the changes
                    await this.renderList();
                } catch (error) {
                    console.error("Failed to update note position:", error);
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

    private showDropIndicatorAtPoint($columnEl: JQuery<HTMLElement>, touchY: number) {
        const columnRect = $columnEl[0].getBoundingClientRect();
        const relativeY = touchY - columnRect.top;

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

    private async handleNoteDrop($columnEl: JQuery<HTMLElement>, column: string) {
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

                // Update the data attributes
                draggedNoteElement.attr("data-current-column", column);

                // Show success feedback
                console.log(`Moved note "${draggedNote.title}" from "${currentColumn}" to "${column}"`);

                // Refresh the board to reflect the changes
                await this.renderList();
            } catch (error) {
                console.error("Failed to update note position:", error);
            }
        }
    }

    private createTitleStructure(title: string): { $titleText: JQuery<HTMLElement>; $editIcon: JQuery<HTMLElement> } {
        const $titleText = $("<span>").text(title);
        const $editIcon = $("<span>")
            .addClass("edit-icon icon bx bx-edit-alt")
            .attr("title", "Click to edit column title");

        return { $titleText, $editIcon };
    }

    private setupColumnTitleEdit($titleEl: JQuery<HTMLElement>, columnValue: string, columnItems: { branch: any; note: any; }[]) {
        $titleEl.on("click", (e) => {
            e.stopPropagation();
            this.startEditingColumnTitle($titleEl, columnValue, columnItems);
        });
    }

    private startEditingColumnTitle($titleEl: JQuery<HTMLElement>, columnValue: string, columnItems: { branch: any; note: any; }[]) {
        if ($titleEl.hasClass("editing")) {
            return; // Already editing
        }

        const $titleText = $titleEl.find("span").first();
        const currentTitle = $titleText.text();
        $titleEl.addClass("editing");

        const $input = $("<input>")
            .attr("type", "text")
            .val(currentTitle)
            .attr("placeholder", "Column title");

        $titleEl.empty().append($input);
        $input.focus().select();

        const finishEdit = async (save: boolean = true) => {
            if (!$titleEl.hasClass("editing")) {
                return; // Already finished
            }

            $titleEl.removeClass("editing");

            let finalTitle = currentTitle;
            if (save) {
                const newTitle = $input.val() as string;
                if (newTitle.trim() && newTitle !== currentTitle) {
                    await this.renameColumn(columnValue, newTitle.trim(), columnItems);
                    finalTitle = newTitle.trim();
                }
            }

            // Recreate the title structure
            const { $titleText, $editIcon } = this.createTitleStructure(finalTitle);
            $titleEl.empty().append($titleText, $editIcon);
        };

        $input.on("blur", () => finishEdit(true));
        $input.on("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                finishEdit(true);
            } else if (e.key === "Escape") {
                e.preventDefault();
                finishEdit(false);
            }
        });
    }

    private async renameColumn(oldValue: string, newValue: string, columnItems: { branch: any; note: any; }[]) {
        try {
            // Get all note IDs in this column
            const noteIds = columnItems.map(item => item.note.noteId);

            // Use the API to rename the column (update all notes)
            await this.api?.renameColumn(oldValue, newValue, noteIds);

            // Refresh the board to reflect the changes
            await this.renderList();
        } catch (error) {
            console.error("Failed to rename column:", error);
        }
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

    private startCreatingNewColumn($addColumnEl: JQuery<HTMLElement>) {
        if ($addColumnEl.hasClass("editing")) {
            return; // Already editing
        }

        $addColumnEl.addClass("editing");

        const $input = $("<input>")
            .attr("type", "text")
            .attr("placeholder", "Enter column name...")
            .css({
                background: "var(--main-background-color)",
                border: "1px solid var(--main-text-color)",
                borderRadius: "4px",
                padding: "0.5em",
                color: "var(--main-text-color)",
                fontFamily: "inherit",
                fontSize: "inherit",
                width: "100%",
                textAlign: "center"
            });

        $addColumnEl.empty().append($input);
        $input.focus();

        const finishEdit = async (save: boolean = true) => {
            if (!$addColumnEl.hasClass("editing")) {
                return; // Already finished
            }

            $addColumnEl.removeClass("editing");

            if (save) {
                const columnName = $input.val() as string;
                if (columnName.trim()) {
                    await this.createNewColumn(columnName.trim());
                }
            }

            // Restore the add button
            $addColumnEl.html('<span class="icon bx bx-plus"></span>Add Column');
        };

        $input.on("blur", () => finishEdit(true));
        $input.on("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                finishEdit(true);
            } else if (e.key === "Escape") {
                e.preventDefault();
                finishEdit(false);
            }
        });
    }

    private async createNewColumn(columnName: string) {
        try {
            // Check if column already exists
            if (this.api?.columns.includes(columnName)) {
                console.warn("A column with this name already exists.");
                return;
            }

            // Create the new column
            await this.api?.createColumn(columnName);

            // Refresh the board to show the new column
            await this.renderList();
        } catch (error) {
            console.error("Failed to create new column:", error);
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

        // React to attachment change.
        if (loadResults.getAttachmentRows().some(att => att.ownerId === this.parentNote.noteId && att.title === "board.json")) {
            return true;
        }

        return false;
    }

    private onSave() {
        this.viewStorage.store(this.persistentData);
    }

}
