import { Fragment } from "preact/jsx-runtime";
import "./Breadcrumb.css";
import ActionButton from "./react/ActionButton";
import { useNoteContext } from "./react/hooks";
import NoteLink from "./react/NoteLink";
import Dropdown from "./react/Dropdown";
import Icon from "./react/Icon";

export default function Breadcrumb() {
    const { noteContext } = useNoteContext();
    const notePath = buildNotePaths(noteContext?.notePathArray);

    return (
        <div className="breadcrumb">
            {notePath.map(item => (
                <Fragment key={item}>
                    <BreadcrumbItem notePath={item} />
                    <BreadcrumbSeparator notePath={item} />
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

function BreadcrumbSeparator({ notePath }: { notePath: string}) {
    return (
        <Dropdown
            text={<Icon icon="bx bx-chevron-right" />}
            noSelectButtonStyle
            buttonClassName="icon-action"
            hideToggleArrow
        >
            Content goes here.
        </Dropdown>
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
