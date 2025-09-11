import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { ViewModeProps } from "../interface";
import "./index.css";
import { ColumnMap, getBoardData } from "./data";
import { useNoteLabel, useTriliumEvent } from "../../react/hooks";
import FNote from "../../../entities/fnote";
import FBranch from "../../../entities/fbranch";
import Icon from "../../react/Icon";
import { t } from "../../../services/i18n";
import { createNewItem, changeColumn } from "./api";
import FormTextBox from "../../react/FormTextBox";

export interface BoardViewData {
    columns?: BoardColumnData[];
}

export interface BoardColumnData {
    value: string;
}

export default function BoardView({ note: parentNote, noteIds, viewConfig, saveConfig }: ViewModeProps<BoardViewData>) {
    const [ statusAttribute ] = useNoteLabel(parentNote, "board:groupBy");
    const [ byColumn, setByColumn ] = useState<ColumnMap>();
    const [ columns, setColumns ] = useState<string[]>();
    const [ draggedCard, setDraggedCard ] = useState<{ noteId: string, fromColumn: string } | null>(null);
    const [ dropTarget, setDropTarget ] = useState<string | null>(null);

    function refresh() {
        getBoardData(parentNote, statusAttribute ?? "status", viewConfig ?? {}).then(({ byColumn, newPersistedData }) => {
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

    useEffect(refresh, [ parentNote, noteIds ]);

    useTriliumEvent("entitiesReloaded", ({ loadResults }) => {
        // TODO: Re-enable
        return;

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
            console.log("Trigger refresh");
            refresh();
        }
    });

    return (
        <div className="board-view">
            <div className="board-view-container">
                {byColumn && columns?.map(column => (
                    <Column
                        column={column}
                        columnItems={byColumn.get(column)}
                        parentNote={parentNote}
                        statusAttribute={statusAttribute ?? "status"}
                        draggedCard={draggedCard}
                        setDraggedCard={setDraggedCard}
                        dropTarget={dropTarget}
                        setDropTarget={setDropTarget}
                        onCardDrop={refresh}
                    />
                ))}

                <AddNewColumn viewConfig={viewConfig} saveConfig={saveConfig} />
            </div>
        </div>
    )
}

function Column({
    parentNote,
    column,
    columnItems,
    statusAttribute,
    draggedCard,
    setDraggedCard,
    dropTarget,
    setDropTarget,
    onCardDrop
}: {
    parentNote: FNote,
    column: string,
    columnItems?: { note: FNote, branch: FBranch }[],
    statusAttribute: string,
    draggedCard: { noteId: string, fromColumn: string } | null,
    setDraggedCard: (card: { noteId: string, fromColumn: string } | null) => void,
    dropTarget: string | null,
    setDropTarget: (target: string | null) => void,
    onCardDrop: () => void
}) {
    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        setDropTarget(column);
    }, [column, setDropTarget]);

    const handleDragLeave = useCallback((e: DragEvent) => {
        const relatedTarget = e.relatedTarget as HTMLElement;
        const currentTarget = e.currentTarget as HTMLElement;

        if (!currentTarget.contains(relatedTarget)) {
            setDropTarget(null);
        }
    }, [setDropTarget]);

    const handleDrop = useCallback(async (e: DragEvent) => {
        e.preventDefault();
        setDropTarget(null);

        if (draggedCard && draggedCard.fromColumn !== column) {
            await changeColumn(draggedCard.noteId, column, statusAttribute);
            onCardDrop();
        }
        setDraggedCard(null);
    }, [draggedCard, column, statusAttribute, setDraggedCard, setDropTarget, onCardDrop]);
    return (
        <div
            className={`board-column ${dropTarget === column && draggedCard?.fromColumn !== column ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <h3>
                <span>{column}</span>
                <span
                    className="edit-icon icon bx bx-edit-alt"
                    title="Click to edit column title" />
            </h3>

            {(columnItems ?? []).map(({ note, branch }) => (
                <Card
                    note={note}
                    branch={branch}
                    column={column}
                    setDraggedCard={setDraggedCard}
                    isDragging={draggedCard?.noteId === note.noteId}
                />
            ))}

            <div className="board-new-item" onClick={() => createNewItem(parentNote, column)}>
                <Icon icon="bx bx-plus" />{" "}
                {t("board_view.new-item")}
            </div>
        </div>
    )
}

function Card({
    note,
    column,
    setDraggedCard,
    isDragging
}: {
    note: FNote,
    branch: FBranch,
    column: string,
    setDraggedCard: (card: { noteId: string, fromColumn: string } | null) => void,
    isDragging: boolean
}) {
    const colorClass = note.getColorClass() || '';

    const handleDragStart = useCallback((e: DragEvent) => {
        e.dataTransfer!.effectAllowed = 'move';
        e.dataTransfer!.setData('text/plain', note.noteId);
        setDraggedCard({ noteId: note.noteId, fromColumn: column });
    }, [note.noteId, column, setDraggedCard]);

    const handleDragEnd = useCallback(() => {
        setDraggedCard(null);
    }, [setDraggedCard]);

    return (
        <div
            className={`board-note ${colorClass} ${isDragging ? 'dragging' : ''}`}
            draggable="true"
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <span class={`icon ${note.getIcon()}`} />
            {note.title}
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
    }, []);

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
