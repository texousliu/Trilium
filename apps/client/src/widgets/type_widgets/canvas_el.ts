import "@excalidraw/excalidraw/index.css";
import { Excalidraw } from "@excalidraw/excalidraw";
import { createElement, createRef, Fragment, render } from "preact/compat";
import { ExcalidrawProps } from "@excalidraw/excalidraw/types";

export default function renderCanvas(targetEl: HTMLElement, opts: ExcalidrawProps) {
    render(createCanvasElement(opts), targetEl);
}

function createCanvasElement(opts: ExcalidrawProps) {
    const excalidrawWrapperRef = createRef<HTMLElement>();

    return createElement(Fragment, null,
        createElement(
            "div",
            {
                className: "excalidraw-wrapper",
                ref: excalidrawWrapperRef
            },
            createElement(Excalidraw, opts)
        ));
}
