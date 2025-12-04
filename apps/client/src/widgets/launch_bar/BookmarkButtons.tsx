import { useMemo } from "preact/hooks";
import { LaunchBarDropdownButton, type LaunchBarWidgetProps } from "./launch_bar_widgets";
import { CSSProperties } from "preact";
import type FNote from "../../entities/fnote";
import { useChildNotes, useNoteLabel, useNoteLabelBoolean, useNoteProperty } from "../react/hooks";
import { escapeHtml } from "../../services/utils";
import "./BookmarkButtons.css";
import NoteLink from "../react/NoteLink";
import { NoteLauncher } from "./GenericButtons";

const PARENT_NOTE_ID = "_lbBookmarks";

export default function BookmarkButtons({ isHorizontalLayout }: LaunchBarWidgetProps) {
    const style = useMemo<CSSProperties>(() => ({
        display: "flex",
        flexDirection: isHorizontalLayout ? "row" : "column",
        contain: "none"
    }), [ isHorizontalLayout ]);
    const childNotes = useChildNotes(PARENT_NOTE_ID);

    return (
        <div style={style}>
            {childNotes?.map(childNote => <SingleBookmark note={childNote} />)}
        </div>
    )
}

function SingleBookmark({ note }: { note: FNote }) {
    const [ bookmarkFolder ] = useNoteLabelBoolean(note, "bookmarkFolder");
    return bookmarkFolder
        ? <BookmarkFolder note={note} />
        : <NoteLauncher launcherNote={note} targetNoteId={note.noteId} />
}

function BookmarkFolder({ note }: { note: FNote }) {
    const [ iconClass ] = useNoteLabel(note, "iconClass");
    const title = useNoteProperty(note, "title");
    const childNotes = useChildNotes(note.noteId);

    return title && iconClass && (
        <LaunchBarDropdownButton
            icon={iconClass}
            title={escapeHtml(title)}
        >
            <div className="bookmark-folder-widget">
                <div className="parent-note">
                    <NoteLink notePath={note.noteId} noPreview showNoteIcon containerClassName="note-link" noTnLink />
                </div>

                <ul className="children-notes">
                    {childNotes.map(childNote => (
                        <li>
                            <NoteLink notePath={childNote.noteId} noPreview showNoteIcon containerClassName="note-link" noTnLink />
                        </li>
                    ))}
                </ul>
            </div>
        </LaunchBarDropdownButton>
    )
}
