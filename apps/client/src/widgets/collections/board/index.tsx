import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ViewModeProps } from "../interface";
import "./index.css";
import { ColumnMap, getBoardData } from "./data";
import { useNoteLabelWithDefault, useTriliumEvent } from "../../react/hooks";
import FNote from "../../../entities/fnote";
import FBranch from "../../../entities/fbranch";
import Icon from "../../react/Icon";
import { t } from "../../../services/i18n";
import Api from "./api";
import FormTextBox from "../../react/FormTextBox";
import branchService from "../../../services/branches";
import { openColumnContextMenu, openNoteContextMenu } from "./context_menu";
import { ContextMenuEvent } from "../../../menus/context_menu";
import { createContext } from "preact";
import { onWheelHorizontalScroll } from "../../widget_utils";

export interface BoardViewData {
    columns?: BoardColumnData[];
}

export interface BoardColumnData {
    value: string;
}

interface BoardViewContextData {
    branchIdToEdit?: string;
}

const BoardViewContext = createContext<BoardViewContextData>({});

export default function BoardView({ note: parentNote, noteIds, viewConfig, saveConfig }: ViewModeProps<BoardViewData>) {
    const [ statusAttribute ] = useNoteLabelWithDefault(parentNote, "board:groupBy", "status");
    const [ byColumn, setByColumn ] = useState<ColumnMap>();
    const [ columns, setColumns ] = useState<string[]>();
    const [ draggedCard, setDraggedCard ] = useState<{ noteId: string, branchId: string, fromColumn: string, index: number } | null>(null);
    const [ dropTarget, setDropTarget ] = useState<string | null>(null);
    const [ dropPosition, setDropPosition ] = useState<{ column: string, index: number } | null>(null);
    const [ draggedColumn, setDraggedColumn ] = useState<{ column: string, index: number } | null>(null);
    const [ columnDropPosition, setColumnDropPosition ] = useState<number | null>(null);
    const [ branchIdToEdit, setBranchIdToEdit ] = useState<string>();
    const api = useMemo(() => {
        return new Api(byColumn, columns ?? [], parentNote, statusAttribute, viewConfig ?? {}, saveConfig, setBranchIdToEdit );
    }, [ byColumn, columns, parentNote, statusAttribute, viewConfig, saveConfig, setBranchIdToEdit ]);
    const boardViewContext = useMemo<BoardViewContextData>(() => ({
        branchIdToEdit
    }), [ branchIdToEdit ]);

    function refresh() {
        getBoardData(parentNote, statusAttribute, viewConfig ?? {}).then(({ byColumn, newPersistedData }) => {
            setByColumn(byColumn);

            if (newPersistedData) {
                viewConfig = { ...newPersistedData };
                saveConfig(newPersistedData);
            }

            // Use the order from persistedData.columns, then add any new columns found
            const orderedColumns = viewConfig?.columns?.map(col => col.value) || [];
            const allColumns = Array.from(byColumn.keys());
            const newColumns = allColumns.filter(col => !orderedColumns.includes(col));
            setColumns([...orderedColumns, ...newColumns]);
        });
    }

    useEffect(refresh, [ parentNote, noteIds, viewConfig ]);

    const handleColumnDrop = useCallback((fromIndex: number, toIndex: number) => {
        if (!columns || fromIndex === toIndex) return;

        const newColumns = [...columns];
        const [movedColumn] = newColumns.splice(fromIndex, 1);
        newColumns.splice(toIndex, 0, movedColumn);

        // Update view config with new column order
        const newViewConfig = {
            ...viewConfig,
            columns: newColumns.map(col => ({ value: col }))
        };

        saveConfig(newViewConfig);
        setColumns(newColumns);
        setDraggedColumn(null);
        setColumnDropPosition(null);
    }, [columns, viewConfig, saveConfig]);

    useTriliumEvent("entitiesReloaded", ({ loadResults }) => {
        // Check if any changes affect our board
        const hasRelevantChanges =
            // React to changes in status attribute for notes in this board
            loadResults.getAttributeRows().some(attr => attr.name === statusAttribute && noteIds.includes(attr.noteId!)) ||
            // React to changes in note title
            loadResults.getNoteIds().some(noteId => noteIds.includes(noteId)) ||
            // React to changes in branches for subchildren (e.g., moved, added, or removed notes)
            loadResults.getBranchRows().some(branch => noteIds.includes(branch.noteId!)) ||
            // React to changes in note icon or color.
            loadResults.getAttributeRows().some(attr => [ "iconClass", "color" ].includes(attr.name ?? "") && noteIds.includes(attr.noteId ?? "")) ||
            // React to attachment change
            loadResults.getAttachmentRows().some(att => att.ownerId === parentNote.noteId && att.title === "board.json") ||
            // React to changes in "groupBy"
            loadResults.getAttributeRows().some(attr => attr.name === "board:groupBy" && attr.noteId === parentNote.noteId);

        if (hasRelevantChanges) {
            refresh();
        }
    });

    const handleColumnDragOver = useCallback((e: DragEvent) => {
        if (!draggedColumn) return;
        e.preventDefault();

        const container = e.currentTarget as HTMLElement;
        const columns = Array.from(container.querySelectorAll('.board-column'));
        const mouseX = e.clientX;

        let newIndex = columns.length;
        for (let i = 0; i < columns.length; i++) {
            const col = columns[i] as HTMLElement;
            const rect = col.getBoundingClientRect();
            const colMiddle = rect.left + rect.width / 2;

            if (mouseX < colMiddle) {
                newIndex = i;
                break;
            }
        }

        setColumnDropPosition(newIndex);
    }, [draggedColumn]);

    const handleContainerDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        if (draggedColumn && columnDropPosition !== null) {
            handleColumnDrop(draggedColumn.index, columnDropPosition);
        }
    }, [draggedColumn, columnDropPosition, handleColumnDrop]);

    return (
        <div
            className="board-view"
            onWheel={onWheelHorizontalScroll}
        >
            <BoardViewContext.Provider value={boardViewContext}>
                <div
                    className="board-view-container"
                    onDragOver={handleColumnDragOver}
                    onDrop={handleContainerDrop}
                >
                    {byColumn && columns?.map((column, index) => (
                        <>
                            {columnDropPosition === index && draggedColumn?.column !== column && (
                                <div className="column-drop-placeholder show" />
                            )}
                            <Column
                                api={api}
                                column={column}
                                columnIndex={index}
                                columnItems={byColumn.get(column)}
                                statusAttribute={statusAttribute ?? "status"}
                                draggedCard={draggedCard}
                                setDraggedCard={setDraggedCard}
                                dropTarget={dropTarget}
                                setDropTarget={setDropTarget}
                                dropPosition={dropPosition}
                                setDropPosition={setDropPosition}
                                onCardDrop={refresh}
                                draggedColumn={draggedColumn}
                                setDraggedColumn={setDraggedColumn}
                                isDraggingColumn={draggedColumn?.column === column}
                            />
                        </>
                    ))}
                    {columnDropPosition === columns?.length && draggedColumn && (
                        <div className="column-drop-placeholder show" />
                    )}

                    <AddNewColumn viewConfig={viewConfig} saveConfig={saveConfig} />
                </div>
            </BoardViewContext.Provider>
        </div>
    )
}

