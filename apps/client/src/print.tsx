import { JSX } from "preact/jsx-runtime";
import FNote from "./entities/fnote";
import { render } from "preact";
import { getComponentByViewTypeForPrint, useNoteIds, useViewModeConfig } from "./widgets/collections/NoteList";
import { ViewTypeOptions } from "./widgets/collections/interface";

async function main() {
    const noteId = window.location.pathname.split("/")[2];
    const froca = (await import("./services/froca")).default;
    const note = await froca.getNote(noteId);

    if (!note) return;

    let el: JSX.Element | null = null;
    if (note.type === "book") {
        el = <Collection note={note} />;
    }

    render(el, document.body);
}

function Collection({ note }: { note: FNote }) {
    const viewType = note.getLabelValue("viewType") as ViewTypeOptions ?? "grid";
    const viewConfig = useViewModeConfig(note, viewType);
    const noteIds = useNoteIds(note, viewType, "print");
    const component = getComponentByViewTypeForPrint(viewType, {
        saveConfig() {
            // While printing we don't allow for interactivity, so saving the config is a no-op.
        },
        viewConfig: viewConfig?.[0] ?? {},
        note,
        notePath: note.getBestNotePath().join("/"),
        noteIds,
        highlightedTokens: null
    });

    return (
        <>
            <h1>{note.title}</h1>

            {component}
        </>
    );
}

main();
