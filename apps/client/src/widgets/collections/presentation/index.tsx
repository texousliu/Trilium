import { useEffect, useRef, useState } from "preact/hooks";
import { ViewModeProps } from "../interface";
import { buildPresentation } from "./slide_builder";

export default function PresentationView({ note }: ViewModeProps<{}>) {

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        buildPresentation(note).then(presentationEl => {
            containerRef.current?.replaceChildren(presentationEl);
        });
    }, [ note ]);

    return <div ref={containerRef} className="presentation" />;
}
