import { useMemo } from "preact/hooks";
import type { LaunchBarWidgetProps } from "./launch_bar_widget";
import { CSSProperties } from "preact";
import type FNote from "../../entities/fnote";
import { useChildNotes, useNoteLabel, useNoteLabelBoolean, useNoteProperty } from "../react/hooks";
import ActionButton from "../react/ActionButton";
import appContext from "../../components/app_context";
import { escapeHtml, isCtrlKey } from "../../services/utils";
import link_context_menu from "../../menus/link_context_menu";
import "./BookmarkButtons.css";
import Dropdown from "../react/Dropdown";
import Icon from "../react/Icon";
import NoteList from "../react/NoteList";
import NoteLink from "../react/NoteLink";

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
        : <OpenNoteButtonWidget note={note} />
}

function OpenNoteButtonWidget({ note }: { note: FNote }) {
    const [ iconClass ] = useNoteLabel(note, "iconClass");
    const title = useNoteProperty(note, "title");

    async function launch(evt: MouseEvent) {
        if (evt.which === 3) {
            return;
        }
        const hoistedNoteId = getHoistedNoteId(note);
        const ctrlKey = isCtrlKey(evt);

        if ((evt.which === 1 && ctrlKey) || evt.which === 2) {
            const activate = evt.shiftKey ? true : false;
            await appContext.tabManager.openInNewTab(note.noteId, hoistedNoteId, activate);
        } else {
            await appContext.tabManager.openInSameTab(note.noteId);
        }
    }

    return title && iconClass && (
        <ActionButton
            icon={iconClass}
            text={escapeHtml(title)}
            className="button-widget launcher-button"
            noIconActionClass
            titlePosition="right"
            onClick={launch}
            onAuxClick={launch}
            onContextMenu={evt => {
                evt.preventDefault();
                link_context_menu.openContextMenu(note.noteId, evt);
            }}
        />
    )
}

function BookmarkFolder({ note }: { note: FNote }) {
    const [ iconClass ] = useNoteLabel(note, "iconClass");
    const title = useNoteProperty(note, "title");
    const childNotes = useChildNotes(note.noteId);

    return title && iconClass && (
        <Dropdown
            className="right-dropdown-widget"
            buttonClassName="right-dropdown-button launcher-button"
            hideToggleArrow
            title={escapeHtml(title)}
            text={<Icon icon={iconClass} />}
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
        </Dropdown>
    )
}

function getHoistedNoteId(noteToOpen: FNote) {
    return noteToOpen.getRelationValue("hoistedNote") || appContext.tabManager.getActiveContext()?.hoistedNoteId;
}
