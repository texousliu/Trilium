import { TypedBasicWidget } from "./basic_widget.js";
import Component from "../components/component.js";
import mediaViewerService from "../services/media_viewer.js";
import type { MediaItem, MediaViewerConfig, MediaViewerCallbacks } from "../services/media_viewer.js";
import type FNote from "../entities/fnote.js";
import type { EventData } from "../components/app_context.js";
import froca from "../services/froca.js";
import utils from "../services/utils.js";
import server from "../services/server.js";
import toastService from "../services/toast.js";

/**
 * MediaViewerWidget provides a modern lightbox experience for viewing images
 * and other media in Trilium Notes using PhotoSwipe 5.
 * 
 * This widget can be used in two modes:
 * 1. As a standalone viewer for a single note's media
 * 2. As a gallery viewer for multiple media items
 */
export class MediaViewerWidget extends TypedBasicWidget<Component> {
    private currentNoteId: string | null = null;
    private galleryItems: MediaItem[] = [];
    private isGalleryMode: boolean = false;
    private clickHandlers: Map<HTMLElement, () => void> = new Map();
    private boundKeyboardHandler: ((event: KeyboardEvent) => void) | null = null;

    constructor() {
        super();
        this.setupGlobalHandlers();
    }

    /**
     * Setup global event handlers for media viewing
     */
    private setupGlobalHandlers(): void {
        // Store bound handler for proper cleanup
        this.boundKeyboardHandler = this.handleKeyboard.bind(this);
        document.addEventListener('keydown', this.boundKeyboardHandler);
        
        // Cleanup will be called by parent class
    }

    /**
     * Handle keyboard shortcuts with error boundary
     */
    private handleKeyboard(event: KeyboardEvent): void {
        try {
            // Only handle if viewer is open
            if (!mediaViewerService.isOpen()) {
                return;
            }

            switch (event.key) {
                case 'ArrowLeft':
                    mediaViewerService.prev();
                    event.preventDefault();
                    break;
                case 'ArrowRight':
                    mediaViewerService.next();
                    event.preventDefault();
                    break;
                case 'Escape':
                    mediaViewerService.close();
                    event.preventDefault();
                    break;
            }
        } catch (error) {
            console.error('Error handling keyboard event:', error);
        }
    }

    /**
     * Open viewer for a single image note with comprehensive error handling
     */
    async openImageNote(noteId: string, config?: Partial<MediaViewerConfig>): Promise<void> {
        try {
            const note = await froca.getNote(noteId);
            if (!note || note.type !== 'image') {
                toastService.showError('Note is not an image');
                return;
            }

            const item: MediaItem = {
                src: utils.createImageSrcUrl(note),
                alt: note.title || `Image ${noteId}`,
                title: note.title || `Image ${noteId}`,
                noteId: noteId
            };

            // Try to get image dimensions from attributes
            const widthAttr = note.getAttribute('label', 'imageWidth');
            const heightAttr = note.getAttribute('label', 'imageHeight');
            
            if (widthAttr && heightAttr) {
                const width = parseInt(widthAttr.value);
                const height = parseInt(heightAttr.value);
                if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
                    item.width = width;
                    item.height = height;
                }
            }
            
            // Get dimensions dynamically if not available
            if (!item.width || !item.height) {
                try {
                    const dimensions = await mediaViewerService.getImageDimensions(item.src);
                    item.width = dimensions.width;
                    item.height = dimensions.height;
                } catch (error) {
                    console.warn('Failed to get image dimensions, using defaults:', error);
                    // Use default dimensions as fallback
                    item.width = 800;
                    item.height = 600;
                }
            }

            const callbacks: MediaViewerCallbacks = {
                onOpen: () => this.onViewerOpen(noteId),
                onClose: () => this.onViewerClose(noteId),
                onImageError: (index, errorItem, error) => this.onImageError(errorItem, error)
            };

            mediaViewerService.openSingle(item, config, callbacks);
            this.currentNoteId = noteId;

        } catch (error) {
            console.error('Failed to open image note:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to open image';
            toastService.showError(errorMessage);
        }
    }

