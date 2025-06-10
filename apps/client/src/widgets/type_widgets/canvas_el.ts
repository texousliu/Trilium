import "@excalidraw/excalidraw/index.css";
import { Excalidraw } from "@excalidraw/excalidraw";
import { h, render } from "preact";

export default function renderCanvas(targetEl: HTMLElement) {
    render(h(Excalidraw, null, "Hello world"), targetEl);
}
