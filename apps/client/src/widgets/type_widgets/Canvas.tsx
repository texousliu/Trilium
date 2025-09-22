import { Excalidraw } from "@excalidraw/excalidraw";
import { TypeWidgetProps } from "./type_widget";
import "@excalidraw/excalidraw/index.css";
import { useNoteBlob } from "../react/hooks";
import { useEffect, useMemo, useRef } from "preact/hooks";
import type { ExcalidrawImperativeAPI, AppState } from "@excalidraw/excalidraw/types";
import options from "../../services/options";
import "./Canvas.css";

export default function Canvas({ note }: TypeWidgetProps) {
    const apiRef = useRef<ExcalidrawImperativeAPI>(null);
    const blob = useNoteBlob(note);
    const viewModeEnabled = options.is("databaseReadonly");
    const themeStyle = useMemo(() => {
        const documentStyle = window.getComputedStyle(document.documentElement);
        return documentStyle.getPropertyValue("--theme-style")?.trim() as AppState["theme"];
    }, []);

    useEffect(() => {
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
                        theme={themeStyle}
                        viewModeEnabled={viewModeEnabled}
                        zenModeEnabled={false}
                        isCollaborating={false}
                        detectScroll={false}
                        handleKeyboardGlobally={false}
                        autoFocus={false}
                        UIOptions={{
                            canvasActions: {
                                saveToActiveFile: false,
                                export: false
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