    /**
     * Open viewer for multiple images (gallery mode) with isolated error handling
     */
    async openGallery(noteIds: string[], startIndex: number = 0, config?: Partial<MediaViewerConfig>): Promise<void> {
        try {
            const items: MediaItem[] = [];
            const errors: Array<{ noteId: string; error: unknown }> = [];

            // Process each note with isolated error handling
            await Promise.all(noteIds.map(async (noteId) => {
                try {
                    const note = await froca.getNote(noteId);
                    if (!note || note.type !== 'image') {
                        return; // Skip non-image notes silently
                    }

                    const item: MediaItem = {
                        src: utils.createImageSrcUrl(note),
                        alt: note.title || `Image ${noteId}`,
                        title: note.title || `Image ${noteId}`,
                        noteId: noteId
                    };

                    // Try to get dimensions
                    const widthAttr = note.getAttribute('label', 'imageWidth');
                    const heightAttr = note.getAttribute('label', 'imageHeight');
                    
                    if (widthAttr && heightAttr) {
                        const width = parseInt(widthAttr.value);
                        const height = parseInt(heightAttr.value);
                        if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
                            item.width = width;
                            item.height = height;
                        }
                    }

                    // Use default dimensions if not available
                    if (!item.width || !item.height) {
                        item.width = 800;
                        item.height = 600;
                    }

                    items.push(item);
                } catch (error) {
                    console.error(`Failed to process note ${noteId}:`, error);
                    errors.push({ noteId, error });
                }
            }));

            if (items.length === 0) {
                if (errors.length > 0) {
                    toastService.showError('Failed to load any images');
                } else {
                    toastService.showMessage('No images to display');
                }
                return;
            }

            // Show warning if some images failed
            if (errors.length > 0) {
                toastService.showMessage(`Loaded ${items.length} images (${errors.length} failed)`);
            }

            // Validate and adjust start index
            if (startIndex < 0 || startIndex >= items.length) {
                console.warn(`Invalid start index ${startIndex}, using 0`);
                startIndex = 0;
            }

            const callbacks: MediaViewerCallbacks = {
                onOpen: () => this.onGalleryOpen(),
                onClose: () => this.onGalleryClose(),
                onChange: (index) => this.onGalleryChange(index),
                onImageError: (index, item, error) => this.onImageError(item, error)
            };

            mediaViewerService.open(items, startIndex, config, callbacks);
            this.galleryItems = items;
            this.isGalleryMode = true;

        } catch (error) {
            console.error('Failed to open gallery:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to open gallery';
            toastService.showError(errorMessage);
        }
    }

    /**
     * Open viewer for images in note content
     */
    async openContentImages(noteId: string, container: HTMLElement, startIndex: number = 0): Promise<void> {
        try {
            const note = await froca.getNote(noteId);
            if (!note) {
                toastService.showError('Note not found');
                return;
            }

            // Find all images in the container
            const items = await mediaViewerService.createItemsFromContainer(container, 'img:not(.note-icon)');
            
            if (items.length === 0) {
                toastService.showMessage('No images found in content');
                return;
            }

            // Add note context to items
            items.forEach(item => {
                item.noteId = noteId;
            });

            const callbacks: MediaViewerCallbacks = {
                onOpen: () => this.onContentViewerOpen(noteId),
                onClose: () => this.onContentViewerClose(noteId),
                onChange: (index) => this.onContentImageChange(index, items),
                onImageError: (index, item, error) => this.onImageError(item, error)
            };

            const config: Partial<MediaViewerConfig> = {
                getThumbBoundsFn: (index) => {
                    // Get thumbnail bounds for zoom animation
                    const item = items[index];
                    if (item.element) {
                        const rect = item.element.getBoundingClientRect();
                        return { x: rect.left, y: rect.top, w: rect.width };
                    }
                    return undefined;
                }
            };

            mediaViewerService.open(items, startIndex, config, callbacks);
            this.currentNoteId = noteId;

        } catch (error) {
            console.error('Failed to open content images:', error);
            toastService.showError('Failed to open images');
        }
    }

