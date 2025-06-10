import "@excalidraw/excalidraw/index.css";
import { Excalidraw, getSceneVersion, exportToSvg } from "@excalidraw/excalidraw";
import { createElement, createRef, Fragment, render } from "preact/compat";
import { ExcalidrawImperativeAPI, ExcalidrawProps } from "@excalidraw/excalidraw/types";

/** -1 indicates that it is fresh. excalidraw scene version is always >0 */
const SCENE_VERSION_INITIAL = -1;
/** -2 indicates error */
const SCENE_VERSION_ERROR = -2;

export default class Canvas {

    private currentSceneVersion: number;
    private opts: ExcalidrawProps;
    excalidrawApi!: ExcalidrawImperativeAPI;

    constructor(opts: ExcalidrawProps) {
        this.opts = opts;
        this.currentSceneVersion = SCENE_VERSION_INITIAL;
    }

    renderCanvas(targetEl: HTMLElement) {
        render(createCanvasElement({
            ...this.opts,
            excalidrawAPI: (api: ExcalidrawImperativeAPI) => {
                this.excalidrawApi = api;
            },
        }), targetEl);
    }

    /**
     * needed to ensure, that multipleOnChangeHandler calls do not trigger a save.
     * we compare the scene version as suggested in:
     * https://github.com/excalidraw/excalidraw/issues/3014#issuecomment-778115329
     *
     * info: sceneVersions are not incrementing. it seems to be a pseudo-random number
     */
    isNewSceneVersion() {
        const sceneVersion = this.getSceneVersion();

        return (
            this.currentSceneVersion === SCENE_VERSION_INITIAL || // initial scene version update
            this.currentSceneVersion !== sceneVersion
        ); // ensure scene changed
    }

    getSceneVersion() {
        const elements = this.excalidrawApi.getSceneElements();
        return getSceneVersion(elements);
    }

    updateSceneVersion() {
        this.currentSceneVersion = this.getSceneVersion();
    }

    resetSceneVersion() {
        this.currentSceneVersion = SCENE_VERSION_INITIAL;
    }

    isInitialScene() {
        return this.currentSceneVersion === SCENE_VERSION_INITIAL;
    }

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
