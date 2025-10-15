import { ViewModeProps } from "../interface";
import FNote from "../../../entities/fnote";
import { useLayoutEffect, useState } from "preact/hooks";

export default function PresentationView({ note }: ViewModeProps<{}>) {
    return note && (
        <Presentation note={note} />
    )
}

function Presentation({ note }: { note: FNote }) {
    const [ slides, setSlides ] = useState<FNote[]>();

    useLayoutEffect(() => {
        note.getChildNotes().then(setSlides);
    }, [ note ]);

    return (slides && slides?.map(slide => (
        <Slide note={slide} />
    )));
}

function Slide({ note }: { note: FNote }) {
    return <p>{note.title}</p>
}
