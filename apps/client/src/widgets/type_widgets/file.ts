import openService from "../../services/open.js";
import { ImageViewerBase } from "./image_viewer_base.js";
import { t } from "../../services/i18n.js";
import type { EventData } from "../../components/app_context.js";
import type FNote from "../../entities/fnote.js";

const TEXT_MAX_NUM_CHARS = 5000;

const TPL = /*html*/`
<div class="note-detail-file note-detail-printable">
    <style>
        .type-file .note-detail {
            height: 100%;
        }

        .note-detail-file {
            padding: 10px;
            height: 100%;
        }

        .note-split.full-content-width .note-detail-file {
            padding: 0;
        }

        .note-detail.full-height .note-detail-file[data-preview-type="pdf"],
        .note-detail.full-height .note-detail-file[data-preview-type="video"],
        .note-detail.full-height .note-detail-file[data-preview-type="image"] {
            overflow: hidden;
        }

        .file-preview-content {
            background-color: var(--accented-background-color);
            padding: 15px;
            height: 100%;
            overflow: auto;
            margin: 10px;
        }

        .note-detail-file > .video-preview {
            width: 100%;
            height: 100%;
        }

        .image-file-preview {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            position: relative;
            overflow: hidden;
        }

        .image-file-view {
            max-width: 100%;
            max-height: 90%;
            cursor: zoom-in;
            transition: opacity 0.2s ease;
        }

        .image-file-view:hover {
            opacity: 0.95;
        }

        .image-file-controls {
            position: absolute;
            bottom: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 8px;
            padding: 8px;
            z-index: 10;
        }

        .image-file-control-btn {
            background: rgba(255, 255, 255, 0.9);
            border: none;
            border-radius: 4px;
            min-width: 44px;
            min-height: 44px;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s;
        }

        .image-file-control-btn:hover:not(:disabled) {
            background: rgba(255, 255, 255, 1);
        }

        .image-file-control-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .image-file-control-btn i {
            font-size: 20px;
            color: #333;
        }

        .image-file-info {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10;
        }

        /* Loading indicator */
        .image-loading-indicator {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 100;
        }

        /* Zoom indicator */
        .zoom-indicator {
            position: absolute;
            bottom: 80px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10;
            pointer-events: none;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
            .image-file-controls {
                bottom: 10px;
                right: 10px;
                padding: 6px;
                gap: 8px;
            }

            .image-file-info {
                font-size: 11px;
                padding: 6px 10px;
            }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
            .image-file-control-btn {
                border: 2px solid currentColor;
            }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
            .image-file-view,
            .image-file-control-btn {
                transition: none;
            }
        }
    </style>

    <div class="file-preview-too-big alert alert-info hidden-ext">
        ${t("file.too_big", { maxNumChars: TEXT_MAX_NUM_CHARS })}
    </div>

    <pre class="file-preview-content"></pre>

    <div class="file-preview-not-available alert alert-info">
        ${t("file.file_preview_not_available")}
    </div>

    <iframe class="pdf-preview" style="width: 100%; height: 100%; flex-grow: 100;"></iframe>

    <video class="video-preview" controls></video>

    <audio class="audio-preview" controls></audio>

    <div class="image-file-preview" style="display: none;">
        <div class="image-file-info">
            <span class="image-dimensions"></span>
        </div>
        <img class="image-file-view" />
        <div class="image-file-controls">
            <button class="image-file-control-btn zoom-in" type="button" aria-label="Zoom In" title="Zoom In (+ key)">
                <i class="bx bx-zoom-in" aria-hidden="true"></i>
            </button>
            <button class="image-file-control-btn zoom-out" type="button" aria-label="Zoom Out" title="Zoom Out (- key)">
                <i class="bx bx-zoom-out" aria-hidden="true"></i>
            </button>
            <button class="image-file-control-btn reset-zoom" type="button" aria-label="Reset Zoom" title="Reset Zoom (0 key or double-click)">
                <i class="bx bx-reset" aria-hidden="true"></i>
            </button>
            <button class="image-file-control-btn fullscreen" type="button" aria-label="Open in Lightbox" title="Open in Lightbox (Enter or Space key)">
                <i class="bx bx-fullscreen" aria-hidden="true"></i>
            </button>
            <button class="image-file-control-btn download" type="button" aria-label="Download" title="Download File">
                <i class="bx bx-download" aria-hidden="true"></i>
            </button>
        </div>
    </div>
</div>`;

