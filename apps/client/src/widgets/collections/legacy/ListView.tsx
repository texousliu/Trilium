import { useEffect, useMemo, useState } from "preact/hooks";
import FNote from "../../../entities/fnote";
import Icon from "../../react/Icon";
import { ViewModeProps } from "../interface";
import { useNoteLabel, useNoteLabelBoolean } from "../../react/hooks";
import froca from "../../../services/froca";
import NoteLink from "../../react/NoteLink";

export default function ListView({ note, noteIds }: ViewModeProps) {
    const [ isExpanded ] = useNoteLabelBoolean(note, "expanded");
    const filteredNoteIds = useMemo(() => {
        // Filters the note IDs for the legacy view to filter out subnotes that are already included in the note content such as images, included notes.
        const includedLinks = note ? note.getRelations().filter((rel) => rel.name === "imageLink" || rel.name === "includeNoteLink") : [];
        const includedNoteIds = new Set(includedLinks.map((rel) => rel.value));   
        return noteIds.filter((noteId) => !includedNoteIds.has(noteId) && noteId !== "_hidden");
    }, noteIds);
    const { pageNotes } = usePagination(note, filteredNoteIds);

    return (
        <div class="note-list">
            <div class="note-list-wrapper">
                <div class="note-list-pager"></div>
        
                <div class="note-list-container use-tn-links">
                    {pageNotes?.map(note => (
                        <NoteCard note={note} expand={isExpanded} />
                    ))}
                </div>
        
                <div class="note-list-pager"></div>
            </div>
        </div>
    );
}

function NoteCard({ note, expand }: { note: FNote, expand?: boolean }) {
    const isSearch = note.type === "search";
    const notePath = isSearch
        ? note.noteId // for search note parent, we want to display a non-search path
        : `${note.noteId}/${note.noteId}`;

    return (
        <div
            className="note-book-card no-tooltip-preview"
            data-note-id={note.noteId}
        >
            <h5 className="note-book-header">
                <Icon className="note-icon" icon={note.getIcon()} />
                <NoteLink notePath={notePath} noPreview showNotePath={isSearch} />
            </h5>
        </div>
    )
}

function usePagination(note: FNote, noteIds: string[]) {
    const [ page, setPage ] = useState(1);
    const [ pageNotes, setPageNotes ] = useState<FNote[]>();

    // Parse page size.
    const [ pageSize ] = useNoteLabel(note, "pageSize");
    const pageSizeNum = parseInt(pageSize ?? "", 10);
    const normalizedPageSize = (pageSizeNum && pageSizeNum > 0 ? pageSizeNum : 20);

    // Calculate start/end index.
    const startIdx = (page - 1) * normalizedPageSize;
    const endIdx = startIdx + normalizedPageSize;

    // Obtain notes within the range.
    const pageNoteIds = noteIds.slice(startIdx, Math.min(endIdx, noteIds.length));

    useEffect(() => {
        froca.getNotes(pageNoteIds).then(setPageNotes);
    }, [ note, noteIds, page, pageSize ]);

    return {
        page,
        setPage,
        pageNotes
    }
}