function Column({
    column,
    columnIndex,
    columnItems,
    statusAttribute,
    draggedCard,
    setDraggedCard,
    dropTarget,
    setDropTarget,
    dropPosition,
    setDropPosition,
    onCardDrop,
    draggedColumn,
    setDraggedColumn,
    isDraggingColumn,
    api
}: {
    column: string,
    columnIndex: number,
    columnItems?: { note: FNote, branch: FBranch }[],
    statusAttribute: string,
    draggedCard: { noteId: string, branchId: string, fromColumn: string, index: number } | null,
    setDraggedCard: (card: { noteId: string, branchId: string, fromColumn: string, index: number } | null) => void,
    dropTarget: string | null,
    setDropTarget: (target: string | null) => void,
    dropPosition: { column: string, index: number } | null,
    setDropPosition: (position: { column: string, index: number } | null) => void,
    onCardDrop: () => void,
    draggedColumn: { column: string, index: number } | null,
    setDraggedColumn: (column: { column: string, index: number } | null) => void,
    isDraggingColumn: boolean,
    api: Api
}) {
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
                    await branchService.moveBeforeBranch([ draggedCard.branchId ], targetBranch.branchId);
                }
            } else if (draggedCard.index !== targetIndex) {
                // Reordering within the same column
                let targetBranchId: string | null = null;

                if (targetIndex < targetItems.length) {
                    // Moving before an existing item
                    const adjustedIndex = draggedCard.index < targetIndex ? targetIndex : targetIndex;
                    if (adjustedIndex < targetItems.length) {
                        targetBranchId = targetItems[adjustedIndex].branch.branchId;
                        await branchService.moveBeforeBranch([ draggedCard.branchId ], targetBranchId);
                    }
                } else if (targetIndex > 0) {
                    // Moving to the end - place after the last item
                    const lastItem = targetItems[targetItems.length - 1];
                    await branchService.moveAfterBranch([ draggedCard.branchId ], lastItem.branch.branchId);
                }
            }

            onCardDrop();
        }
        setDraggedCard(null);
    }, [draggedCard, draggedColumn, dropPosition, columnItems, column, statusAttribute, setDraggedCard, setDropTarget, setDropPosition, onCardDrop]);

    const handleContextMenu = useCallback((e: ContextMenuEvent) => {
        openColumnContextMenu(api, e, column);
    }, [ api, column ]);

    return (
        <div
            className={`board-column ${dropTarget === column && draggedCard?.fromColumn !== column ? 'drag-over' : ''} ${isDraggingColumn ? 'column-dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onContextMenu={handleContextMenu}
        >
            <h3
                draggable="true"
                onDragStart={handleColumnDragStart}
                onDragEnd={handleColumnDragEnd}
            >
                <span>{column}</span>
                <span
                    className="edit-icon icon bx bx-edit-alt"
                    title="Click to edit column title" />
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

function Card({
    api,
    note,
    branch,
    column,
    index,
    setDraggedCard,
    isDragging
}: {
    api: Api,
    note: FNote,
    branch: FBranch,
    column: string,
    index: number,
    setDraggedCard: (card: { noteId: string, branchId: string, fromColumn: string, index: number } | null) => void,
    isDragging: boolean
}) {
    const { branchIdToEdit } = useContext(BoardViewContext);
    const isEditing = branch.branchId === branchIdToEdit;
    const colorClass = note.getColorClass() || '';
    const editorRef = useRef<HTMLInputElement>(null);

    const handleDragStart = useCallback((e: DragEvent) => {
        e.dataTransfer!.effectAllowed = 'move';
        e.dataTransfer!.setData('text/plain', note.noteId);
        setDraggedCard({ noteId: note.noteId, branchId: branch.branchId, fromColumn: column, index });
    }, [note.noteId, branch.branchId, column, index, setDraggedCard]);

    const handleDragEnd = useCallback(() => {
        setDraggedCard(null);
    }, [setDraggedCard]);

    const handleContextMenu = useCallback((e: ContextMenuEvent) => {
        openNoteContextMenu(api, e, note.noteId, branch.branchId, column);
    }, [ api, note, branch, column ]);

    useEffect(() => {
        editorRef.current?.focus();
    }, []);

    return (
        <div
            className={`board-note ${colorClass} ${isDragging ? 'dragging' : ''} ${isEditing ? "editing" : ""}`}
            draggable="true"
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onContextMenu={handleContextMenu}
        >
            <span class={`icon ${note.getIcon()}`} />
            {!isEditing ? (
                <>{note.title}</>
            ) : (
                <FormTextBox
                    inputRef={editorRef}
                    value={note.title}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            const newTitle = e.currentTarget.value;
                            if (newTitle !== note.title) {
                                api.renameCard(note.noteId, newTitle);
                            }
                            api.dismissEditingTitle();
                        }

                        if (e.key === "Escape") {
                            api.dismissEditingTitle();
                        }
                    }}
                    onBlur={(newTitle) => {
                        if (newTitle !== note.title) {
                            api.renameCard(note.noteId, newTitle);
                        }
                        api.dismissEditingTitle();
                    }}
                />
            )}
        </div>
    )
}

function AddNewColumn({ viewConfig, saveConfig }: { viewConfig?: BoardViewData, saveConfig: (data: BoardViewData) => void }) {
    const [ isCreatingNewColumn, setIsCreatingNewColumn ] = useState(false);
    const columnNameRef = useRef<HTMLInputElement>(null);

    const addColumnCallback = useCallback(() => {
        setIsCreatingNewColumn(true);
    }, []);

    const finishEdit = useCallback((save: boolean) => {
        const columnName = columnNameRef.current?.value;
        if (!columnName || !save) {
            setIsCreatingNewColumn(false);
            return;
        }

        // Add the new column to persisted data if it doesn't exist
        if (!viewConfig) {
            viewConfig = {};
        }

        if (!viewConfig.columns) {
            viewConfig.columns = [];
        }

        const existingColumn = viewConfig.columns.find(col => col.value === columnName);
        if (!existingColumn) {
            viewConfig.columns.push({ value: columnName });
            saveConfig(viewConfig);
        }

        setIsCreatingNewColumn(false);
    }, [ viewConfig, saveConfig ]);

    return (
        <div className={`board-add-column ${isCreatingNewColumn ? "editing" : ""}`} onClick={addColumnCallback}>
            {!isCreatingNewColumn
            ? <>
                <Icon icon="bx bx-plus" />{" "}
                {t("board_view.add-column")}
            </>
            : <>
                <FormTextBox
                    inputRef={columnNameRef}
                    type="text"
                    placeholder="Enter column name..."
                    onBlur={() => finishEdit(true)}
                    onKeyDown={(e: KeyboardEvent) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            finishEdit(true);
                        } else if (e.key === "Escape") {
                            e.preventDefault();
                            finishEdit(false);
                        }
                    }}
                />
            </>}
        </div>
    )
}
