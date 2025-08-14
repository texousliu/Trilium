/**
 * Base class for widgets that display images with zoom, pan, and lightbox functionality.
 * Provides shared image viewing logic to avoid code duplication.
 */
import TypeWidget from "./type_widget.js";
import mediaViewer from "../../services/media_viewer.js";
import type { MediaItem, MediaViewerCallbacks } from "../../services/media_viewer.js";
import imageContextMenuService from "../../menus/image_context_menu.js";
import galleryManager from "../../services/gallery_manager.js";
import type { GalleryItem, GalleryConfig } from "../../services/gallery_manager.js";

export interface ImageViewerConfig {
    minZoom?: number;
    maxZoom?: number;
    zoomStep?: number;
    debounceDelay?: number;
    touchTargetSize?: number;
}

export abstract class ImageViewerBase extends TypeWidget {
    // Configuration
    protected config: Required<ImageViewerConfig> = {
        minZoom: 0.5,
        maxZoom: 5,
        zoomStep: 0.25,
        debounceDelay: 16, // ~60fps
        touchTargetSize: 44 // WCAG recommended minimum
    };

    // State
    protected currentZoom: number = 1;
    protected isDragging: boolean = false;
    protected startX: number = 0;
    protected startY: number = 0;
    protected scrollLeft: number = 0;
    protected scrollTop: number = 0;
    protected isPhotoSwipeAvailable: boolean = false;
    protected isLoadingImage: boolean = false;
    protected galleryItems: GalleryItem[] = [];
    protected currentImageIndex: number = 0;

    // Elements
    protected $imageWrapper?: JQuery<HTMLElement>;
    protected $imageView?: JQuery<HTMLElement>;
    protected $zoomIndicator?: JQuery<HTMLElement>;
    protected $loadingIndicator?: JQuery<HTMLElement>;

    // Event handler references for cleanup
    private boundHandlers: Map<string, Function> = new Map();
    private rafId: number | null = null;
    private zoomDebounceTimer: number | null = null;

    constructor() {
        super();
        this.verifyPhotoSwipe();
    }

    /**
     * Verify PhotoSwipe is available
     */
    protected verifyPhotoSwipe(): void {
        try {
            // Check if PhotoSwipe is loaded
            if (typeof mediaViewer !== 'undefined' && mediaViewer) {
                this.isPhotoSwipeAvailable = true;
            } else {
                console.warn("PhotoSwipe/mediaViewer not available, lightbox features disabled");
                this.isPhotoSwipeAvailable = false;
            }
        } catch (error) {
            console.error("Error checking PhotoSwipe availability:", error);
            this.isPhotoSwipeAvailable = false;
        }
    }

    /**
     * Apply configuration overrides
     */
    protected applyConfig(overrides?: ImageViewerConfig): void {
        if (overrides) {
            this.config = { ...this.config, ...overrides };
        }
    }

    /**
     * Show loading indicator
     */
    protected showLoadingIndicator(): void {
        if (!this.$loadingIndicator) {
            this.$loadingIndicator = $('<div class="image-loading-indicator">')
                .html('<div class="spinner-border spinner-border-sm" role="status"><span class="sr-only">Loading...</span></div>')
                .css({
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 100
                });
        }
        this.$imageWrapper?.append(this.$loadingIndicator);
        this.isLoadingImage = true;
    }

    /**
     * Hide loading indicator
     */
    protected hideLoadingIndicator(): void {
        this.$loadingIndicator?.remove();
        this.isLoadingImage = false;
    }

    /**
     * Setup image with loading state and error handling
     */
    protected async setupImage(src: string, $image: JQuery<HTMLElement>): Promise<void> {
        if (!$image || !$image.length) {
            console.error("Image element not provided");
            return;
        }

        this.showLoadingIndicator();

        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.hideLoadingIndicator();
                $image.attr('src', src);
                
                // Preload dimensions for PhotoSwipe if available
                if (this.isPhotoSwipeAvailable) {
                    this.preloadImageDimensions(src).catch(console.warn);
                }
                
                resolve();
            };
            
