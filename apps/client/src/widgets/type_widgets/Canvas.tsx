import { Excalidraw } from "@excalidraw/excalidraw";
import { TypeWidgetProps } from "./type_widget";
import "@excalidraw/excalidraw/index.css";
import { useNoteBlob } from "../react/hooks";
import { useEffect, useRef } from "preact/hooks";
import type { ExcalidrawImperativeAPI, Theme } from "@excalidraw/excalidraw/types";
import "./Canvas.css";

export default function Canvas({ note }: TypeWidgetProps) {
    const apiRef = useRef<ExcalidrawImperativeAPI>(null);
    const blob = useNoteBlob(note);

    useEffect(() => {
        const documentStyle = window.getComputedStyle(document.documentElement);
        const themeStyle = documentStyle.getPropertyValue("--theme-style")?.trim() as Theme;

        const api = apiRef.current;
        const content = blob?.content;
        if (!api) return;
        if (!content?.trim()) {
            api.updateScene({
                elements: [],
                appState: {
                    theme: themeStyle
                }
            });
        }
    }, [ blob ]);

    return (
        <div className="canvas-widget note-detail-canvas note-detail-printable note-detail full-height">
            <div className="canvas-render">
                <div className="excalidraw-wrapper">
                    <Excalidraw
                        excalidrawAPI={api => apiRef.current = api}
                    />
                </div>
            </div>
        </div>
    )
}
