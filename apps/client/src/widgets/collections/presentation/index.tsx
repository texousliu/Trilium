import { ViewModeProps } from "../interface";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import Reveal from "reveal.js";
import slideBaseStylesheet from "reveal.js/dist/reveal.css?raw";
import slideThemeStylesheet from "reveal.js/dist/theme/black.css?raw";
import slideCustomStylesheet from "./slidejs.css?raw";
import { buildPresentationModel, PresentationModel, PresentationSlideBaseModel } from "./model";
import ShadowDom from "../../react/ShadowDom";
import ActionButton from "../../react/ActionButton";
import "./index.css";
import { RefObject } from "preact";
import { openInCurrentNoteContext } from "../../../components/note_context";
import { useTriliumEvent } from "../../react/hooks";
import { t } from "../../../services/i18n";

const stylesheets = [
    slideBaseStylesheet,
    slideThemeStylesheet,
    slideCustomStylesheet
].map(stylesheet => stylesheet.replace(/:root/g, ":host"));

export default function PresentationView({ note, noteIds }: ViewModeProps<{}>) {
    const [ presentation, setPresentation ] = useState<PresentationModel>();
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<Reveal.Api>(null);

    function refresh() {
        buildPresentationModel(note).then(setPresentation);
    }

    useTriliumEvent("entitiesReloaded", ({ loadResults }) => {
        if (loadResults.getNoteIds().find(noteId => noteIds.includes(noteId))) {
            console.log("Needs reload!");
            refresh();
        }
    });

    useLayoutEffect(refresh, [ note, noteIds ]);

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
                text={t("presentation_view.edit-slide")}
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
                text={t("presentation_view.start-presentation")}
                onClick={() => containerRef.current?.requestFullscreen()}
            />
        </div>
    )
}

function Presentation({ presentation, apiRef: externalApiRef } : { presentation: PresentationModel, apiRef: RefObject<Reveal.Api> }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<Reveal.Api>(null);
    const isFirstRenderRef = useRef(true);

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
        api.initialize().then(() => {
            apiRef.current = api;
            externalApiRef.current = api;
        });

        return () => {
            api.destroy();
            apiRef.current = null;
        }
    }, [ ]);

    useEffect(() => {
        if (!isFirstRenderRef.current) {
            apiRef.current?.sync();
        }
        isFirstRenderRef.current = false;
    }, [ presentation ]);

    return (
        <div ref={containerRef} className="reveal">
            <div className="slides">
                {presentation.slides?.map(slide => {
                    if (!slide.verticalSlides) {
                        return <Slide key={slide.noteId} slide={slide} />
                    } else {
                        return (
                            <section>
                                <Slide key={slide.noteId} slide={slide} />
                                {slide.verticalSlides.map(slide => <Slide key={slide.noteId} slide={slide} /> )}
                            </section>
                        );
                    }
                })}
            </div>
        </div>
    )

}

function Slide({ slide }: { slide: PresentationSlideBaseModel }) {
    return <section data-note-id={slide.noteId} dangerouslySetInnerHTML={slide.content} />;
}

function getNoteIdFromSlide(slide: HTMLElement | undefined) {
    if (!slide) return;
    return slide.dataset.noteId;
}