            img.onerror = (error) => {
                this.hideLoadingIndicator();
                console.error("Failed to load image:", error);
                this.showErrorMessage("Failed to load image");
                reject(new Error("Failed to load image"));
            };
            
            img.src = src;
        });
    }

    /**
     * Show error message to user
     */
    protected showErrorMessage(message: string): void {
        const $error = $('<div class="alert alert-danger">')
            .text(message)
            .css({
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: '80%'
            });
        
        this.$imageWrapper?.empty().append($error);
    }

    /**
     * Preload image dimensions for PhotoSwipe
     */
    protected async preloadImageDimensions(src: string): Promise<void> {
        if (!this.isPhotoSwipeAvailable) return;
        
        try {
            await mediaViewer.getImageDimensions(src);
        } catch (error) {
            console.warn("Failed to preload image dimensions:", error);
        }
    }

    /**
     * Detect and collect gallery items from the current context
     */
    protected async detectGalleryItems(): Promise<GalleryItem[]> {
        // Default implementation - can be overridden by subclasses
        if (this.note && this.note.type === 'text') {
            // For text notes, scan for all images
            return await galleryManager.createGalleryFromNote(this.note);
        }
        
        // For single image notes, return just the current image
        const src = this.$imageView?.attr('src') || this.$imageView?.prop('src');
        if (src) {
            return [{
                src: src,
                alt: this.note?.title || 'Image',
                title: this.note?.title,
                noteId: this.noteId,
                index: 0
            }];
        }
        
        return [];
    }

    /**
     * Open image in lightbox with gallery support
     */
    protected async openInLightbox(src: string, title?: string, noteId?: string, element?: HTMLElement): Promise<void> {
        if (!this.isPhotoSwipeAvailable) {
            console.warn("PhotoSwipe not available, cannot open lightbox");
            // Fallback: open image in new tab
            window.open(src, '_blank');
            return;
        }

        if (!src) {
            console.error("No image source provided for lightbox");
            return;
        }

        try {
            // Detect if we should open as a gallery
            if (this.galleryItems.length === 0) {
                this.galleryItems = await this.detectGalleryItems();
            }
            
            // Find the index of the current image in the gallery
            let startIndex = 0;
            if (this.galleryItems.length > 1) {
                startIndex = this.galleryItems.findIndex(item => item.src === src);
                if (startIndex === -1) startIndex = 0;
            }
            
            // Open as gallery if multiple items, otherwise single image
            if (this.galleryItems.length > 1) {
                // Open gallery with all images
                const galleryConfig: GalleryConfig = {
                    showThumbnails: true,
                    thumbnailHeight: 80,
                    autoPlay: false,
                    slideInterval: 4000,
                    showCounter: true,
                    enableKeyboardNav: true,
                    enableSwipeGestures: true,
                    preloadCount: 2,
                    loop: true
                };
                
                const callbacks: MediaViewerCallbacks = {
                    onOpen: () => {
                        console.log("Gallery opened with", this.galleryItems.length, "images");
                    },
                    onClose: () => {
                        console.log("Gallery closed");
                        // Restore focus to the image element
                        element?.focus();
                    },
                    onChange: (index) => {
                        console.log("Gallery slide changed to:", index);
                        this.currentImageIndex = index;
                    },
                    onImageLoad: (index, mediaItem) => {
                        console.log("Gallery image loaded:", mediaItem.title);
                    },
                    onImageError: (index, mediaItem, error) => {
                        console.error("Failed to load gallery image:", error);
                    }
                };
                
                galleryManager.openGallery(this.galleryItems, startIndex, galleryConfig, callbacks);
            } else {
                // Open single image
                const item: MediaItem = {
                    src: src,
                    alt: title || "Image",
                    title: title,
                    noteId: noteId,
                    element: element
                };

            const callbacks: MediaViewerCallbacks = {
                onOpen: () => {
                    console.log("Image lightbox opened");
                },
                onClose: () => {
                    console.log("Image lightbox closed");
                    // Restore focus to the image element
                    element?.focus();
                },
                onImageLoad: (index, mediaItem) => {
                    console.log("Image loaded in lightbox:", mediaItem.title);
                },
                onImageError: (index, mediaItem, error) => {
                    console.error("Failed to load image in lightbox:", error);
                }
            };

                // Open with enhanced configuration
                mediaViewer.openSingle(item, {
                bgOpacity: 0.95,
                showHideOpacity: true,
                pinchToClose: true,
                closeOnScroll: false,
                closeOnVerticalDrag: true,
                wheelToZoom: true,
                arrowKeys: false,
                loop: false,
                maxSpreadZoom: 10,
                getThumbBoundsFn: (index: number) => {
                    // Get position of thumbnail for zoom animation
                    if (element) {
                        const rect = element.getBoundingClientRect();
                        return {
                            x: rect.left,
                            y: rect.top,
                            w: rect.width
                        };
                    }
                    return undefined;
                }
                }, callbacks);
            }
        } catch (error) {
            console.error("Failed to open lightbox:", error);
            // Fallback: open image in new tab
            window.open(src, '_blank');
        }
    }

    /**
     * Zoom in with debouncing
     */
    protected zoomIn(): void {
        if (this.zoomDebounceTimer) {
            clearTimeout(this.zoomDebounceTimer);
        }
        
        this.zoomDebounceTimer = window.setTimeout(() => {
            this.currentZoom = Math.min(this.currentZoom + this.config.zoomStep, this.config.maxZoom);
            this.applyZoom();
        }, this.config.debounceDelay);
    }

    /**
     * Zoom out with debouncing
     */
    protected zoomOut(): void {
        if (this.zoomDebounceTimer) {
            clearTimeout(this.zoomDebounceTimer);
        }
        
        this.zoomDebounceTimer = window.setTimeout(() => {
            this.currentZoom = Math.max(this.currentZoom - this.config.zoomStep, this.config.minZoom);
            this.applyZoom();
        }, this.config.debounceDelay);
    }

    /**
     * Reset zoom to 100%
     */
    protected resetZoom(): void {
        this.currentZoom = 1;
        this.applyZoom();
        
        if (this.$imageWrapper?.length) {
            this.$imageWrapper.scrollLeft(0).scrollTop(0);
        }
    }

    /**
     * Apply zoom with requestAnimationFrame for smooth performance
     */
    protected applyZoom(): void {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        
        this.rafId = requestAnimationFrame(() => {
            if (!this.$imageView?.length) return;
            
            this.$imageView.css({
                transform: `scale(${this.currentZoom})`,
                transformOrigin: 'center center'
            });
            
            // Update zoom indicator
            this.updateZoomIndicator();
            
            // Update button states
            this.updateZoomButtonStates();
            
            // Update cursor based on zoom level
            if (this.currentZoom > 1) {
                this.$imageView.css('cursor', 'move');
            } else {
                this.$imageView.css('cursor', 'zoom-in');
            }
        });
    }

    /**
     * Update zoom percentage indicator
     */
    protected updateZoomIndicator(): void {
        const percentage = Math.round(this.currentZoom * 100);
        
        if (!this.$zoomIndicator) {
            this.$zoomIndicator = $('<div class="zoom-indicator">')
                .css({
                    position: 'absolute',
                    bottom: '60px',
                    right: '20px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    zIndex: 10
                })
                .attr('aria-live', 'polite')
                .attr('aria-label', 'Zoom level');
            
            this.$widget?.append(this.$zoomIndicator);
        }
        
        this.$zoomIndicator.text(`${percentage}%`);
        
        // Hide indicator after 2 seconds
        if (this.$zoomIndicator.data('hideTimer')) {
            clearTimeout(this.$zoomIndicator.data('hideTimer'));
        }
        
        this.$zoomIndicator.show();
        const hideTimer = setTimeout(() => {
            this.$zoomIndicator?.fadeOut();
        }, 2000);
        
        this.$zoomIndicator.data('hideTimer', hideTimer);
    }

    /**
     * Update zoom button states
     */
    protected updateZoomButtonStates(): void {
        const $zoomInBtn = this.$widget?.find('.zoom-in, .image-control-btn.zoom-in');
        const $zoomOutBtn = this.$widget?.find('.zoom-out, .image-control-btn.zoom-out');
        
        if ($zoomInBtn?.length) {
            $zoomInBtn.prop('disabled', this.currentZoom >= this.config.maxZoom);
            $zoomInBtn.attr('aria-disabled', (this.currentZoom >= this.config.maxZoom).toString());
        }
        
        if ($zoomOutBtn?.length) {
            $zoomOutBtn.prop('disabled', this.currentZoom <= this.config.minZoom);
            $zoomOutBtn.attr('aria-disabled', (this.currentZoom <= this.config.minZoom).toString());
        }
    }

    /**
     * Setup pan functionality with proper event cleanup
     */
    protected setupPanFunctionality(): void {
        if (!this.$imageWrapper?.length) return;

        // Create bound handlers for cleanup
        const handleMouseDown = this.handleMouseDown.bind(this);
        const handleMouseMove = this.handleMouseMove.bind(this);
        const handleMouseUp = this.handleMouseUp.bind(this);
        const handleTouchStart = this.handleTouchStart.bind(this);
        const handleTouchMove = this.handleTouchMove.bind(this);
        const handlePinchZoom = this.handlePinchZoom.bind(this);

        // Store references for cleanup
        this.boundHandlers.set('mousedown', handleMouseDown);
        this.boundHandlers.set('mousemove', handleMouseMove);
        this.boundHandlers.set('mouseup', handleMouseUp);
        this.boundHandlers.set('touchstart', handleTouchStart);
        this.boundHandlers.set('touchmove', handleTouchMove);
        this.boundHandlers.set('pinchzoom', handlePinchZoom);

        // Mouse events
        this.$imageWrapper.on('mousedown', handleMouseDown);
        
        // Document-level mouse events (for dragging outside wrapper)
        $(document).on('mousemove', handleMouseMove);
        $(document).on('mouseup', handleMouseUp);

        // Touch events
        this.$imageWrapper.on('touchstart', handleTouchStart);
        this.$imageWrapper.on('touchmove', handleTouchMove);
        
        // Pinch zoom
        this.$imageWrapper.on('touchstart', handlePinchZoom);
        this.$imageWrapper.on('touchmove', handlePinchZoom);
    }

    private handleMouseDown(e: JQuery.MouseDownEvent): void {
        if (this.currentZoom <= 1 || !this.$imageWrapper) return;
        
        this.isDragging = true;
        
        const offset = this.$imageWrapper.offset();
        if (offset) {
            this.startX = e.pageX - offset.left;
            this.startY = e.pageY - offset.top;
        }
        
        this.scrollLeft = this.$imageWrapper.scrollLeft() ?? 0;
        this.scrollTop = this.$imageWrapper.scrollTop() ?? 0;
        
        this.$imageWrapper.css('cursor', 'grabbing');
        e.preventDefault();
    }

    private handleMouseMove(e: JQuery.MouseMoveEvent): void {
        if (!this.isDragging || !this.$imageWrapper) return;
        
        e.preventDefault();
        
        const offset = this.$imageWrapper.offset();
        if (offset) {
            const x = e.pageX - offset.left;
            const y = e.pageY - offset.top;
            const walkX = (x - this.startX) * 2;
            const walkY = (y - this.startY) * 2;
            
            this.$imageWrapper.scrollLeft(this.scrollLeft - walkX);
            this.$imageWrapper.scrollTop(this.scrollTop - walkY);
        }
    }

    private handleMouseUp(): void {
        if (this.isDragging) {
            this.isDragging = false;
            if (this.currentZoom > 1 && this.$imageWrapper) {
                this.$imageWrapper.css('cursor', 'move');
            }
        }
    }

    private handleTouchStart(e: JQuery.TouchStartEvent): void {
        if (this.currentZoom <= 1 || !this.$imageWrapper) return;
        
        const touch = e.originalEvent?.touches[0];
        if (touch) {
            this.startX = touch.clientX;
            this.startY = touch.clientY;
            this.scrollLeft = this.$imageWrapper.scrollLeft() ?? 0;
            this.scrollTop = this.$imageWrapper.scrollTop() ?? 0;
        }
    }

    private handleTouchMove(e: JQuery.TouchMoveEvent): void {
        if (this.currentZoom <= 1 || !this.$imageWrapper) return;
        
        const touches = e.originalEvent?.touches;
        if (touches && touches.length === 1) {
            e.preventDefault();
            const touch = touches[0];
            const deltaX = this.startX - touch.clientX;
            const deltaY = this.startY - touch.clientY;
            
            this.$imageWrapper.scrollLeft(this.scrollLeft + deltaX);
            this.$imageWrapper.scrollTop(this.scrollTop + deltaY);
        }
    }

    private initialDistance: number = 0;
    private initialZoom: number = 1;

    private handlePinchZoom(e: JQuery.TriggeredEvent): void {
        const touches = e.originalEvent?.touches;
        if (!touches || touches.length !== 2) return;

        if (e.type === 'touchstart') {
            this.initialDistance = Math.hypot(
                touches[0].clientX - touches[1].clientX,
                touches[0].clientY - touches[1].clientY
            );
            this.initialZoom = this.currentZoom;
        } else if (e.type === 'touchmove') {
            e.preventDefault();
            
            const distance = Math.hypot(
                touches[0].clientX - touches[1].clientX,
                touches[0].clientY - touches[1].clientY
            );
            
            const scale = distance / this.initialDistance;
            this.currentZoom = Math.min(Math.max(this.initialZoom * scale, this.config.minZoom), this.config.maxZoom);
            this.applyZoom();
        }
    }

    /**
     * Setup keyboard navigation with focus check
     */
    protected setupKeyboardNavigation(): void {
        if (!this.$widget?.length) return;

        // Make widget focusable
        this.$widget.attr('tabindex', '0');
        this.$widget.attr('role', 'application');
        this.$widget.attr('aria-label', 'Image viewer with zoom controls');
        
        const handleKeyDown = (e: JQuery.KeyDownEvent) => {
            // Only handle keyboard events when widget has focus
            if (!this.$widget?.is(':focus-within')) {
                return;
            }
            
            switch(e.key) {
                case '+':
                case '=':
                    e.preventDefault();
                    e.stopPropagation();
                    this.zoomIn();
                    break;
                case '-':
                case '_':
                    e.preventDefault();
                    e.stopPropagation();
                    this.zoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    e.stopPropagation();
                    this.resetZoom();
                    break;
                case 'Enter':
                case ' ':
                    if (this.isPhotoSwipeAvailable && this.$imageView?.length) {
                        e.preventDefault();
                        e.stopPropagation();
                        const src = this.$imageView.attr('src') || this.$imageView.prop('src');
                        if (src) {
                            this.openInLightbox(src, this.note?.title, this.noteId, this.$imageView.get(0));
                        }
                    }
                    break;
                case 'Escape':
                    if (this.isPhotoSwipeAvailable && mediaViewer.isOpen()) {
                        e.preventDefault();
                        e.stopPropagation();
                        mediaViewer.close();
                    }
                    break;
                case 'ArrowLeft':
                    if (this.currentZoom > 1 && this.$imageWrapper) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.$imageWrapper.scrollLeft((this.$imageWrapper.scrollLeft() ?? 0) - 50);
                    }
                    break;
                case 'ArrowRight':
                    if (this.currentZoom > 1 && this.$imageWrapper) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.$imageWrapper.scrollLeft((this.$imageWrapper.scrollLeft() ?? 0) + 50);
                    }
                    break;
                case 'ArrowUp':
                    if (this.currentZoom > 1 && this.$imageWrapper) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.$imageWrapper.scrollTop((this.$imageWrapper.scrollTop() ?? 0) - 50);
                    }
                    break;
                case 'ArrowDown':
                    if (this.currentZoom > 1 && this.$imageWrapper) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.$imageWrapper.scrollTop((this.$imageWrapper.scrollTop() ?? 0) + 50);
                    }
                    break;
            }
        };

        this.boundHandlers.set('keydown', handleKeyDown);
        this.$widget.on('keydown', handleKeyDown);
    }

    /**
     * Refresh gallery items when content changes
     */
    protected async refreshGalleryItems(): Promise<void> {
        this.galleryItems = await this.detectGalleryItems();
        this.currentImageIndex = 0;
    }

    /**
     * Setup double-click to reset zoom
     */
    protected setupDoubleClickReset(): void {
        if (!this.$imageView?.length) return;

        this.$imageView.on('dblclick', (e) => {
            e.preventDefault();
            this.resetZoom();
        });
    }

    /**
     * Setup context menu for image
     */
    protected setupContextMenu(): void {
        if (this.$imageView?.length) {
            imageContextMenuService.setupContextMenu(this.$imageView);
        }
    }

    /**
     * Add ARIA labels for accessibility
     */
    protected addAccessibilityLabels(): void {
        // Add ARIA labels to control buttons
        this.$widget?.find('.zoom-in, .image-control-btn.zoom-in')
            .attr('aria-label', 'Zoom in')
            .attr('role', 'button');
        
        this.$widget?.find('.zoom-out, .image-control-btn.zoom-out')
            .attr('aria-label', 'Zoom out')
            .attr('role', 'button');
        
        this.$widget?.find('.fullscreen, .image-control-btn.fullscreen')
            .attr('aria-label', 'Open in fullscreen lightbox')
            .attr('role', 'button');
        
        this.$widget?.find('.download, .image-control-btn.download')
            .attr('aria-label', 'Download image')
            .attr('role', 'button');
        
        // Add alt text to image
        if (this.$imageView?.length && this.note?.title) {
            this.$imageView.attr('alt', this.note.title);
        }
    }

    /**
     * Cleanup all event handlers and resources
     */
    cleanup() {
        // Close gallery or lightbox if open
        if (this.isPhotoSwipeAvailable) {
            if (galleryManager.isGalleryOpen()) {
                galleryManager.closeGallery();
            } else if (mediaViewer.isOpen()) {
                mediaViewer.close();
            }
        }
        
        // Clear gallery items
        this.galleryItems = [];
        this.currentImageIndex = 0;
        
        // Remove document-level event listeners
        if (this.boundHandlers.has('mousemove')) {
            $(document).off('mousemove', this.boundHandlers.get('mousemove') as any);
        }
        if (this.boundHandlers.has('mouseup')) {
            $(document).off('mouseup', this.boundHandlers.get('mouseup') as any);
        }
        
        // Clear all bound handlers
        this.boundHandlers.clear();
        
        // Cancel any pending animations
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        // Clear zoom debounce timer
        if (this.zoomDebounceTimer) {
            clearTimeout(this.zoomDebounceTimer);
            this.zoomDebounceTimer = null;
        }
        
        // Clear zoom indicator timer
        if (this.$zoomIndicator?.data('hideTimer')) {
            clearTimeout(this.$zoomIndicator.data('hideTimer'));
        }
        
        super.cleanup();
    }
}

export default ImageViewerBase;