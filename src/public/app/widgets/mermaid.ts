import { t } from "../services/i18n.js";
import libraryLoader from "../services/library_loader.js";
import NoteContextAwareWidget from "./note_context_aware_widget.js";
import server from "../services/server.js";
import utils from "../services/utils.js";
import { loadElkIfNeeded, postprocessMermaidSvg } from "../services/mermaid.js";
import type FNote from "../entities/fnote.js";
import type { EventData } from "../components/app_context.js";

const TPL = `<div class="mermaid-widget">
    <style>
        .mermaid-widget {
            overflow: auto;
        }

        body.mobile .mermaid-widget {
            min-height: 200px;
            flex-grow: 2;
            flex-basis: 0;
            border-bottom: 1px solid var(--main-border-color);
            margin-bottom: 10px;
        }

        body.desktop .mermaid-widget + .gutter {
            border-bottom: 1px solid var(--main-border-color);
        }

        .mermaid-render {
            overflow: auto;
            height: 100%;
            text-align: center;
        }

        .mermaid-render svg {
            max-width: 100% !important;
            width: 100%;
        }
    </style>

    <div class="mermaid-error alert alert-warning">
        <p><strong>${t("mermaid.diagram_error")}</strong></p>
        <p class="error-content"></p>
    </div>

    <div class="mermaid-render"></div>
</div>`;

let idCounter = 1;

export default class MermaidWidget extends NoteContextAwareWidget {

    private $display!: JQuery<HTMLElement>;
    private $errorContainer!: JQuery<HTMLElement>;
    private $errorMessage!: JQuery<HTMLElement>;
    private dirtyAttachment?: boolean;
    private zoomHandler?: () => void;
    private zoomInstance?: SvgPanZoom.Instance;
    private lastNote?: FNote;

    isEnabled() {
        return super.isEnabled() && this.note?.type === "mermaid" && this.note.isContentAvailable() && this.noteContext?.viewScope?.viewMode === "default";
    }

    doRender() {
        this.$widget = $(TPL);
        this.contentSized();
        this.$display = this.$widget.find(".mermaid-render");
        this.$errorContainer = this.$widget.find(".mermaid-error");
        this.$errorMessage = this.$errorContainer.find(".error-content");
    }

    async refreshWithNote(note: FNote) {
        const isSameNote = (this.lastNote === note);

        this.cleanup();
        this.$errorContainer.hide();

        await libraryLoader.requireLibrary(libraryLoader.MERMAID);

        mermaid.mermaidAPI.initialize({
            startOnLoad: false,
            ...(getMermaidConfig() as any)
        });

        if (!isSameNote) {
            this.$display.empty();
        }

        this.$errorContainer.hide();

        try {
            const svg = await this.renderSvg();

            if (this.dirtyAttachment) {
                const payload = {
                    role: "image",
                    title: "mermaid-export.svg",
                    mime: "image/svg+xml",
                    content: svg,
                    position: 0
                };

                server.post(`notes/${this.noteId}/attachments?matchBy=title`, payload).then(() => {
                    this.dirtyAttachment = false;
                });
            }

            this.$display.html(svg);
            this.$display.attr("id", `mermaid-render-${idCounter}`);

            // Fit the image to bounds.
            const $svg = this.$display.find("svg");
            $svg.attr("width", "100%").attr("height", "100%");

            // Enable pan to zoom.
            this.#setupPanZoom($svg[0], isSameNote);
        } catch (e: any) {
            console.warn(e);
            this.#cleanUpZoom();
            this.$display.empty();
            this.$errorMessage.text(e.message);
            this.$errorContainer.show();
        }

        this.lastNote = note;
    }

    cleanup() {
        super.cleanup();
        if (this.zoomHandler) {
            $(window).off("resize", this.zoomHandler);
            this.zoomHandler = undefined;
        }
    }

    #cleanUpZoom() {
        if (this.zoomInstance) {
            this.zoomInstance.destroy();
            this.zoomInstance = undefined;
        }
    }

    toggleInt(show: boolean | null | undefined): void {
        super.toggleInt(show);

        if (!show) {
            this.cleanup();
        }
    }

    async renderSvg() {
        idCounter++;

        if (!this.note) {
            return "";
        }

        const blob = await this.note.getBlob();
        const content = blob?.content || "";

        await loadElkIfNeeded(content);
        const { svg } = await mermaid.mermaidAPI.render(`mermaid-graph-${idCounter}`, content);
        return postprocessMermaidSvg(svg);
    }

    async #setupPanZoom(svgEl: SVGElement, isSameNote: boolean) {
        // Clean up
        let pan = null;
        let zoom = null;
        if (this.zoomInstance) {
            // Store pan and zoom for same note, when the user is editing the note.
            if (isSameNote && this.zoomInstance) {
                pan = this.zoomInstance.getPan();
                zoom = this.zoomInstance.getZoom();
            }
            this.#cleanUpZoom();
        }

        const svgPanZoom = (await import("svg-pan-zoom")).default;
        const zoomInstance = svgPanZoom(svgEl, {
            zoomEnabled: true,
            controlIconsEnabled: true
        });

        if (pan && zoom) {
            // Restore the pan and zoom.
            zoomInstance.zoom(zoom);
            zoomInstance.pan(pan);
        } else {
            // New instance, reposition properly.
            zoomInstance.center();
            zoomInstance.fit();
        }

        this.zoomHandler = () => {
            zoomInstance.resize();
            zoomInstance.fit();
            zoomInstance.center();
        };
        this.zoomInstance = zoomInstance;
        $(window).on("resize", this.zoomHandler);
    }

    async entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (this.noteId && loadResults.isNoteContentReloaded(this.noteId)) {
            this.dirtyAttachment = true;

            await this.refresh();
        }
    }

    async exportSvgEvent({ ntxId }: EventData<"exportSvg">) {
        if (!this.isNoteContext(ntxId) || this.note?.type !== "mermaid") {
            return;
        }

        const svg = await this.renderSvg();
        utils.downloadSvg(this.note.title, svg);
    }
}

export function getMermaidConfig(): MermaidConfig {
    const documentStyle = window.getComputedStyle(document.documentElement);
    const mermaidTheme = documentStyle.getPropertyValue("--mermaid-theme");

    return {
        theme: mermaidTheme.trim(),
        securityLevel: "antiscript",
        // TODO: Are all these options correct?
        flow: { useMaxWidth: false },
        sequence: { useMaxWidth: false },
        gantt: { useMaxWidth: false },
        class: { useMaxWidth: false },
        state: { useMaxWidth: false },
        pie: { useMaxWidth: true },
        journey: { useMaxWidth: false },
        git: { useMaxWidth: false }
    };
}
