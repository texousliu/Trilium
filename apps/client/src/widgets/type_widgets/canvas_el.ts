import "@excalidraw/excalidraw/index.css";
import { Excalidraw } from "@excalidraw/excalidraw";
import { createElement, createRef, Fragment, render } from "preact/compat";

export default function renderCanvas(targetEl: HTMLElement) {
    render(createCanvasElement(), targetEl);
}

function createCanvasElement() {
    const excalidrawWrapperRef = createRef<HTMLElement>();

    return createElement(Fragment, null,
        createElement(
            "div",
            {
                className: "excalidraw-wrapper",
                ref: excalidrawWrapperRef
            },
            createElement(Excalidraw, {

            })
        ));
}
