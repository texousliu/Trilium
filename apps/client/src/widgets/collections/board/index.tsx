import { Dispatch, StateUpdater, useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ViewModeProps } from "../interface";
import "./index.css";
import { ColumnMap, getBoardData } from "./data";
import { useNoteLabelWithDefault, useTriliumEvent } from "../../react/hooks";
import Icon from "../../react/Icon";
import { t } from "../../../services/i18n";
import Api from "./api";
import FormTextBox from "../../react/FormTextBox";
import { createContext } from "preact";
import { onWheelHorizontalScroll } from "../../widget_utils";
import Column from "./column";

export interface BoardViewData {
    columns?: BoardColumnData[];
}

export interface BoardColumnData {
    value: string;
}

interface BoardViewContextData {
    branchIdToEdit?: string;
    columnNameToEdit?: string;
    setColumnNameToEdit?: Dispatch<StateUpdater<string | undefined>>;
    setBranchIdToEdit?: Dispatch<StateUpdater<string | undefined>>;
}

export const BoardViewContext = createContext<BoardViewContextData>({});

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
    const [ columnNameToEdit, setColumnNameToEdit ] = useState<string>();
    const api = useMemo(() => {
        return new Api(byColumn, columns ?? [], parentNote, statusAttribute, viewConfig ?? {}, saveConfig, setBranchIdToEdit );
    }, [ byColumn, columns, parentNote, statusAttribute, viewConfig, saveConfig, setBranchIdToEdit ]);
    const boardViewContext = useMemo<BoardViewContextData>(() => ({
        branchIdToEdit,
        columnNameToEdit,
        setColumnNameToEdit,
        setBranchIdToEdit
    }), [ branchIdToEdit, columnNameToEdit, setColumnNameToEdit, setBranchIdToEdit ]);

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

export function TitleEditor({ currentValue, save, dismiss }: {
    currentValue: string,
    save: (newValue: string) => void,
    dismiss: () => void
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, [ inputRef ]);

    return (
        <FormTextBox
            inputRef={inputRef}
            currentValue={currentValue}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    const newValue = e.currentTarget.value;
                    if (newValue !== currentValue) {
                        save(newValue);
                    }
                    dismiss();
                }

                if (e.key === "Escape") {
                    dismiss();
                }
            }}
            onBlur={(newValue) => {
                if (newValue !== currentValue) {
                    save(newValue);
                }
                dismiss();
            }}
        />
    )
}
