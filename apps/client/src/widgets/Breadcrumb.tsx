import { Fragment } from "preact/jsx-runtime";
import "./Breadcrumb.css";
import { useChildNotes, useNoteContext } from "./react/hooks";
import NoteLink from "./react/NoteLink";
import Dropdown from "./react/Dropdown";
import Icon from "./react/Icon";
import { FormListItem } from "./react/FormList";
import NoteContext from "../components/note_context";

export default function Breadcrumb() {
    const { note, noteContext } = useNoteContext();
    const notePath = buildNotePaths(noteContext?.notePathArray);

    return (
        <div className="breadcrumb">
            {notePath.map((item, index) => (
                <Fragment key={item}>
                    <BreadcrumbItem notePath={item} activeNotePath={noteContext?.notePath ?? ""} />
                    {(index < notePath.length - 1 || note?.hasChildren()) &&
                        <BreadcrumbSeparator notePath={item} activeNotePath={notePath[index+1]} noteContext={noteContext} />}
                </Fragment>
            ))}
        </div>
    )
}

function BreadcrumbItem({ notePath, activeNotePath }: { notePath: string, activeNotePath: string }) {
    const isRootNote = (notePath === "root");
    return (
        <NoteLink
            notePath={notePath}
            noPreview
            title={isRootNote && activeNotePath !== "root" ? "" : undefined}
            showNoteIcon={isRootNote}
        />
    )
}

function BreadcrumbSeparator({ notePath, noteContext, activeNotePath }: { notePath: string, activeNotePath: string, noteContext: NoteContext | undefined }) {
    return (
        <Dropdown
            text={<Icon icon="bx bx-chevron-right" />}
            noSelectButtonStyle
            buttonClassName="icon-action"
            hideToggleArrow
            dropdownOptions={{ popperConfig: { strategy: "fixed" } }}
        >
            <BreadcrumbSeparatorDropdownContent notePath={notePath} noteContext={noteContext} activeNotePath={activeNotePath} />
        </Dropdown>
    )
}

function BreadcrumbSeparatorDropdownContent({ notePath, noteContext, activeNotePath }: { notePath: string, activeNotePath: string, noteContext: NoteContext | undefined }) {
    const notePathComponents = notePath.split("/");
    const notePathPrefix = notePathComponents.join("/");    // last item was removed already.
    const parentNoteId = notePathComponents.length > 1 ? notePathComponents.pop() : "root";
    const childNotes = useChildNotes(parentNoteId);

    return (
        <ul class="breadcrumb-child-list">
            {childNotes.map((note) => {
                const childNotePath = `${notePathPrefix}/${note.noteId}`
                return <li key={note.noteId}>
                    <FormListItem
                        icon={note.getIcon()}
                        onClick={() => noteContext?.setNote(childNotePath)}
                    >
                        {childNotePath !== activeNotePath
                        ? <span>{note.title}</span>
                        : <strong>{note.title}</strong>}
                    </FormListItem>
                </li>
        })}
        </ul>
    )
}

function buildNotePaths(notePathArray: string[] | undefined) {
    if (!notePathArray) return [];

    let prefix = "";
    const output: string[] = [];
    for (const notePath of notePathArray) {
        output.push(`${prefix}${notePath}`);
        prefix += `${notePath}/`;
    }
    return output;
}
