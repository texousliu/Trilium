import { Excalidraw, getSceneVersion, exportToSvg } from "@excalidraw/excalidraw";
import { AppState, BinaryFileData, ExcalidrawImperativeAPI, ExcalidrawProps, LibraryItem } from "@excalidraw/excalidraw/types";
import { ExcalidrawElement, NonDeletedExcalidrawElement, Theme } from "@excalidraw/excalidraw/element/types";
import { useCallback } from "preact/hooks";
import linkService from "../../services/link.js";

export interface CanvasContent {
    elements: ExcalidrawElement[];
    files: BinaryFileData[];
    appState: Partial<AppState>;
}

/** Indicates that it is fresh. excalidraw scene version is always >0 */
const SCENE_VERSION_INITIAL = -1;

export default class Canvas {

    private currentSceneVersion: number;
    private opts: ExcalidrawProps;
    private excalidrawApi!: ExcalidrawImperativeAPI;

    constructor(opts: ExcalidrawProps) {
        this.opts = opts;
        this.currentSceneVersion = SCENE_VERSION_INITIAL;
        this.initializedPromise = $.Deferred();
    }

    createCanvasElement() {
        return <CanvasElement
            {...this.opts}
        />
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

    isInitialized() {
        return !!this.excalidrawApi;
    }

}

function CanvasElement(opts: ExcalidrawProps) {
    return (
            <Excalidraw
                {...opts}
                onLinkOpen={useCallback((element: NonDeletedExcalidrawElement, event: CustomEvent) => {
                    let link = element.link;
                    if (!link) {
                        return false;
                    }

                    if (link.startsWith("root/")) {
                        link = "#" + link;
                    }

                    const { nativeEvent } = event.detail;
                    event.preventDefault();
                    return linkService.goToLinkExt(nativeEvent, link, null);
                }, [])}
            />
    );
}
