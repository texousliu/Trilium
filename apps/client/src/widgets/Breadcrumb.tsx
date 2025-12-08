import { Fragment } from "preact/jsx-runtime";
import "./Breadcrumb.css";
import { useChildNotes, useNoteContext } from "./react/hooks";
import NoteLink from "./react/NoteLink";
import Dropdown from "./react/Dropdown";
import Icon from "./react/Icon";
import { FormListItem } from "./react/FormList";
import NoteContext from "../components/note_context";

export default function Breadcrumb() {
    const { noteContext } = useNoteContext();
    const notePath = buildNotePaths(noteContext?.notePathArray);

    return (
        <div className="breadcrumb">
            {notePath.map(item => (
                <Fragment key={item}>
                    <BreadcrumbItem notePath={item} />
                    <BreadcrumbSeparator notePath={item} noteContext={noteContext} />
                </Fragment>
            ))}
        </div>
    )
}

function BreadcrumbItem({ notePath }: { notePath: string }) {
    return (
        <NoteLink
            notePath={notePath}
            noPreview
        />
    )
}

function BreadcrumbSeparator({ notePath, noteContext }: { notePath: string, noteContext: NoteContext | undefined }) {
    return (
        <Dropdown
            text={<Icon icon="bx bx-chevron-right" />}
            noSelectButtonStyle
            buttonClassName="icon-action"
            hideToggleArrow
        >
            <BreadcrumbSeparatorDropdownContent notePath={notePath} noteContext={noteContext} />
        </Dropdown>
    )
}

function BreadcrumbSeparatorDropdownContent({ notePath, noteContext }: { notePath: string, noteContext: NoteContext | undefined }) {
    const notePathComponents = notePath.split("/");
    const parentNoteId = notePathComponents.length > 1 ? notePathComponents.pop() : "root";
    const childNotes = useChildNotes(parentNoteId);
    const notePathPrefix = notePathComponents.join("/");    // last item was removed already.

    return (
        <ul class="breadcrumb-child-list">
            {childNotes.map((note) => (
                <li key={note.noteId}>
                    <FormListItem
                        icon={note.getIcon()}
                        onClick={() => noteContext?.setNote(`${notePathPrefix}/${note.noteId}`)}
                    >{note.title}</FormListItem>
                </li>
            ))}
        </ul>
    )
}

function buildNotePaths(notePathArray: string[] | undefined) {
    if (!notePathArray) return [];

    let prefix = "";
    const output: string[] = [];
    for (const notePath of notePathArray.slice(0, notePathArray.length - 1)) {
        output.push(`${prefix}${notePath}`);
        prefix += `${notePath}/`;
    }
    return output;
}
