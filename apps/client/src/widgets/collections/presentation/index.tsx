import { ViewModeProps } from "../interface";
import FNote from "../../../entities/fnote";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/black.css";

export default function PresentationView({ note }: ViewModeProps<{}>) {
    return note && (
        <Presentation note={note} />
    )
}

function Presentation({ note }: { note: FNote }) {
    const [ slides, setSlides ] = useState<FNote[]>();
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<Reveal.Api | null>(null);

    useLayoutEffect(() => {
        note.getChildNotes().then(setSlides);
    }, [ note ]);

    useEffect(() => {
        if (apiRef.current || !containerRef.current) return;

        apiRef.current = new Reveal(containerRef.current, {
            transition: "slide"
        });
        apiRef.current.initialize().then(() => {
            console.log("Slide.js initialized.");
        });

        return () => {
            if (apiRef.current) {
                apiRef.current.destroy();
                apiRef.current = null;
            }
        }
    }, []);

    return (
        <div ref={containerRef} className="reveal">
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
