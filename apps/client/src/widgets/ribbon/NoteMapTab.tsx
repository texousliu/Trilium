import { TabContext } from "./ribbon-interface";
import NoteMapWidget from "../note_map";
import { useLegacyWidget } from "../react/hooks";

export default function NoteMapTab({ note, noteContext }: TabContext) {
    const noteMapWidget = useLegacyWidget(() => new NoteMapWidget("ribbon"), {
        noteContext,
        containerClassName: "note-map-container"
    });

    return (
        <div className="note-map-ribbon-widget">
            {noteMapWidget}
        </div>
    );
}