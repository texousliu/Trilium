import TypeWidget from "./type_widget.js";
import server from "../../services/server.js";
import type FNote from "../../entities/fnote.js";
import options from "../../services/options.js";
import type { LibraryItem } from "@excalidraw/excalidraw/types";
import type Canvas from "./canvas_el.js";
import { CanvasContent } from "./canvas_el.js";
import { renderReactWidget } from "../react/react_utils.jsx";
import SpacedUpdate from "../../services/spaced_update.js";
import protected_session_holder from "../../services/protected_session_holder.js";

/**
 * # Canvas note with excalidraw
 * @author thfrei 2022-05-11
 *
 * Background:
 * excalidraw gives great support for hand-drawn notes. It also allows including images and support
 * for sketching. Excalidraw has a vibrant and active community.
 *
 * Functionality:
 * We store the excalidraw assets (elements and files) in the note. In addition to that, we
 * export the SVG from the canvas on every update and store it in the note's attachment. It is used when
 * calling api/images and makes referencing very easy.
 *
 * Paths not taken.
 *  - excalidraw-to-svg (node.js) could be used to avoid storing the svg in the backend.
 *    We could render the SVG on the fly. However, as of now, it does not render any hand drawn
 *    (freedraw) paths. There is an issue with Path2D object not present in the node-canvas library
 *    used by jsdom. (See Trilium PR for samples and other issues in the respective library.
 *    Link will be added later). Related links:
 *     - https://github.com/Automattic/node-canvas/pull/2013
 *     - https://github.com/google/canvas-5-polyfill
 *     - https://github.com/Automattic/node-canvas/issues/1116
 *     - https://www.npmjs.com/package/path2d-polyfill
 *  - excalidraw-to-svg (node.js) takes quite some time to load an image (1-2s)
 *  - excalidraw-utils (browser) does render freedraw, however NOT freedraw with a background. It is not
 *    used, since it is a big dependency, and has the same functionality as react + excalidraw.
 *  - infinite-drawing-canvas with fabric.js. This library lacked a lot of features, excalidraw already
 *    has.
 *
 * Known issues:
 *  - the 3 excalidraw fonts should be included in the share and everywhere, so that it is shown
 *    when requiring svg.
 *
 * Discussion of storing svg in the note attachment:
 *  - Pro: we will combat bit-rot. Showing the SVG will be very fast and easy, since it is already there.
 *  - Con: The note will get bigger (~40-50%?), we will generate more bandwidth. However, using trilium
 *         desktop instance mitigates that issue.
 *
 * Roadmap:
 *  - Support image-notes as reference in excalidraw
 *  - Support canvas note as reference (svg) in other canvas notes.
 *  - Make it easy to include a canvas note inside a text note
 */
export default class ExcalidrawTypeWidget extends TypeWidget {

    private currentNoteId: string;

    private libraryChanged: boolean;
    private librarycache: LibraryItem[];
    private attachmentMetadata: AttachmentMetadata[];
    private themeStyle!: Theme;

    private $render!: JQuery<HTMLElement>;
    private reactHandlers!: JQuery<HTMLElement>;
    private canvasInstance!: Canvas;

    constructor() {
        super();

        // temporary vars
        this.currentNoteId = "";

        // will be overwritten
        this.$render;
        this.$widget;
        this.reactHandlers; // used to control react state

        // TODO: We are duplicating the logic of note_detail.ts because it switches note ID mid-save, causing overwrites.
        // This problem will get solved by itself once type widgets will be rewritten in React without the use of dangerous singletons.
        this.spacedUpdate = new SpacedUpdate(async () => {
            if (!this.noteContext) return;

            const { note } = this.noteContext;
            if (!note) return;

            const { noteId } = note;
            const data = await this.getData();

            // for read only notes
            if (data === undefined) return;

            protected_session_holder.touchProtectedSessionIfNecessary(note);
            await server.put(`notes/${noteId}/data`, data, this.componentId);
            this.dataSaved();
        });
    }

    doRender() {
        this.$widget = $(TPL);
        this.$widget.bind("mousewheel DOMMouseScroll", (event) => {
            if (event.ctrlKey) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        });

        this.$render = this.$widget.find(".canvas-render");

        this.#init();

        return this.$widget;
    }

    async #init() {
        const renderElement = this.$render.get(0);
        if (!renderElement) {
            throw new Error("Unable to find element to render.");
        }

        const Canvas = (await import("./canvas_el.js")).default;
        this.canvasInstance = new Canvas({
            // this makes sure that 1) manual theme switch button is hidden 2) theme stays as it should after opening menu
            onChange: () => this.onChangeHandler(),
            onLibraryChange: () => {
                this.libraryChanged = true;

                this.saveData();
            },
        });

        await setupFonts();
        const canvasEl = renderReactWidget(this, this.canvasInstance.createCanvasElement())[0];
        renderElement.replaceChildren(canvasEl);
    }

    /**
     * called to populate the widget container with the note content
     */
    async doRefresh(note: FNote) {
        if (!this.canvasInstance) {
            await this.#init();
        }

        this.currentNoteId = note.noteId;

        // get note from backend and put into canvas
        const blob = await note.getBlob();
    }

    /**
     * save content to backend
     */
    saveData() {
        // Since Excalidraw sends an enormous amount of events, wait for them to stop before actually saving.
        this.spacedUpdate.resetUpdateTimer();
        this.spacedUpdate.scheduleUpdate();
    }

    onChangeHandler() {
        if (options.is("databaseReadonly")) {
            return;
        }

        if (!this.canvasInstance.isInitialized()) return;

        // changeHandler is called upon any tiny change in excalidraw. button clicked, hover, etc.
        // make sure only when a new element is added, we actually save something.
        const isNewSceneVersion = this.canvasInstance.isNewSceneVersion();
        /**
         * FIXME: however, we might want to make an exception, if viewport changed, since viewport
         *        is desired to save? (add) and appState background, and some things
         */

        // upon updateScene, onchange is called, even though "nothing really changed" that is worth saving
        const isNotInitialScene = !this.canvasInstance.isInitialScene();
        const shouldSave = isNewSceneVersion && isNotInitialScene;

        if (shouldSave) {
            this.canvasInstance.updateSceneVersion();
            this.saveData();
        }
    }

}

async function setupFonts() {
    if (window.EXCALIDRAW_ASSET_PATH) {
        return;
    }

    // currently required by excalidraw, in order to allows self-hosting fonts locally.
    // this avoids making excalidraw load the fonts from an external CDN.
    let path: string;
    if (!glob.isDev) {
        path = `${window.location.pathname}/node_modules/@excalidraw/excalidraw/dist/prod`;
    } else {
        path = (await import("../../../../../node_modules/@excalidraw/excalidraw/dist/prod/fonts/Excalifont/Excalifont-Regular-a88b72a24fb54c9f94e3b5fdaa7481c9.woff2?url")).default;
        let pathComponents = path.split("/");
        path = pathComponents.slice(0, pathComponents.length - 2).join("/");
    }

    window.EXCALIDRAW_ASSET_PATH = path;
}
