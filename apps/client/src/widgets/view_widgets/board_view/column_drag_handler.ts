import BoardApi from "./api";
import { DragContext, BaseDragHandler } from "./drag_types";

export class ColumnDragHandler implements BaseDragHandler {
    private $container: JQuery<HTMLElement>;
    private api: BoardApi;
    private context: DragContext;
    private onBoardRefresh: () => Promise<void>;

    constructor(
        $container: JQuery<HTMLElement>,
        api: BoardApi,
        context: DragContext,
        onBoardRefresh: () => Promise<void>
    ) {
        this.$container = $container;
        this.api = api;
        this.context = context;
        this.onBoardRefresh = onBoardRefresh;
    }

    setupColumnDrag($columnEl: JQuery<HTMLElement>, columnValue: string) {
        const $titleEl = $columnEl.find('h3[data-column-value]');
        
        $titleEl.attr("draggable", "true");

        $titleEl.on("dragstart", (e) => {
            // Only start dragging if the target is not an input (for inline editing)
            if ($(e.target).is('input') || $titleEl.hasClass('editing')) {
                e.preventDefault();
                return false;
            }

            this.context.draggedColumn = columnValue;
            this.context.draggedColumnElement = $columnEl;
            $columnEl.addClass("column-dragging");

            const originalEvent = e.originalEvent as DragEvent;
            if (originalEvent.dataTransfer) {
                originalEvent.dataTransfer.effectAllowed = "move";
                originalEvent.dataTransfer.setData("text/plain", columnValue);
            }

            // Prevent note dragging when column is being dragged
            e.stopPropagation();

            // Setup global drag tracking for better drop indicator positioning
            this.setupGlobalColumnDragTracking();
        });

        $titleEl.on("dragend", () => {
            $columnEl.removeClass("column-dragging");
            this.context.draggedColumn = null;
            this.context.draggedColumnElement = null;
            this.cleanupColumnDropIndicators();
            this.cleanupGlobalColumnDragTracking();
        });
    }

    setupColumnDropZone($columnEl: JQuery<HTMLElement>, _columnValue: string) {
        $columnEl.on("dragover", (e) => {
            // Only handle column drops when a column is being dragged
            if (this.context.draggedColumn && !this.context.draggedNote) {
                e.preventDefault();
                const originalEvent = e.originalEvent as DragEvent;
                if (originalEvent.dataTransfer) {
                    originalEvent.dataTransfer.dropEffect = "move";
                }

                // Don't highlight columns - we only care about the drop indicator position
            }
        });

        $columnEl.on("drop", async (e) => {
            if (this.context.draggedColumn && !this.context.draggedNote) {
                e.preventDefault();
                console.log("Column drop event triggered for column:", this.context.draggedColumn);

                // Use the drop indicator position to determine where to place the column
                await this.handleColumnDrop();
            }
        });
    }

    updateApi(newApi: BoardApi) {
        this.api = newApi;
    }

    cleanup() {
        this.cleanupColumnDropIndicators();
        this.context.draggedColumn = null;
        this.context.draggedColumnElement = null;
        this.cleanupGlobalColumnDragTracking();
    }

    private setupGlobalColumnDragTracking() {
        // Add container-level drag tracking for better indicator positioning
        this.$container.on("dragover.columnDrag", (e) => {
            if (this.context.draggedColumn) {
                e.preventDefault();
                const originalEvent = e.originalEvent as DragEvent;
                this.showColumnDropIndicator(originalEvent.clientX);
            }
        });

        // Add container-level drop handler for column reordering
        this.$container.on("drop.columnDrag", async (e) => {
            if (this.context.draggedColumn) {
                e.preventDefault();
                console.log("Container drop event triggered for column:", this.context.draggedColumn);
                await this.handleColumnDrop();
            }
        });
    }

    private cleanupGlobalColumnDragTracking() {
        this.$container.off("dragover.columnDrag");
        this.$container.off("drop.columnDrag");
    }

