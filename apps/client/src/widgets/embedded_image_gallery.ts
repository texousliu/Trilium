/**
 * Embedded Image Gallery Widget
 * Handles image galleries within text notes and other content types
 */

import BasicWidget from "./basic_widget.js";
import galleryManager from "../services/gallery_manager.js";
import mediaViewer from "../services/media_viewer.js";
import type { GalleryItem, GalleryConfig } from "../services/gallery_manager.js";
import type { MediaViewerCallbacks } from "../services/media_viewer.js";
import utils from "../services/utils.js";

const TPL = /*html*/`
<style>
    .embedded-gallery-trigger {
        position: relative;
        display: inline-block;
        cursor: pointer;
        user-select: none;
    }
    
    .embedded-gallery-trigger::after {
        content: '';
        position: absolute;
        top: 8px;
        right: 8px;
        width: 32px;
        height: 32px;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
    }
    
    .embedded-gallery-trigger:hover::after {
        opacity: 1;
    }
    
    .embedded-gallery-trigger.has-gallery::after {
        content: '\\f0660'; /* Gallery icon from boxicons font */
        font-family: 'boxicons';
        color: white;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 32px;
        text-align: center;
    }
    
    .gallery-indicator {
        position: absolute;
        top: 8px;
        left: 8px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        pointer-events: none;
        z-index: 1;
    }
    
    .image-grid-view {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
        padding: 16px;
    }
    
    .image-grid-item {
        position: relative;
        aspect-ratio: 1;
        overflow: hidden;
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        background: var(--accented-background-color);
    }
    
    .image-grid-item:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    
    .image-grid-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .image-grid-caption {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
        color: white;
        padding: 8px;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.2s;
    }
    
    .image-grid-item:hover .image-grid-caption {
        opacity: 1;
    }
    
    /* Mobile optimizations */
    @media (max-width: 768px) {
        .image-grid-view {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 8px;
            padding: 8px;
        }
        
        .gallery-indicator {
            font-size: 10px;
            padding: 2px 4px;
        }
    }
</style>
`;

interface ImageElement {
    element: HTMLImageElement;
    src: string;
    alt?: string;
    title?: string;
    caption?: string;
    noteId?: string;
    index: number;
}

export default class EmbeddedImageGallery extends BasicWidget {
    private galleryItems: GalleryItem[] = [];
    private imageElements: Map<HTMLElement, ImageElement> = new Map();
    private observer?: MutationObserver;
    private processingQueue: Set<HTMLElement> = new Set();
    
    doRender(): JQuery<HTMLElement> {
        this.$widget = $(TPL);
        this.setupMutationObserver();
        return this.$widget;
    }
    
    /**
     * Initialize gallery for a container element
     */
    async initializeGallery(
        container: HTMLElement | JQuery<HTMLElement>,
        options?: {
            selector?: string;
            autoEnhance?: boolean;
            gridView?: boolean;
            galleryConfig?: GalleryConfig;
        }
    ): Promise<void> {
        const $container = $(container);
        const selector = options?.selector || 'img';
        const autoEnhance = options?.autoEnhance !== false;
        const gridView = options?.gridView || false;
        
        // Find all images in the container
        const images = $container.find(selector).toArray() as HTMLImageElement[];
        
        if (images.length === 0) {
            return;
        }
        
        // Create gallery items
        this.galleryItems = await this.createGalleryItems(images, $container);
        
        if (gridView) {
            // Create grid view
            this.createGridView($container, this.galleryItems);
        } else if (autoEnhance) {
            // Enhance individual images
            this.enhanceImages(images);
        }
    }
    
