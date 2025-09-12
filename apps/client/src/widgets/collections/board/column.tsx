import { useCallback, useContext, useEffect, useRef } from "preact/hooks";
import FBranch from "../../../entities/fbranch";
import FNote from "../../../entities/fnote";
import { BoardViewContext, TitleEditor } from ".";
import branches from "../../../services/branches";
import { openColumnContextMenu } from "./context_menu";
import { ContextMenuEvent } from "../../../menus/context_menu";
import Icon from "../../react/Icon";
import { t } from "../../../services/i18n";
import BoardApi from "./api";
import Card from "./card";

interface DragContext {
    api: BoardApi;
    column: string;
    draggedColumn: { column: string, index: number } | null;
    setDraggedColumn: (column: { column: string, index: number } | null) => void;
    columnIndex: number,
    setDropTarget: (target: string | null) => void,
    setDropPosition: (position: { column: string, index: number } | null) => void;
    onCardDrop: () => void;
    dropPosition: { column: string, index: number } | null;
    draggedCard: { noteId: string, branchId: string, fromColumn: string, index: number } | null;
    setDraggedCard: (card: { noteId: string, branchId: string, fromColumn: string, index: number } | null) => void;
    columnItems?: { note: FNote, branch: FBranch }[],
}

export default function Column({
    column,
    columnItems,
    draggedCard,
    setDraggedCard,
    dropTarget,
    dropPosition,
    isDraggingColumn,
    api,
    ...restProps
}: {
    column: string,
    dropTarget: string | null,
    isDraggingColumn: boolean,
    api: BoardApi
} & DragContext) {
    const context = useContext(BoardViewContext);
    const isEditing = (context.columnNameToEdit === column);
    const editorRef = useRef<HTMLInputElement>(null);
    const { handleColumnDragStart, handleColumnDragEnd, handleDragOver, handleDragLeave, handleDrop } = useDragging({
        api, column, dropPosition, draggedCard, setDraggedCard, columnItems, ...restProps
    });

    const handleEdit = useCallback(() => {
        context.setColumnNameToEdit?.(column);
    }, [column]);

    const handleContextMenu = useCallback((e: ContextMenuEvent) => {
        openColumnContextMenu(api, e, column);
    }, [ api, column ]);

    useEffect(() => {
        editorRef.current?.focus();
    }, [ isEditing ]);

    return (
        <div
            className={`board-column ${dropTarget === column && draggedCard?.fromColumn !== column ? 'drag-over' : ''} ${isDraggingColumn ? 'column-dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <h3
                className={`${isEditing ? "editing" : ""}`}
                draggable="true"
                onDragStart={handleColumnDragStart}
                onDragEnd={handleColumnDragEnd}
                onContextMenu={handleContextMenu}
            >
                {!isEditing ? (
                    <>
                        <span className="title">{column}</span>
                        <span
                            className="edit-icon icon bx bx-edit-alt"
                            title={t("board_view.edit-column-title")}
                            onClick={handleEdit}
                        />
                    </>
                ) : (
                    <TitleEditor
                        currentValue={column}
                        save={newTitle => api.renameColumn(column, newTitle)}
                        dismiss={() => context.setColumnNameToEdit?.(undefined)}
                    />
                )}
            </h3>

            {(columnItems ?? []).map(({ note, branch }, index) => {
                const showIndicatorBefore = dropPosition?.column === column &&
                                          dropPosition.index === index &&
                                          draggedCard?.noteId !== note.noteId;

                return (
                    <>
                        {showIndicatorBefore && (
                            <div className="board-drop-placeholder show" />
                        )}
                        <Card
                            key={note.noteId}
                            api={api}
                            note={note}
                            branch={branch}
                            column={column}
                            index={index}
                            setDraggedCard={setDraggedCard}
                            isDragging={draggedCard?.noteId === note.noteId}
                        />
                    </>
                );
            })}
            {dropPosition?.column === column && dropPosition.index === (columnItems?.length ?? 0) && (
                <div className="board-drop-placeholder show" />
            )}

            <div className="board-new-item" onClick={() => api.createNewItem(column)}>
                <Icon icon="bx bx-plus" />{" "}
                {t("board_view.new-item")}
            </div>
        </div>
    )
}

function useDragging({ api, column, columnIndex, draggedColumn, setDraggedColumn, setDropTarget, setDropPosition, onCardDrop, draggedCard, dropPosition, setDraggedCard, columnItems }: DragContext) {
    const handleColumnDragStart = useCallback((e: DragEvent) => {
        e.dataTransfer!.effectAllowed = 'move';
        e.dataTransfer!.setData('text/plain', column);
        setDraggedColumn({ column, index: columnIndex });
        e.stopPropagation(); // Prevent card drag from interfering
    }, [column, columnIndex, setDraggedColumn]);

    const handleColumnDragEnd = useCallback(() => {
        setDraggedColumn(null);
    }, [setDraggedColumn]);

    const handleDragOver = useCallback((e: DragEvent) => {
        if (draggedColumn) return; // Don't handle card drops when dragging columns
        e.preventDefault();
        setDropTarget(column);

        // Calculate drop position based on mouse position
        const cards = Array.from(e.currentTarget.querySelectorAll('.board-note'));
        const mouseY = e.clientY;

        let newIndex = cards.length;
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i] as HTMLElement;
            const rect = card.getBoundingClientRect();
            const cardMiddle = rect.top + rect.height / 2;

            if (mouseY < cardMiddle) {
                newIndex = i;
                break;
            }
        }

        setDropPosition({ column, index: newIndex });
    }, [column, setDropTarget, setDropPosition]);

    const handleDragLeave = useCallback((e: DragEvent) => {
        const relatedTarget = e.relatedTarget as HTMLElement;
        const currentTarget = e.currentTarget as HTMLElement;

        if (!currentTarget.contains(relatedTarget)) {
            setDropTarget(null);
            setDropPosition(null);
        }
    }, [setDropTarget, setDropPosition]);

    const handleDrop = useCallback(async (e: DragEvent) => {
        if (draggedColumn) return; // Don't handle card drops when dragging columns
        e.preventDefault();
        setDropTarget(null);
        setDropPosition(null);

        if (draggedCard && dropPosition) {
            const targetIndex = dropPosition.index;
            const targetItems = columnItems || [];

            if (draggedCard.fromColumn !== column) {
                // Moving to a different column
                await api.changeColumn(draggedCard.noteId, column);

                // If there are items in the target column, reorder
                if (targetItems.length > 0 && targetIndex < targetItems.length) {
                    const targetBranch = targetItems[targetIndex].branch;
                    await branches.moveBeforeBranch([ draggedCard.branchId ], targetBranch.branchId);
                }
            } else if (draggedCard.index !== targetIndex) {
                // Reordering within the same column
                let targetBranchId: string | null = null;

                if (targetIndex < targetItems.length) {
                    // Moving before an existing item
                    const adjustedIndex = draggedCard.index < targetIndex ? targetIndex : targetIndex;
                    if (adjustedIndex < targetItems.length) {
                        targetBranchId = targetItems[adjustedIndex].branch.branchId;
                        await branches.moveBeforeBranch([ draggedCard.branchId ], targetBranchId);
                    }
                } else if (targetIndex > 0) {
                    // Moving to the end - place after the last item
                    const lastItem = targetItems[targetItems.length - 1];
                    await branches.moveAfterBranch([ draggedCard.branchId ], lastItem.branch.branchId);
                }
            }

            onCardDrop();
        }
        setDraggedCard(null);
    }, [draggedCard, draggedColumn, dropPosition, columnItems, column, setDraggedCard, setDropTarget, setDropPosition, onCardDrop]);

    return { handleColumnDragStart, handleColumnDragEnd, handleDragOver, handleDragLeave, handleDrop };
}
