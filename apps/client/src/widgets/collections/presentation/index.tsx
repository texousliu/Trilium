import { ViewModeProps } from "../interface";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import Reveal from "reveal.js";
import slideBaseStylesheetUrl from "reveal.js/dist/reveal.css?url";
import slideThemeStylesheetUrl from "reveal.js/dist/theme/black.css?url";
import { buildPresentationModel, PresentationModel, PresentationSlideModel } from "./model";
import ShadowDom from "../../react/ShadowDom";

export default function PresentationView({ note }: ViewModeProps<{}>) {
    const [ presentation, setPresentation ] = useState<PresentationModel>();

    useLayoutEffect(() => {
        buildPresentationModel(note).then(setPresentation);
    }, [ note ]);

    return presentation && (
        <ShadowDom className="presentation-container" style={{ width: "100%", height: "100%" }}>
            <link rel="stylesheet" href={slideBaseStylesheetUrl} />
            <link rel="stylesheet" href={slideThemeStylesheetUrl} />
            <Presentation presentation={presentation} />
        </ShadowDom>
    )
}

function Presentation({ presentation } : { presentation: PresentationModel }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<Reveal.Api | null>(null);

    useEffect(() => {
        if (apiRef.current || !containerRef.current) return;

        apiRef.current = new Reveal(containerRef.current, {
            transition: "slide",
            embedded: true
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
    return (
        <section dangerouslySetInnerHTML={slide.content}>
            {slide.content}
        </section>
    );
}
