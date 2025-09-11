import { useCallback, useContext, useEffect, useRef } from "preact/hooks";
import FBranch from "../../../entities/fbranch";
import FNote from "../../../entities/fnote";
import BoardApi from "./api";
import { BoardViewContext } from ".";
import { ContextMenuEvent } from "../../../menus/context_menu";
import { openNoteContextMenu } from "./context_menu";
import FormTextBox from "../../react/FormTextBox";

export default function Card({
    api,
    note,
    branch,
    column,
    index,
    setDraggedCard,
    isDragging
}: {
    api: BoardApi,
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
    }, [ isEditing ]);

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
                    currentValue={note.title}
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