    /**
     * Create gallery items from image elements
     */
    private async createGalleryItems(
        images: HTMLImageElement[],
        $container: JQuery<HTMLElement>
    ): Promise<GalleryItem[]> {
        const items: GalleryItem[] = [];
        
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            
            // Skip already processed images
            if (img.dataset.galleryProcessed === 'true') {
                continue;
            }
            
            const item: GalleryItem = {
                src: img.src,
                alt: img.alt || `Image ${i + 1}`,
                title: img.title || img.alt,
                element: img,
                index: i,
                width: img.naturalWidth || undefined,
                height: img.naturalHeight || undefined
            };
            
            // Extract caption from figure element
            const $img = $(img);
            const $figure = $img.closest('figure');
            if ($figure.length) {
                const $caption = $figure.find('figcaption');
                if ($caption.length) {
                    item.caption = $caption.text();
                }
            }
            
            // Check for note ID in data attributes or URL
            item.noteId = this.extractNoteId(img);
            
            // Get dimensions if not available
            if (!item.width || !item.height) {
                try {
                    const dimensions = await mediaViewer.getImageDimensions(img.src);
                    item.width = dimensions.width;
                    item.height = dimensions.height;
                } catch (error) {
                    console.warn('Failed to get image dimensions:', error);
                }
            }
            
            items.push(item);
            
            // Store image element data
            this.imageElements.set(img, {
                element: img,
                src: img.src,
                alt: item.alt,
                title: item.title,
                caption: item.caption,
                noteId: item.noteId,
                index: i
            });
            
            // Mark as processed
            img.dataset.galleryProcessed = 'true';
        }
        