    /**
     * Attach click handlers to images in a container with accessibility
     */
    attachToContainer(container: HTMLElement, noteId: string): void {
        try {
            const images = container.querySelectorAll<HTMLImageElement>('img:not(.note-icon)');
            
            images.forEach((img, index) => {
                // Skip if already has handler
                if (this.clickHandlers.has(img)) {
                    return;
                }

                const handler = () => {
                    this.openContentImages(noteId, container, index).catch(error => {
                        console.error('Failed to open content images:', error);
                        toastService.showError('Failed to open image viewer');
                    });
                };

                img.addEventListener('click', handler);
                img.classList.add('media-viewer-trigger');
                img.style.cursor = 'zoom-in';
                
                // Add accessibility attributes
                img.setAttribute('role', 'button');
                img.setAttribute('tabindex', '0');
                img.setAttribute('aria-label', img.alt || 'Click to view image in fullscreen');
                
                // Add keyboard support for accessibility
                const keyHandler = (event: KeyboardEvent) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handler();
                    }
                };
                img.addEventListener('keydown', keyHandler);
                
                // Store both handlers
                this.clickHandlers.set(img, handler);
            });
        } catch (error) {
            console.error('Failed to attach container handlers:', error);
        }
    }

    /**
     * Detach click handlers from a container
     */
    detachFromContainer(container: HTMLElement): void {
        const images = container.querySelectorAll<HTMLImageElement>('img.media-viewer-trigger');
        
        images.forEach(img => {
            const handler = this.clickHandlers.get(img);
            if (handler) {
                img.removeEventListener('click', handler);
                img.classList.remove('media-viewer-trigger');
                img.style.cursor = '';
                this.clickHandlers.delete(img);
            }
        });
    }

    /**
     * Called when viewer opens for a single image
     */
    private onViewerOpen(noteId: string): void {
        // Log for debugging purposes
        console.debug('Media viewer opened for note:', noteId);
    }

    /**
     * Called when viewer closes for a single image
     */
    private onViewerClose(noteId: string): void {
        this.currentNoteId = null;
        console.debug('Media viewer closed for note:', noteId);
    }

    /**
     * Called when gallery opens
     */
    private onGalleryOpen(): void {
        console.debug('Gallery opened with', this.galleryItems.length, 'items');
    }

    /**
     * Called when gallery closes
     */
    private onGalleryClose(): void {
        this.isGalleryMode = false;
        this.galleryItems = [];
        console.debug('Gallery closed');
    }

    /**
     * Called when gallery slide changes
     */
    private onGalleryChange(index: number): void {
        const item = this.galleryItems[index];
        if (item && item.noteId) {
            console.debug('Gallery slide changed to index:', index, 'noteId:', item.noteId);
        }
    }

    /**
     * Called when content viewer opens
     */
    private onContentViewerOpen(noteId: string): void {
        console.debug('Content viewer opened for note:', noteId);
    }

    /**
     * Called when content viewer closes
     */
    private onContentViewerClose(noteId: string): void {
        this.currentNoteId = null;
        console.debug('Content viewer closed for note:', noteId);
    }

    /**
     * Called when content image changes
     */
    private onContentImageChange(index: number, items: MediaItem[]): void {
        console.debug('Content image changed to index:', index, 'of', items.length);
    }

    /**
     * Handle image loading errors with graceful degradation
     */
    private onImageError(item: MediaItem, error?: Error): void {
        const errorMessage = `Failed to load image: ${item.title || 'Unknown'}`;
        console.error(errorMessage, { src: item.src, error });
        
        // Show user-friendly error message
        toastService.showError(errorMessage);
        
        // Log the error for debugging
        console.debug('Image load error:', { 
            item, 
            error: error?.message || 'Unknown error' 
        });
    }

    /**
     * Download current image
     */
    async downloadCurrent(): Promise<void> {
        if (!mediaViewerService.isOpen()) {
            return;
        }

        const index = mediaViewerService.getCurrentIndex();
        const item = this.isGalleryMode ? this.galleryItems[index] : null;

        if (item && item.noteId) {
            try {
                const note = await froca.getNote(item.noteId);
                if (note) {
                    const url = `api/notes/${note.noteId}/download`;
                    window.open(url);
                }
            } catch (error) {
                console.error('Failed to download image:', error);
                toastService.showError('Failed to download image');
            }
        }
    }

    /**
     * Copy image reference to clipboard
     */
    async copyImageReference(): Promise<void> {
        if (!mediaViewerService.isOpen()) {
            return;
        }

        const index = mediaViewerService.getCurrentIndex();
        const item = this.isGalleryMode ? this.galleryItems[index] : null;

        if (item && item.noteId) {
            try {
                const reference = `![](api/images/${item.noteId}/view)`;
                await navigator.clipboard.writeText(reference);
                toastService.showMessage('Image reference copied to clipboard');
            } catch (error) {
                console.error('Failed to copy image reference:', error);
                toastService.showError('Failed to copy image reference');
            }
        }
    }

    /**
     * Get metadata for current image with type safety
     */
    async getCurrentMetadata(): Promise<{
        noteId: string;
        title: string;
        mime?: string;
        fileSize?: string;
        width?: number;
        height?: number;
        dateCreated?: string;
        dateModified?: string;
    } | null> {
        try {
            if (!mediaViewerService.isOpen()) {
                return null;
            }

            const index = mediaViewerService.getCurrentIndex();
            const item = this.isGalleryMode ? this.galleryItems[index] : null;

            if (item && item.noteId) {
                const note = await froca.getNote(item.noteId);
                if (note) {
                    const metadata = await note.getMetadata();
                    return {
                        noteId: note.noteId,
                        title: note.title || 'Untitled',
                        mime: note.mime,
                        fileSize: note.getAttribute('label', 'fileSize')?.value,
                        width: item.width,
                        height: item.height,
                        dateCreated: metadata.dateCreated,
                        dateModified: metadata.dateModified
                    };
                }
            }
        } catch (error) {
            console.error('Failed to get image metadata:', error);
        }

        return null;
    }

    /**
     * Cleanup handlers and resources
     */
    cleanup(): void {
        try {
            // Close viewer if open
            mediaViewerService.close();

            // Remove all click handlers
            this.clickHandlers.forEach((handler, element) => {
                element.removeEventListener('click', handler);
                element.classList.remove('media-viewer-trigger');
                element.style.cursor = '';
            });
            this.clickHandlers.clear();

            // Remove keyboard handler with proper reference
            if (this.boundKeyboardHandler) {
                document.removeEventListener('keydown', this.boundKeyboardHandler);
                this.boundKeyboardHandler = null;
            }

            // Clear references
            this.currentNoteId = null;
            this.galleryItems = [];
            this.isGalleryMode = false;
        } catch (error) {
            console.error('Error during MediaViewerWidget cleanup:', error);
        }
    }

    /**
     * Handle note changes
     */
    async entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">): Promise<void> {
        // Refresh viewer if current note was reloaded
        if (this.currentNoteId && loadResults.isNoteReloaded(this.currentNoteId)) {
            // Close and reopen with updated data
            if (mediaViewerService.isOpen()) {
                const index = mediaViewerService.getCurrentIndex();
                mediaViewerService.close();
                
                if (this.isGalleryMode) {
                    const noteIds = this.galleryItems.map(item => item.noteId).filter(Boolean) as string[];
                    await this.openGallery(noteIds, index);
                } else {
                    await this.openImageNote(this.currentNoteId);
                }
            }
        }
    }

    /**
     * Apply theme changes
     */
    themeChangedEvent(): void {
        const isDarkTheme = document.body.classList.contains('theme-dark') || 
                           document.body.classList.contains('theme-next-dark');
        mediaViewerService.applyTheme(isDarkTheme);
    }
}

// Create global instance for easy access
const mediaViewerWidget = new MediaViewerWidget();

export default mediaViewerWidget;