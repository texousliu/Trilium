import { useMemo } from "preact/hooks";
import { LaunchBarDropdownButton, useLauncherIconAndTitle, type LaunchBarWidgetProps } from "./launch_bar_widgets";
import { CSSProperties } from "preact";
import type FNote from "../../entities/fnote";
import { useChildNotes, useNoteLabelBoolean } from "../react/hooks";
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
    const { icon, title } = useLauncherIconAndTitle(note);
    const childNotes = useChildNotes(note.noteId);

    return (
        <LaunchBarDropdownButton
            icon={icon}
            title={title}
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
