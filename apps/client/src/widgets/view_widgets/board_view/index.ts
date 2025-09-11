import { setupHorizontalScrollViaWheel } from "../../widget_utils";
import ViewMode, { ViewModeArgs } from "../view_mode";
import noteCreateService from "../../../services/note_create";
import { EventData } from "../../../components/app_context";
import { BoardData } from "./config";
import SpacedUpdate from "../../../services/spaced_update";
import { setupContextMenu } from "./context_menu";
import BoardApi from "./api";
import { BoardDragHandler, DragContext } from "./drag_handler";
import { DifferentialBoardRenderer } from "./differential_renderer";

export default class BoardView extends ViewMode<BoardData> {

    private $root: JQuery<HTMLElement>;
    private $container: JQuery<HTMLElement>;
    private spacedUpdate: SpacedUpdate;
    private dragContext: DragContext;
    private persistentData: BoardData;
    private api?: BoardApi;
    private dragHandler?: BoardDragHandler;
    private renderer?: DifferentialBoardRenderer;

    constructor(args: ViewModeArgs) {
        super(args, "board");

        this.$root = $(TPL);
        this.$container = this.$root.find(".board-view-container");
        this.spacedUpdate = new SpacedUpdate(() => this.onSave(), 5_000);
        this.persistentData = {
            columns: []
        };
        this.dragContext = {
            draggedNote: null,
            draggedBranch: null,
            draggedNoteElement: null,
            draggedColumn: null,
            draggedColumnElement: null
        };

        args.$parent.append(this.$root);
    }

    async renderList(): Promise<JQuery<HTMLElement> | undefined> {
        if (!this.renderer) {
            // First time setup
            this.$container.empty();
            await this.initializeRenderer();
        }

        await this.renderer!.renderBoard();
        return this.$root;
    }

    private async initializeRenderer() {
        this.api = await BoardApi.build(this.parentNote, this.viewStorage);
        this.dragHandler = new BoardDragHandler(
            this.$container,
            this.api,
            this.dragContext
        );

        this.renderer = new DifferentialBoardRenderer(
            this.$container,
            this.api,
            this.dragHandler,
            this.parentNote,
            this.viewStorage,
            () => this.refreshApi()
        );

        setupContextMenu({
            $container: this.$container,
            api: this.api,
            boardView: this
        });

        // Setup column title editing and add column functionality
        this.setupBoardInteractions();
    }

    private async refreshApi(): Promise<void> {
        if (!this.api) {
            throw new Error("API not initialized");
        }

        await this.api.refresh(this.parentNote);
    }

    private setupBoardInteractions() {
        // Handle column title editing with click detection that works with dragging
        this.$container.on('mousedown', 'h3[data-column-value]', (e) => {
            const $titleEl = $(e.currentTarget);

            // Don't interfere with editing mode
            if ($titleEl.hasClass('editing') || $(e.target).is('input')) {
                return;
            }

            const startTime = Date.now();
            let hasMoved = false;
            const startX = e.clientX;
            const startY = e.clientY;

            const handleMouseMove = (moveEvent: JQuery.MouseMoveEvent) => {
                const deltaX = Math.abs(moveEvent.clientX - startX);
                const deltaY = Math.abs(moveEvent.clientY - startY);
                if (deltaX > 5 || deltaY > 5) {
                    hasMoved = true;
                }
            };

            const handleMouseUp = (upEvent: JQuery.MouseUpEvent) => {
                const duration = Date.now() - startTime;
                $(document).off('mousemove', handleMouseMove);
                $(document).off('mouseup', handleMouseUp);

                // If it was a quick click without much movement, treat as edit request
                if (duration < 500 && !hasMoved && upEvent.button === 0) {
                    const columnValue = $titleEl.attr('data-column-value');
                    if (columnValue) {
                        const columnItems = this.api?.getColumn(columnValue) || [];
                        this.startEditingColumnTitle($titleEl, columnValue, columnItems);
                    }
                }
            };

            $(document).on('mousemove', handleMouseMove);
            $(document).on('mouseup', handleMouseUp);
        });

        // Handle add column button
        this.$container.on('click', '.board-add-column', (e) => {
            e.stopPropagation();
            this.startCreatingNewColumn($(e.currentTarget));
        });
    }

    private startEditingColumnTitle($titleEl: JQuery<HTMLElement>, columnValue: string, columnItems: { branch: any; note: any; }[]) {
        if ($titleEl.hasClass("editing")) {
            return; // Already editing
        }

        const $titleSpan = $titleEl.find("span").first(); // Get the text span
        const currentTitle = $titleSpan.text();
        $titleEl.addClass("editing");

        // Disable dragging while editing
        $titleEl.attr("draggable", "false");

        const $input = $("<input>")
            .attr("type", "text")
            .val(currentTitle)
            .attr("placeholder", "Column title");

        // Prevent events from bubbling to parent drag handlers
        $input.on('mousedown mouseup click', (e) => {
            e.stopPropagation();
        });

        $titleEl.empty().append($input);
        $input.focus().select();

        const finishEdit = async (save: boolean = true) => {
            if (!$titleEl.hasClass("editing")) {
                return; // Already finished
            }

            $titleEl.removeClass("editing");

            // Re-enable dragging after editing
            $titleEl.attr("draggable", "true");

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
            // This will trigger onEntitiesReloaded which will automatically refresh the board
            await this.api?.renameColumn(oldValue, newValue, noteIds);
        } catch (error) {
            console.error("Failed to rename column:", error);
        }
    }

    forceFullRefresh() {
        this.renderer?.forceFullRender();
        return this.renderList();
    }

    private startCreatingNewColumn($addColumnEl: JQuery<HTMLElement>) {
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
        };
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


}
