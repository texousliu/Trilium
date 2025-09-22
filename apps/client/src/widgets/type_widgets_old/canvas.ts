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

}
