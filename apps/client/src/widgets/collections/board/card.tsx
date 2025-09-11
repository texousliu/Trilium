import { useCallback, useContext, useEffect, useRef, useState } from "preact/hooks";
import FBranch from "../../../entities/fbranch";
import FNote from "../../../entities/fnote";
import BoardApi from "./api";
import { BoardViewContext, TitleEditor } from ".";
import { ContextMenuEvent } from "../../../menus/context_menu";
import { openNoteContextMenu } from "./context_menu";
import { t } from "../../../services/i18n";

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
    const { branchIdToEdit, setBranchIdToEdit } = useContext(BoardViewContext);
    const isEditing = branch.branchId === branchIdToEdit;
    const colorClass = note.getColorClass() || '';
    const editorRef = useRef<HTMLInputElement>(null);
    const [ title, setTitle ] = useState(note.title);

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

    const handleEdit = useCallback((e) => {
        setBranchIdToEdit?.(branch.branchId);
    }, [ setBranchIdToEdit, branch ]);

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
                <>
                    <span className="title">{title}</span>
                    <span
                        className="edit-icon icon bx bx-edit-alt"
                        title={t("board_view.edit-note-title")}
                        onClick={handleEdit}
                    />
                </>
            ) : (
                <TitleEditor
                    currentValue={note.title}
                    save={newTitle => {
                        api.renameCard(note.noteId, newTitle);
                        setTitle(newTitle);
                    }}
                    dismiss={() => api.dismissEditingTitle()}
                />
            )}
        </div>
    )
}
