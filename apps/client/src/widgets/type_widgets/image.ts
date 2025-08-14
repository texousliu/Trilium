import utils from "../../services/utils.js";
import { ImageViewerBase } from "./image_viewer_base.js";
import imageService from "../../services/image.js";
import type FNote from "../../entities/fnote.js";
import type { EventData } from "../../components/app_context.js";

const TPL = /*html*/`
<div class="note-detail-image note-detail-printable">
    <style>
        .type-image .note-detail {
            height: 100%;
        }

        .note-detail-image {
            height: 100%;
            position: relative;
        }

        .note-detail-image-wrapper {
            position: relative;
            display: flex;
            align-items: center;
            overflow: hidden;
            justify-content: center;
            height: 100%;
        }

        .note-detail-image-view {
            display: block;
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            align-self: center;
            flex-shrink: 0;
            cursor: zoom-in;
            transition: opacity 0.2s ease;
        }

        .note-detail-image-view:hover {
            opacity: 0.95;
        }

        .image-controls {
            position: absolute;
            bottom: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 10;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 8px;
            padding: 8px;
        }

        .image-control-btn {
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

        .image-control-btn:hover:not(:disabled) {
            background: rgba(255, 255, 255, 1);
        }

        .image-control-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .image-control-btn i {
            font-size: 20px;
            color: #333;
        }

        /* Keyboard hints overlay */
        .keyboard-hints {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
            z-index: 10;
        }

        .note-detail-image:hover .keyboard-hints {
            opacity: 0.8;
        }

        .keyboard-hints .hint {
            margin: 2px 0;
        }

        .keyboard-hints .key {
            background: rgba(255, 255, 255, 0.2);
            padding: 2px 6px;
            border-radius: 3px;
            margin-right: 4px;
            font-family: monospace;
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
            .image-controls {
                bottom: 10px;
                right: 10px;
                padding: 6px;
                gap: 8px;
            }

            .keyboard-hints {
                display: none;
            }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
            .image-control-btn {
                border: 2px solid currentColor;
            }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
            .note-detail-image-view,
            .image-control-btn {
                transition: none;
            }
        }
    </style>

    <div class="note-detail-image-wrapper">
        <img class="note-detail-image-view" />
    </div>
    
    <div class="image-controls">
        <button class="image-control-btn zoom-in" type="button" aria-label="Zoom In" title="Zoom In (+ key)">
            <i class="bx bx-zoom-in" aria-hidden="true"></i>
        </button>
        <button class="image-control-btn zoom-out" type="button" aria-label="Zoom Out" title="Zoom Out (- key)">
            <i class="bx bx-zoom-out" aria-hidden="true"></i>
        </button>
        <button class="image-control-btn reset-zoom" type="button" aria-label="Reset Zoom" title="Reset Zoom (0 key or double-click)">
            <i class="bx bx-reset" aria-hidden="true"></i>
        </button>
        <button class="image-control-btn fullscreen" type="button" aria-label="Fullscreen" title="Fullscreen (Enter or Space key)">
            <i class="bx bx-fullscreen" aria-hidden="true"></i>
        </button>
        <button class="image-control-btn download" type="button" aria-label="Download" title="Download Image">
            <i class="bx bx-download" aria-hidden="true"></i>
        </button>
    </div>
    
    <div class="keyboard-hints" aria-hidden="true">
        <div class="hint"><span class="key">Click</span> Open lightbox</div>
        <div class="hint"><span class="key">Double-click</span> Reset zoom</div>
        <div class="hint"><span class="key">Scroll</span> Zoom</div>
        <div class="hint"><span class="key">+/-</span> Zoom in/out</div>
        <div class="hint"><span class="key">0</span> Reset zoom</div>
        <div class="hint"><span class="key">ESC</span> Close lightbox</div>
        <div class="hint"><span class="key">Arrow keys</span> Pan (when zoomed)</div>
    </div>
</div>`;

