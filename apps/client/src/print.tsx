import FNote from "./entities/fnote";
import { render } from "preact";
import { CustomNoteList } from "./widgets/collections/NoteList";
import "./print.css";
import { useCallback, useRef } from "preact/hooks";

async function main() {
    const notePath = window.location.hash.substring(1);
    const noteId = notePath.split("/").at(-1);
    if (!noteId) return;

    const froca = (await import("./services/froca")).default;
    const note = await froca.getNote(noteId);

    if (!note) return;
    render(<App note={note} />, document.body);
}

function App({ note }: { note: FNote }) {
    return (
        <>
            <ContentRenderer note={note} />
        </>
    );
}

function ContentRenderer({ note }: { note: FNote }) {
    const sentReadyEvent = useRef(false);
    const onReady = useCallback(() => {
        if (sentReadyEvent.current) return;
        window.dispatchEvent(new Event("note-ready"));
        sentReadyEvent.current = true;
    }, []);

    // Collections.
    if (note.type === "book") {
        return <CustomNoteList
            isEnabled
            note={note}
            notePath={note.getBestNotePath().join("/")}
            ntxId="print"
            highlightedTokens={null}
            media="print"
            onReady={onReady}
        />;
    }

    // Other note types.
    return <>
        <h1>{note.title}</h1>
    </>;
}

main();
