import { JSX } from "preact/jsx-runtime";
import FNote from "./entities/fnote";
import { render } from "preact";
import { CustomNoteList } from "./widgets/collections/NoteList";
import "./print.css";

async function main() {
    const noteId = window.location.pathname.split("/")[2];
    const froca = (await import("./services/froca")).default;
    const note = await froca.getNote(noteId);

    if (!note) return;

    let el: JSX.Element | null = null;
    if (note.type === "book") {
        el = handleCollection(note);
    }

    render((
        <>
            <h1>{note.title}</h1>
            {el}
        </>
    ), document.body);
}

function handleCollection(note: FNote) {
    return (
        <CustomNoteList
            isEnabled
            note={note}
            notePath={note.getBestNotePath().join("/")}
            ntxId="print"
            highlightedTokens={null}
        />
    );
}

main();
