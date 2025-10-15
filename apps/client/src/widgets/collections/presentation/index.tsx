import { ViewModeProps } from "../interface";
import FNote from "../../../entities/fnote";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/black.css";
import { buildPresentationModel, PresentationModel, PresentationSlideModel } from "./model";

export default function PresentationView({ note }: ViewModeProps<{}>) {
    const [ presentation, setPresentation ] = useState<PresentationModel>();

    useLayoutEffect(() => {
        buildPresentationModel(note).then(setPresentation);
    }, [ note ]);

    return presentation && (
        <Presentation presentation={presentation} />
    )
}

function Presentation({ presentation } : { presentation: PresentationModel }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<Reveal.Api | null>(null);

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
                {presentation.slides?.map(slide => (
                    <Slide slide={slide} />
                ))}
            </div>
        </div>
    )

}

function Slide({ slide }: { slide: PresentationSlideModel }) {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <section ref={containerRef}>
            {slide.content}
        </section>
    );
}