class ImageTypeWidget extends ImageViewerBase {
    private $zoomInBtn!: JQuery<HTMLElement>;
    private $zoomOutBtn!: JQuery<HTMLElement>;
    private $resetZoomBtn!: JQuery<HTMLElement>;
    private $fullscreenBtn!: JQuery<HTMLElement>;
    private $downloadBtn!: JQuery<HTMLElement>;
    private wheelHandler?: (e: JQuery.TriggeredEvent) => void;

    static getType() {
        return "image";
    }

    constructor() {
        super();
        // Apply custom configuration if needed
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
        this.$imageWrapper = this.$widget.find(".note-detail-image-wrapper");
        this.$imageView = this.$widget.find(".note-detail-image-view");
        
        // Generate unique ID for image element
        const imageId = `image-view-${utils.randomString(10)}`;
        this.$imageView.attr("id", imageId);
        
        // Get control buttons
        this.$zoomInBtn = this.$widget.find(".zoom-in");
        this.$zoomOutBtn = this.$widget.find(".zoom-out");
        this.$resetZoomBtn = this.$widget.find(".reset-zoom");
        this.$fullscreenBtn = this.$widget.find(".fullscreen");
        this.$downloadBtn = this.$widget.find(".download");

        this.setupEventHandlers();
        this.setupPanFunctionality();
        this.setupKeyboardNavigation();
        this.setupDoubleClickReset();
        this.setupContextMenu();
        this.addAccessibilityLabels();

        super.doRender();
    }

    private setupEventHandlers(): void {
        // Image click to open lightbox
        this.$imageView?.on("click", async (e) => {
            e.preventDefault();
            await this.handleOpenLightbox();
        });

        // Control button handlers
        this.$zoomInBtn?.on("click", () => this.zoomIn());
        this.$zoomOutBtn?.on("click", () => this.zoomOut());
        this.$resetZoomBtn?.on("click", () => this.resetZoom());
        this.$fullscreenBtn?.on("click", async () => await this.handleOpenLightbox());
        this.$downloadBtn?.on("click", () => this.downloadImage());

        // Mouse wheel zoom with debouncing
        this.wheelHandler = (e: JQuery.TriggeredEvent) => {
            // Only handle if widget has focus
            if (!this.$widget?.is(':focus-within')) {
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

        this.$imageWrapper?.on("wheel", this.wheelHandler);
    }

    private async handleOpenLightbox(): Promise<void> {
        if (!this.$imageView?.length) return;
        
        const src = this.$imageView.attr('src') || this.$imageView.prop('src');
        if (!src) return;

        await this.openInLightbox(
            src,
            this.note?.title,
            this.noteId,
            this.$imageView.get(0)
        );
    }

    async doRefresh(note: FNote) {
        const src = utils.createImageSrcUrl(note);
        
        // Reset zoom when image changes
        this.resetZoom();
        
        // Refresh gallery items when note changes
        await this.refreshGalleryItems();
        
        // Setup image with loading state and error handling
        try {
            await this.setupImage(src, this.$imageView!);
        } catch (error) {
            console.error("Failed to load image:", error);
            // Error message is already shown by setupImage
        }
    }

    private downloadImage(): void {
        if (!this.note) return;
        
        try {
            const link = document.createElement('a');
            link.href = utils.createImageSrcUrl(this.note);
            link.download = this.note.title || 'image';
            
            // Add to document, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to download image:", error);
            alert("Failed to download image. Please try again.");
        }
    }

    copyImageReferenceToClipboardEvent({ ntxId }: EventData<"copyImageReferenceToClipboard">) {
        if (!this.isNoteContext(ntxId)) {
            return;
        }

        if (this.$imageWrapper?.length) {
            imageService.copyImageReferenceToClipboard(this.$imageWrapper);
        }
    }

    async entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.isNoteReloaded(this.noteId)) {
            await this.refresh();
        }
    }

    cleanup() {
        // Remove wheel handler if it exists
        if (this.wheelHandler && this.$imageWrapper?.length) {
            this.$imageWrapper.off("wheel", this.wheelHandler);
        }
        
        // Call parent cleanup
        super.cleanup();
    }
}

export default ImageTypeWidget;