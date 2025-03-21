// import { t } from "../services/i18n.js";
// import libraryLoader from "../services/library_loader.js";
// import NoteContextAwareWidget from "./note_context_aware_widget.js";
// import server from "../services/server.js";
// import utils from "../services/utils.js";
// import { loadElkIfNeeded, postprocessMermaidSvg } from "../services/mermaid.js";
// import type FNote from "../entities/fnote.js";
// import type { EventData } from "../components/app_context.js";

// const TPL = `<div class="mermaid-widget">
//     <style>
//         .mermaid-widget {
//             overflow: auto;
//         }

//         body.mobile .mermaid-widget {
//             min-height: 200px;
//             flex-grow: 2;
//             flex-basis: 0;
//             border-bottom: 1px solid var(--main-border-color);
//             margin-bottom: 10px;
//         }

//         body.desktop .mermaid-widget + .gutter {
//             border-bottom: 1px solid var(--main-border-color);
//         }

//         .mermaid-render {
//             overflow: auto;
//             height: 100%;
//             text-align: center;
//         }

//         .mermaid-render svg {
//             max-width: 100% !important;
//             width: 100%;
//         }
//     </style>

//     <div class="mermaid-error alert alert-warning">
//         <p><strong>${t("mermaid.diagram_error")}</strong></p>
//         <p class="error-content"></p>
//     </div>

//     <div class="mermaid-render"></div>
// </div>`;

// export default class MermaidWidget extends NoteContextAwareWidget {

//     private $display!: JQuery<HTMLElement>;
//     private $errorContainer!: JQuery<HTMLElement>;
//     private $errorMessage!: JQuery<HTMLElement>;
//     private dirtyAttachment?: boolean;
//     private lastNote?: FNote;

//     isEnabled() {
//         return super.isEnabled() && this.note?.type === "mermaid" && this.note.isContentAvailable() && this.noteContext?.viewScope?.viewMode === "default";
//     }

//     doRender() {
//         this.$widget = $(TPL);
//         this.contentSized();
//         this.$display = this.$widget.find(".mermaid-render");
//         this.$errorContainer = this.$widget.find(".mermaid-error");
//         this.$errorMessage = this.$errorContainer.find(".error-content");
//     }

//     async refreshWithNote(note: FNote) {
//         const isSameNote = (this.lastNote === note);

//         this.cleanup();
//         this.$errorContainer.hide();

//         if (!isSameNote) {
//             this.$display.empty();
//         }

//         this.$errorContainer.hide();

//         try {
//             const svg = await this.renderSvg();

//             if (this.dirtyAttachment) {
//                 const payload = {
//                     role: "image",
//                     title: "mermaid-export.svg",
//                     mime: "image/svg+xml",
//                     content: svg,
//                     position: 0
//                 };

//                 server.post(`notes/${this.noteId}/attachments?matchBy=title`, payload).then(() => {
//                     this.dirtyAttachment = false;
//                 });
//             }

//             this.$display.html(svg);
//             this.$display.attr("id", `mermaid-render-${idCounter}`);

//             // Enable pan to zoom.
//             this.#setupPanZoom($svg[0], isSameNote);
//         } catch (e: any) {
//             console.warn(e);
//             this.#cleanUpZoom();
//             this.$display.empty();
//             this.$errorMessage.text(e.message);
//             this.$errorContainer.show();
//         }

//         this.lastNote = note;
//     }

//     cleanup() {
//         super.cleanup();
//         if (this.zoomHandler) {
//             $(window).off("resize", this.zoomHandler);
//             this.zoomHandler = undefined;
//         }
//     }



//     toggleInt(show: boolean | null | undefined): void {
//         super.toggleInt(show);

//         if (!show) {
//             this.cleanup();
//         }
//     }

//     async renderSvg() {


//         if (!this.note) {
//             return "";
//         }

//         await loadElkIfNeeded(content);

//     }



//     async entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
//         if (this.noteId && loadResults.isNoteContentReloaded(this.noteId)) {
//             this.dirtyAttachment = true;

//             await this.refresh();
//         }
//     }

//     async exportSvgEvent({ ntxId }: EventData<"exportSvg">) {
//         if (!this.isNoteContext(ntxId) || this.note?.type !== "mermaid") {
//             return;
//         }

//         const svg = await this.renderSvg();
//         utils.downloadSvg(this.note.title, svg);
//     }
// }