export default class FileTypeWidget extends ImageViewerBase {
    private $previewContent!: JQuery<HTMLElement>;
    private $previewNotAvailable!: JQuery<HTMLElement>;
    private $previewTooBig!: JQuery<HTMLElement>;
    private $pdfPreview!: JQuery<HTMLElement>;
    private $videoPreview!: JQuery<HTMLElement>;
    private $audioPreview!: JQuery<HTMLElement>;
    private $imageFilePreview!: JQuery<HTMLElement>;
    private $imageFileView!: JQuery<HTMLElement>;
    private $imageDimensions!: JQuery<HTMLElement>;
    private $fullscreenBtn!: JQuery<HTMLElement>;
    private $downloadBtn!: JQuery<HTMLElement>;
    private $zoomInBtn!: JQuery<HTMLElement>;
    private $zoomOutBtn!: JQuery<HTMLElement>;
    private $resetZoomBtn!: JQuery<HTMLElement>;
    private wheelHandler?: (e: JQuery.TriggeredEvent) => void;
    private currentPreviewType?: string;

    static getType() {
        return "file";
    }

    constructor() {
        super();
        // Apply custom configuration for file viewer
        this.applyConfig({
            minZoom: 0.5,
            maxZoom: 5,
            zoomStep: 0.25,
            debounceDelay: 16,
            touchTargetSize: 44
        });
    }

    doRender() {
        this.$widget = $(TPL);
        this.$previewContent = this.$widget.find(".file-preview-content");
        this.$previewNotAvailable = this.$widget.find(".file-preview-not-available");
        this.$previewTooBig = this.$widget.find(".file-preview-too-big");
        this.$pdfPreview = this.$widget.find(".pdf-preview");
        this.$videoPreview = this.$widget.find(".video-preview");
        this.$audioPreview = this.$widget.find(".audio-preview");
        this.$imageFilePreview = this.$widget.find(".image-file-preview");
        this.$imageFileView = this.$widget.find(".image-file-view");
        this.$imageDimensions = this.$widget.find(".image-dimensions");
        
        // Image controls
        this.$zoomInBtn = this.$widget.find(".zoom-in");
        this.$zoomOutBtn = this.$widget.find(".zoom-out");
        this.$resetZoomBtn = this.$widget.find(".reset-zoom");
        this.$fullscreenBtn = this.$widget.find(".fullscreen");
        this.$downloadBtn = this.$widget.find(".download");

        // Set image wrapper and view for base class
        this.$imageWrapper = this.$imageFilePreview;
        this.$imageView = this.$imageFileView;

        this.setupImageControls();

        super.doRender();
    }

    private setupImageControls(): void {
        // Image click to open lightbox
        this.$imageFileView?.on("click", (e) => {
            e.preventDefault();
            this.openImageInLightbox();
        });

        // Control button handlers
        this.$zoomInBtn?.on("click", () => this.zoomIn());
        this.$zoomOutBtn?.on("click", () => this.zoomOut());
        this.$resetZoomBtn?.on("click", () => this.resetZoom());
        this.$fullscreenBtn?.on("click", () => this.openImageInLightbox());
        this.$downloadBtn?.on("click", () => this.downloadFile());

        // Mouse wheel zoom with focus check
        this.wheelHandler = (e: JQuery.TriggeredEvent) => {
            // Only handle if image preview is visible and has focus
            if (!this.$imageFilePreview?.is(':visible') || !this.$widget?.is(':focus-within')) {
                return;
            }

            e.preventDefault();
            const originalEvent = e.originalEvent as WheelEvent | undefined;
            const delta = originalEvent?.deltaY;
            
            if (delta) {
                if (delta < 0) {
                    this.zoomIn();
                } else {
                    this.zoomOut();
                }
            }
        };

        this.$imageFilePreview?.on("wheel", this.wheelHandler);
    }

