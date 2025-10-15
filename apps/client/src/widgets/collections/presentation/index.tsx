import { ViewModeProps } from "../interface";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import Reveal from "reveal.js";
import slideBaseStylesheet from "reveal.js/dist/reveal.css?raw";
import slideThemeStylesheet from "reveal.js/dist/theme/black.css?raw";
import slideCustomStylesheet from "./slidejs.css?raw";
import { buildPresentationModel, PresentationModel, PresentationSlideModel } from "./model";
import ShadowDom from "../../react/ShadowDom";
import ActionButton from "../../react/ActionButton";
import "./index.css";
import { RefObject } from "preact";

const stylesheets = [
    slideBaseStylesheet,
    slideThemeStylesheet,
    slideCustomStylesheet
].map(stylesheet => stylesheet.replace(/:root/g, ":host"));

export default function PresentationView({ note }: ViewModeProps<{}>) {
    const [ presentation, setPresentation ] = useState<PresentationModel>();
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        buildPresentationModel(note).then(setPresentation);
    }, [ note ]);

    return presentation && (
        <>
            <ShadowDom
                className="presentation-container"
                containerRef={containerRef}
            >
                {stylesheets.map(stylesheet => <style>{stylesheet}</style>)}
                <Presentation presentation={presentation} />
            </ShadowDom>
            <ButtonOverlay containerRef={containerRef} />
        </>
    )
}

function ButtonOverlay({ containerRef }: { containerRef: RefObject<HTMLDivElement> }) {
    return (
        <div className="presentation-button-bar">
            <ActionButton
                icon="bx bx-fullscreen" text="Start presentation"
                onClick={() => {
                    containerRef.current?.requestFullscreen();
                }}
            />
        </div>
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
    if (!slide.verticalSlides) {
        // Normal slide.
        return <section dangerouslySetInnerHTML={slide.content} />;
    } else {
        // Slide with sub notes (show as vertical slides).
        return (
            <section>
                <section dangerouslySetInnerHTML={slide.content} />
                {slide.verticalSlides.map((slide) => (
                    <section dangerouslySetInnerHTML={slide.content} />
                ))}
            </section>
        )
    }
}