        return items;
    }
    
    /**
     * Enhance individual images with gallery functionality
     */
    private enhanceImages(images: HTMLImageElement[]): void {
        images.forEach((img, index) => {
            const $img = $(img);
            
            // Wrap image in a trigger container if not already wrapped
            if (!$img.parent().hasClass('embedded-gallery-trigger')) {
                $img.wrap('<span class="embedded-gallery-trigger"></span>');
            }
            
            const $trigger = $img.parent();
            
            // Add gallery indicator if multiple images
            if (this.galleryItems.length > 1) {
                $trigger.addClass('has-gallery');
                
                // Add count indicator
                if (!$trigger.find('.gallery-indicator').length) {
                    $trigger.prepend(`
                        <span class="gallery-indicator" aria-label="Image ${index + 1} of ${this.galleryItems.length}">
                            ${index + 1}/${this.galleryItems.length}
                        </span>
                    `);
                }
            }
            
            // Remove any existing click handlers
            $img.off('click.gallery');
            
            // Add click handler to open gallery
            $img.on('click.gallery', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openGallery(index);
            });
            
            // Add keyboard support
            $img.attr('tabindex', '0');
            $img.attr('role', 'button');
            $img.attr('aria-label', `${img.alt || 'Image'} - Click to open in gallery`);
            
            $img.on('keydown.gallery', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openGallery(index);
                }
            });
        });
    }
    
    /**
     * Create grid view of images
     */
    private createGridView($container: JQuery<HTMLElement>, items: GalleryItem[]): void {
        const $grid = $('<div class="image-grid-view"></div>');
        
        items.forEach((item, index) => {
            const $gridItem = $(`
                <div class="image-grid-item" data-index="${index}" tabindex="0" role="button">
                    <img src="${item.src}" alt="${item.alt}" loading="lazy" />
                    ${item.caption ? `<div class="image-grid-caption">${item.caption}</div>` : ''}
                </div>
            `);
            
            $gridItem.on('click', () => this.openGallery(index));
            $gridItem.on('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openGallery(index);
                }
            });
            
            $grid.append($gridItem);
        });
        
        // Replace container content with grid
        $container.empty().append($grid);
    }
    
    /**
     * Open gallery at specified index
     */
    private openGallery(startIndex: number = 0): void {
        if (this.galleryItems.length === 0) {
            return;
        }
        
        const config: GalleryConfig = {
            showThumbnails: this.galleryItems.length > 1,
            thumbnailHeight: 80,
            autoPlay: false,
            slideInterval: 4000,
            showCounter: this.galleryItems.length > 1,
            enableKeyboardNav: true,
            enableSwipeGestures: true,
            preloadCount: 2,
            loop: true
        };
        
        const callbacks: MediaViewerCallbacks = {
            onOpen: () => {
                console.log('Embedded gallery opened');
                this.trigger('galleryOpened', { items: this.galleryItems, startIndex });
            },
            onClose: () => {
                console.log('Embedded gallery closed');
                this.trigger('galleryClosed');
                
                // Restore focus to the trigger element
                const currentItem = this.galleryItems[galleryManager.getGalleryState()?.currentIndex || startIndex];
                if (currentItem?.element) {
                    (currentItem.element as HTMLElement).focus();
                }
            },
            onChange: (index) => {
                console.log('Gallery slide changed to:', index);
                this.trigger('gallerySlideChanged', { index, item: this.galleryItems[index] });
            },
            onImageLoad: (index, item) => {
                console.log('Gallery image loaded:', item.title);
            },
            onImageError: (index, item, error) => {
                console.error('Failed to load gallery image:', error);
            }
        };
        
        if (this.galleryItems.length === 1) {
            // Open single image
            mediaViewer.openSingle(this.galleryItems[0], {
                bgOpacity: 0.95,
                showHideOpacity: true,
                wheelToZoom: true,
                pinchToClose: true
            }, callbacks);
        } else {
            // Open gallery
            galleryManager.openGallery(this.galleryItems, startIndex, config, callbacks);
        }
    }
    
    /**
     * Extract note ID from image element
     */
    private extractNoteId(img: HTMLImageElement): string | undefined {
        // Check data attribute
        if (img.dataset.noteId) {
            return img.dataset.noteId;
        }
        
        // Try to extract from URL
        const match = img.src.match(/\/api\/images\/([a-zA-Z0-9_]+)/);
        if (match) {
            return match[1];
        }
        
        return undefined;
    }
    
    /**
     * Setup mutation observer to detect dynamically added images
     */
    private setupMutationObserver(): void {
        this.observer = new MutationObserver((mutations) => {
            const imagesToProcess: HTMLImageElement[] = [];
            
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as HTMLElement;
                        
                        // Check if it's an image
                        if (element.tagName === 'IMG') {
                            imagesToProcess.push(element as HTMLImageElement);
                        }
                        
                        // Check for images within the added element
                        const images = element.querySelectorAll('img');
                        images.forEach(img => imagesToProcess.push(img as HTMLImageElement));
                    }
                });
            });
            
            if (imagesToProcess.length > 0) {
                this.processNewImages(imagesToProcess);
            }
        });
    }
    
    /**
     * Process newly added images
     */
    private async processNewImages(images: HTMLImageElement[]): Promise<void> {
        // Filter out already processed images
        const newImages = images.filter(img => 
            img.dataset.galleryProcessed !== 'true' && 
            !this.processingQueue.has(img)
        );
        
        if (newImages.length === 0) {
            return;
        }
        
        // Add to processing queue
        newImages.forEach(img => this.processingQueue.add(img));
        
        try {
            // Create gallery items for new images
            const newItems = await this.createGalleryItems(newImages, $(document.body));
            
            // Add to existing gallery
            this.galleryItems.push(...newItems);
            
            // Enhance the new images
            this.enhanceImages(newImages);
        } finally {
            // Remove from processing queue
            newImages.forEach(img => this.processingQueue.delete(img));
        }
    }
    
    /**
     * Start observing a container for new images
     */
    observeContainer(container: HTMLElement): void {
        if (!this.observer) {
            this.setupMutationObserver();
        }
        
        this.observer?.observe(container, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * Stop observing
     */
    stopObserving(): void {
        this.observer?.disconnect();
    }
    
    /**
     * Refresh gallery items
     */
    async refresh(): Promise<void> {
        // Clear existing items
        this.galleryItems = [];
        this.imageElements.clear();
        
        // Mark all images as unprocessed
        $('[data-gallery-processed="true"]').removeAttr('data-gallery-processed');
        
        // Re-initialize if there's a container
        const $container = this.$widget?.parent();
        if ($container?.length) {
            await this.initializeGallery($container);
        }
    }
    
    /**
     * Get current gallery items
     */
    getGalleryItems(): GalleryItem[] {
        return this.galleryItems;
    }
    
    /**
     * Cleanup
     */
    cleanup(): void {
        // Stop observing
        this.stopObserving();
        
        // Close gallery if open
        if (galleryManager.isGalleryOpen()) {
            galleryManager.closeGallery();
        }
        
        // Remove event handlers
        $('[data-gallery-processed="true"]').off('.gallery');
        
        // Clear data
        this.galleryItems = [];
        this.imageElements.clear();
        this.processingQueue.clear();
        
        super.cleanup();
    }
}