    private cleanupColumnDropIndicators() {
        // Remove column drop indicators
        this.$container.find(".column-drop-indicator").remove();
    }

    private showColumnDropIndicator(mouseX: number) {
        // Clean up existing indicators
        this.cleanupColumnDropIndicators();

        // Get all columns (excluding the dragged one if it exists)
        let $allColumns = this.$container.find('.board-column');
        if (this.context.draggedColumnElement) {
            $allColumns = $allColumns.not(this.context.draggedColumnElement);
        }
        
        let $targetColumn: JQuery<HTMLElement> = $();
        let insertBefore = false;

        // Find which column the mouse is closest to
        $allColumns.each((_, columnEl) => {
            const $column = $(columnEl);
            const rect = columnEl.getBoundingClientRect();
            const columnMiddle = rect.left + rect.width / 2;

            if (mouseX >= rect.left && mouseX <= rect.right) {
                // Mouse is over this column
                $targetColumn = $column;
                insertBefore = mouseX < columnMiddle;
                return false; // Break the loop
            }
        });

        // If no column found under mouse, find the closest one
        if ($targetColumn.length === 0) {
            let closestDistance = Infinity;
            $allColumns.each((_, columnEl) => {
                const $column = $(columnEl);
                const rect = columnEl.getBoundingClientRect();
                const columnCenter = rect.left + rect.width / 2;
                const distance = Math.abs(mouseX - columnCenter);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    $targetColumn = $column;
                    insertBefore = mouseX < columnCenter;
                }
            });
        }

        if ($targetColumn.length > 0) {
            const $dropIndicator = $("<div>").addClass("column-drop-indicator");
            
            if (insertBefore) {
                $targetColumn.before($dropIndicator);
            } else {
                $targetColumn.after($dropIndicator);
            }

            $dropIndicator.addClass("show");
        }
    }

    private async handleColumnDrop() {
        console.log("handleColumnDrop called for:", this.context.draggedColumn);
        
        if (!this.context.draggedColumn || !this.context.draggedColumnElement) {
            console.log("No dragged column or element found");
            return;
        }

        try {
            // Find the drop indicator to determine insert position
            const $dropIndicator = this.$container.find(".column-drop-indicator.show");
            console.log("Drop indicator found:", $dropIndicator.length > 0);
            
            if ($dropIndicator.length > 0) {
                // Get current column order from the API (source of truth)
                const currentOrder = [...this.api.columns];

                let newOrder = [...currentOrder];
                
                // Remove dragged column from current position
                newOrder = newOrder.filter(col => col !== this.context.draggedColumn);

                // Determine insertion position based on drop indicator position
                const $nextColumn = $dropIndicator.next('.board-column');
                const $prevColumn = $dropIndicator.prev('.board-column');
                
                let insertIndex = -1;
                
                if ($nextColumn.length > 0) {
                    // Insert before the next column
                    const nextColumnValue = $nextColumn.attr('data-column');
                    if (nextColumnValue) {
                        insertIndex = newOrder.indexOf(nextColumnValue);
                    }
                } else if ($prevColumn.length > 0) {
                    // Insert after the previous column
                    const prevColumnValue = $prevColumn.attr('data-column');
                    if (prevColumnValue) {
                        insertIndex = newOrder.indexOf(prevColumnValue) + 1;
                    }
                } else {
                    // Insert at the beginning
                    insertIndex = 0;
                }

                // Insert the dragged column at the determined position
                if (insertIndex >= 0 && insertIndex <= newOrder.length) {
                    newOrder.splice(insertIndex, 0, this.context.draggedColumn);
                } else {
                    // Fallback: insert at the end
                    newOrder.push(this.context.draggedColumn);
                }

                // Update column order in API
                await this.api.reorderColumns(newOrder);

                // Refresh the board to reflect the changes
                await this.onBoardRefresh();
            } else {
                console.warn("No drop indicator found for column drop");
            }
        } catch (error) {
            console.error("Failed to reorder columns:", error);
        } finally {
            this.cleanupColumnDropIndicators();
        }
    }
}
