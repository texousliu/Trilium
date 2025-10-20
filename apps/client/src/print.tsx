import FNote from "./entities/fnote";
import { render } from "preact";
import { CustomNoteList } from "./widgets/collections/NoteList";
import "./print.css";
import { useCallback, useLayoutEffect, useRef } from "preact/hooks";
import content_renderer from "./services/content_renderer";

interface RendererProps {
    note: FNote;
    onReady: () => void;
}

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
    const sentReadyEvent = useRef(false);
    const onReady = useCallback(() => {
        if (sentReadyEvent.current) return;
        window.dispatchEvent(new Event("note-ready"));
        sentReadyEvent.current = true;
    }, []);
    const props: RendererProps = { note, onReady };

    return (
        <>
            {note.type === "book"
            ? <CollectionRenderer {...props} />
            : <SingleNoteRenderer {...props} />
            }
        </>
    );
}

function SingleNoteRenderer({ note, onReady }: RendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        async function load() {
            if (note.type === "text") {
                await import("@triliumnext/ckeditor5/src/theme/ck-content.css");
            }
            const { $renderedContent } = await content_renderer.getRenderedContent(note, { noChildrenList: true });
            containerRef.current?.replaceChildren(...$renderedContent);
        }

        load().then(() => requestAnimationFrame(onReady))
    }, [ note ]);

    return <>
        <h1>{note.title}</h1>
        <main ref={containerRef} />
    </>;
}

function CollectionRenderer({ note, onReady }: RendererProps) {
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

main();
