import "./InlineTitle.css";

import { useEffect, useRef, useState } from "preact/hooks";

import FNote from "../../entities/fnote";
import NoteIcon from "../note_icon";
import NoteTitleWidget from "../note_title";
import { useNoteContext } from "../react/hooks";

export default function InlineTitle() {
    const { note, parentComponent } = useNoteContext();
    const [ shown, setShown ] = useState(shouldShow(note));
    const containerRef=  useRef<HTMLDivElement>(null);

    useEffect(() => {
        setShown(shouldShow(note));
    }, [ note ]);

    useEffect(() => {
        if (!shown) return;

        const titleRow = parentComponent.$widget[0]
            .closest(".note-split")
            ?.querySelector("&> .title-row");
        if (!titleRow) return;

        const observer = new IntersectionObserver((entries) => {
            titleRow.classList.toggle("collapse", entries[0].isIntersecting);
        });
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            titleRow.classList.remove("collapse");
            observer.disconnect();
        };
    }, [ shown, parentComponent ]);

    return (
        <div
            ref={containerRef}
            className="inline-title-row"
        >
            <NoteIcon />
            <NoteTitleWidget />
        </div>
    );
}

function shouldShow(note: FNote | null | undefined) {
    if (!note) return false;
    return note.type === "text";
}
