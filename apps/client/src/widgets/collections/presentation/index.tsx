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

    return (
        <div className="reveal">
            <div className="slides">
                {slides && slides?.map(slide => (
                    <Slide note={slide} />
                ))}
            </div>
        </div>
    )

}

function Slide({ note }: { note: FNote }) {
    return (
        <section>
            <p>{note.title}</p>
        </section>
    );
}
