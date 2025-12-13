import "./InlineTitle.css";

import { useEffect, useState } from "preact/hooks";

import FNote from "../../entities/fnote";
import { useNoteContext } from "../react/hooks";

export default function InlineTitle() {
    const { note, parentComponent } = useNoteContext();
    const [ shown, setShown ] = useState(shouldShow(note));

    useEffect(() => {
        setShown(shouldShow(note));
    }, [ note ]);

    useEffect(() => {
        if (!shown) return;

        const titleRow = parentComponent.$widget[0]
            .closest(".note-split")
            ?.querySelector("&> .title-row");
        if (!titleRow) return;

        titleRow.classList.add("collapse");

        return () => titleRow.classList.remove("collapse");
    }, [ shown, parentComponent ]);

    return (
        <div className="inline-title-row">
            Title goes here.
        </div>
    );
}

function shouldShow(note: FNote | null | undefined) {
    if (!note) return false;
    return note.type === "text";
}
