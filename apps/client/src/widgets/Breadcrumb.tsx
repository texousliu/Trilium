import "./Breadcrumb.css";
import { useNoteContext } from "./react/hooks";
import NoteLink from "./react/NoteLink";
import { joinElements } from "./react/react_utils";

export default function Breadcrumb() {
    const { noteContext } = useNoteContext();
    const notePath = buildNotePaths(noteContext?.notePathArray);

    return (
        <div className="breadcrumb">
            {joinElements(notePath.map(item => (
                <BreadcrumbItem key={item} notePath={item} />
            )), <>&nbsp;›&nbsp;</>)}
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