    async doRefresh(note: FNote) {
        this.$widget?.show();

        const blob = await this.note?.getBlob();

        // Hide all preview types
        this.$previewContent?.empty().hide();
        this.$pdfPreview?.attr("src", "").empty().hide();
        this.$previewNotAvailable?.hide();
        this.$previewTooBig?.addClass("hidden-ext");
        this.$videoPreview?.hide();
        this.$audioPreview?.hide();
        this.$imageFilePreview?.hide();

        let previewType: string;

        // Check if this is an image file
        if (note.mime.startsWith("image/")) {
            this.$imageFilePreview?.show();
            const src = openService.getUrlForDownload(`api/notes/${this.noteId}/open`);
            
            // Reset zoom for new image
            this.resetZoom();
            
            // Setup pan, keyboard navigation, and other features
            this.setupPanFunctionality();
            this.setupKeyboardNavigation();
            this.setupDoubleClickReset();
            this.setupContextMenu();
            this.addAccessibilityLabels();
            
            // Load image with loading state and error handling
            try {
                await this.setupImage(src, this.$imageFileView!);
                await this.loadImageDimensions(src);
            } catch (error) {
                console.error("Failed to load image file:", error);
            }
            
            previewType = "image";
        } else if (blob?.content) {
            this.$previewContent?.show().scrollTop(0);
            const trimmedContent = blob.content.substring(0, TEXT_MAX_NUM_CHARS);
            if (trimmedContent.length !== blob.content.length) {
                this.$previewTooBig?.removeClass("hidden-ext");
            }
            this.$previewContent?.text(trimmedContent);
            previewType = "text";
        } else if (note.mime === "application/pdf") {
            this.$pdfPreview?.show().attr("src", openService.getUrlForDownload(`api/notes/${this.noteId}/open`));
            previewType = "pdf";
        } else if (note.mime.startsWith("video/")) {
            this.$videoPreview
                ?.show()
                .attr("src", openService.getUrlForDownload(`api/notes/${this.noteId}/open-partial`))
                .attr("type", this.note?.mime ?? "")
                .css("width", this.$widget?.width() ?? 0);
            previewType = "video";
        } else if (note.mime.startsWith("audio/")) {
            this.$audioPreview
                ?.show()
                .attr("src", openService.getUrlForDownload(`api/notes/${this.noteId}/open-partial`))
                .attr("type", this.note?.mime ?? "")
                .css("width", this.$widget?.width() ?? 0);
            previewType = "audio";
        } else {
            this.$previewNotAvailable?.show();
            previewType = "not-available";
        }

        this.currentPreviewType = previewType;
        this.$widget?.attr("data-preview-type", previewType ?? "");
    }

    private async loadImageDimensions(src: string): Promise<void> {
        try {
            // Use a new Image object to get dimensions
            const img = new Image();
            
            await new Promise<void>((resolve, reject) => {
                img.onload = () => {
                    this.$imageDimensions?.text(`${img.width} × ${img.height}px`);
                    resolve();
                };
                img.onerror = () => {
                    this.$imageDimensions?.text("Image");
                    reject(new Error("Failed to load image dimensions"));
                };
                img.src = src;
            });
        } catch (error) {
            console.warn("Failed to get image dimensions:", error);
            this.$imageDimensions?.text("Image");
        }
    }

    private openImageInLightbox(): void {
        if (!this.note || !this.$imageFileView?.length) return;
        
        const src = this.$imageFileView.attr("src") || this.$imageFileView.prop("src");
        if (!src) return;

        this.openInLightbox(
            src,
            this.note.title || "Image File",
            this.noteId,
            this.$imageFileView.get(0)
        );
    }

    private downloadFile(): void {
        if (!this.note) return;
        
        try {
            const link = document.createElement('a');
            link.href = openService.getUrlForDownload(`api/notes/${this.noteId}/open`);
            link.download = this.note.title || 'file';
            
            // Add to document, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to download file:", error);
            alert("Failed to download file. Please try again.");
        }
    }

    async entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.isNoteReloaded(this.noteId)) {
            await this.refresh();
        }
    }

    cleanup() {
        // Remove wheel handler if it exists
        if (this.wheelHandler && this.$imageFilePreview?.length) {
            this.$imageFilePreview.off("wheel", this.wheelHandler);
        }
        
        // Call parent cleanup
        super.cleanup();
    }
}