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
import { openInCurrentNoteContext } from "../../../components/note_context";

const stylesheets = [
    slideBaseStylesheet,
    slideThemeStylesheet,
    slideCustomStylesheet
].map(stylesheet => stylesheet.replace(/:root/g, ":host"));

export default function PresentationView({ note, noteIds }: ViewModeProps<{}>) {
    const [ presentation, setPresentation ] = useState<PresentationModel>();
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<Reveal.Api>(null);

    useLayoutEffect(() => {
        buildPresentationModel(note).then(setPresentation);
    }, [ note, noteIds ]);

    return presentation && (
        <>
            <ShadowDom
                className="presentation-container"
                containerRef={containerRef}
            >
                {stylesheets.map(stylesheet => <style>{stylesheet}</style>)}
                <Presentation presentation={presentation} apiRef={apiRef} />
            </ShadowDom>
            <ButtonOverlay containerRef={containerRef} apiRef={apiRef} />
        </>
    )
}

function ButtonOverlay({ containerRef, apiRef }: { containerRef: RefObject<HTMLDivElement>, apiRef: RefObject<Reveal.Api> }) {
    return (
        <div className="presentation-button-bar">
            <ActionButton
                icon="bx bx-edit"
                text="Edit this slide"
                onClick={e => {
                    const currentSlide = apiRef.current?.getCurrentSlide();
                    const noteId = getNoteIdFromSlide(currentSlide);

                    if (noteId) {
                        openInCurrentNoteContext(e, noteId);
                    }
                }}
            />

            <ActionButton
                icon="bx bx-fullscreen"
                text="Start presentation"
                onClick={() => containerRef.current?.requestFullscreen()}
            />
        </div>
    )
}

function Presentation({ presentation, apiRef: externalApiRef } : { presentation: PresentationModel, apiRef: RefObject<Reveal.Api> }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<Reveal.Api>(null);

    useEffect(() => {
        if (apiRef.current || !containerRef.current) return;

        const api = new Reveal(containerRef.current, {
            transition: "slide",
            embedded: true,
            keyboardCondition(event) {
                // Full-screen requests sometimes fail, we rely on the UI button instead.
                if (event.key === "f") {
                    return false;
                }

                return true;
            },
        });
        externalApiRef.current = apiRef.current;
        api.initialize().then(() => {
            apiRef.current = api;
        });

        return () => {
            api.destroy();
            apiRef.current = null;
        }
    }, [ ]);

    useEffect(() => {
        apiRef.current?.sync();
    }, [ presentation ]);

    return (
        <div ref={containerRef} className="reveal">
            <div className="slides">
                {presentation.slides?.map(slide => (
                    <Slide key={slide.noteId} slide={slide} />
                ))}
            </div>
        </div>
    )

}

function Slide({ slide }: { slide: PresentationSlideModel }) {
    if (!slide.verticalSlides) {
        // Normal slide.
        return <section data-note-id={slide.noteId} dangerouslySetInnerHTML={slide.content} />;
    } else {
        // Slide with sub notes (show as vertical slides).
        return (
            <section>
                <section data-note-id={slide.noteId} dangerouslySetInnerHTML={slide.content} />
                {slide.verticalSlides.map((slide) => (
                    <section data-note-id={slide.noteId} dangerouslySetInnerHTML={slide.content} />
                ))}
            </section>
        )
    }
}

function getNoteIdFromSlide(slide: HTMLElement | undefined) {
    if (!slide) return;
    return slide.dataset.noteId;
}
