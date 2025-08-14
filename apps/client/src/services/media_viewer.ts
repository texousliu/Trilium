import PhotoSwipe from 'photoswipe';
import type PhotoSwipeOptions from 'photoswipe';
import type { DataSource, SlideData } from 'photoswipe';
import 'photoswipe/style.css';
import '../styles/photoswipe-mobile-a11y.css';
import mobileA11yService, { type MobileA11yConfig } from './photoswipe_mobile_a11y.js';

// Define Content type locally since it's not exported by PhotoSwipe
interface Content {
    width?: number;
    height?: number;
    [key: string]: any;
}

// Define AugmentedEvent type locally
interface AugmentedEvent<T extends string> {
    content: Content;
    slide?: any;
    preventDefault?: () => void;
    [key: string]: any;
}

/**
 * Media item interface for PhotoSwipe gallery
 */
export interface MediaItem {
    src: string;
    width?: number;
    height?: number;
    alt?: string;
    title?: string;
    noteId?: string;
    element?: HTMLElement;
    msrc?: string; // Thumbnail source
}

/**
 * Configuration options for the media viewer
 */
export interface MediaViewerConfig {
    bgOpacity?: number;
    showHideOpacity?: boolean;
    showAnimationDuration?: number;
    hideAnimationDuration?: number;
    allowPanToNext?: boolean;
    spacing?: number;
    maxSpreadZoom?: number;
    getThumbBoundsFn?: (index: number) => { x: number; y: number; w: number } | undefined;
    pinchToClose?: boolean;
    closeOnScroll?: boolean;
    closeOnVerticalDrag?: boolean;
    mouseMovePan?: boolean;
    arrowKeys?: boolean;
    returnFocus?: boolean;
    escKey?: boolean;
    errorMsg?: string;
    preloadFirstSlide?: boolean;
    preload?: [number, number];
    loop?: boolean;
    wheelToZoom?: boolean;
    mobileA11y?: MobileA11yConfig; // Mobile and accessibility configuration
}

/**
 * Event callbacks for media viewer
 */
export interface MediaViewerCallbacks {
    onOpen?: () => void;
    onClose?: () => void;
    onChange?: (index: number) => void;
    onImageLoad?: (index: number, item: MediaItem) => void;
    onImageError?: (index: number, item: MediaItem, error?: Error) => void;
}

/**
 * PhotoSwipe data item with original item reference
 */
interface PhotoSwipeDataItem extends SlideData {
    _originalItem?: MediaItem;
}

/**
 * Error handler for media viewer operations
 */
class MediaViewerError extends Error {
    constructor(message: string, public readonly cause?: unknown) {
        super(message);
        this.name = 'MediaViewerError';
    }
}

/**
 * MediaViewerService manages the PhotoSwipe lightbox for viewing images and media
 * in Trilium Notes. Implements singleton pattern for global access.
 */
class MediaViewerService {
    private static instance: MediaViewerService;
    private photoSwipe: PhotoSwipe | null = null;
    private defaultConfig: MediaViewerConfig;
    private currentItems: MediaItem[] = [];
    private callbacks: MediaViewerCallbacks = {};
    private cleanupHandlers: Array<() => void> = [];

    private constructor() {
        // Default configuration optimized for Trilium
        this.defaultConfig = {
            bgOpacity: 0.95,
            showHideOpacity: true,
            showAnimationDuration: 250,
            hideAnimationDuration: 250,
            allowPanToNext: true,
            spacing: 0.12,
            maxSpreadZoom: 4,
            pinchToClose: true,
            closeOnScroll: false,
            closeOnVerticalDrag: true,
            mouseMovePan: true,
            arrowKeys: true,
            returnFocus: true,
            escKey: true,
            errorMsg: 'The image could not be loaded',
            preloadFirstSlide: true,
            preload: [1, 2],
            loop: true,
            wheelToZoom: true
        };

        // Setup global cleanup on window unload
        window.addEventListener('beforeunload', () => this.destroy());
    }

    /**
     * Get singleton instance of MediaViewerService
     */
    static getInstance(): MediaViewerService {
        if (!MediaViewerService.instance) {
            MediaViewerService.instance = new MediaViewerService();
        }
        return MediaViewerService.instance;
    }

    /**
     * Open the media viewer with specified items
     */
    open(items: MediaItem[], startIndex: number = 0, config?: Partial<MediaViewerConfig>, callbacks?: MediaViewerCallbacks): void {
        try {
            // Validate inputs
            if (!items || items.length === 0) {
                throw new MediaViewerError('No items provided to media viewer');
            }
            
            if (startIndex < 0 || startIndex >= items.length) {
                console.warn(`Invalid start index ${startIndex}, using 0`);
                startIndex = 0;
            }

            // Close any existing viewer
            this.close();

            this.currentItems = items;
            this.callbacks = callbacks || {};

            // Prepare data source for PhotoSwipe with error handling
            const dataSource: DataSource = items.map((item, index) => {
                try {
                    return this.prepareItem(item);
                } catch (error) {
                    console.error(`Failed to prepare item at index ${index}:`, error);
                    // Return a minimal valid item as fallback
                    return {
                        src: item.src,
                        width: 800,
                        height: 600,
                        alt: item.alt || 'Error loading image'
                    } as PhotoSwipeDataItem;
                }
            });

            // Merge configurations
            const finalConfig = {
                ...this.defaultConfig,
                ...config,
                dataSource,
                index: startIndex,
                errorMsg: config?.errorMsg || 'The image could not be loaded. Please try again.'
            };

            // Create and initialize PhotoSwipe
            this.photoSwipe = new PhotoSwipe(finalConfig);

            // Setup event handlers
            this.setupEventHandlers();
            
            // Apply mobile and accessibility enhancements
            if (config?.mobileA11y || this.shouldAutoEnhance()) {
                mobileA11yService.enhancePhotoSwipe(this.photoSwipe, config?.mobileA11y);
            }

            // Initialize the viewer
            this.photoSwipe.init();
        } catch (error) {
            console.error('Failed to open media viewer:', error);
            // Cleanup on error
            this.close();
            // Re-throw as MediaViewerError
            throw error instanceof MediaViewerError ? error : new MediaViewerError('Failed to open media viewer', error);
        }
    }

    /**
     * Open a single image in the viewer
     */
    openSingle(item: MediaItem, config?: Partial<MediaViewerConfig>, callbacks?: MediaViewerCallbacks): void {
        this.open([item], 0, config, callbacks);
    }

    /**
     * Close the media viewer
     */
    close(): void {
        if (this.photoSwipe) {
            this.photoSwipe.destroy();
            this.photoSwipe = null;
            this.cleanupEventHandlers();
        }
    }

    /**
     * Navigate to next item
     */
    next(): void {
        if (this.photoSwipe) {
            this.photoSwipe.next();
        }
    }

    /**
     * Navigate to previous item
     */
    prev(): void {
        if (this.photoSwipe) {
            this.photoSwipe.prev();
        }
    }

    /**
     * Go to specific slide by index
     */
    goTo(index: number): void {
        if (this.photoSwipe && index >= 0 && index < this.currentItems.length) {
            this.photoSwipe.goTo(index);
        }
    }

    /**
     * Get current slide index
     */
    getCurrentIndex(): number {
        return this.photoSwipe ? this.photoSwipe.currIndex : -1;
    }

    /**
     * Check if viewer is open
     */
    isOpen(): boolean {
        return this.photoSwipe !== null;
    }

    /**
     * Update configuration dynamically
     */
    updateConfig(config: Partial<MediaViewerConfig>): void {
        this.defaultConfig = {
            ...this.defaultConfig,
            ...config
        };
    }

    /**
     * Prepare item for PhotoSwipe
     */
    private prepareItem(item: MediaItem): PhotoSwipeDataItem {
        const prepared: PhotoSwipeDataItem = {
            src: item.src,
            alt: item.alt || '',
            title: item.title
        };

        // If dimensions are provided, use them
        if (item.width && item.height) {
            prepared.width = item.width;
            prepared.height = item.height;
        } else {
            // Default dimensions - will be updated when image loads
            prepared.width = 0;
            prepared.height = 0;
        }

        // Add thumbnail if provided
        if (item.msrc) {
            prepared.msrc = item.msrc;
        }

        // Store original item reference
        prepared._originalItem = item;

        return prepared;
    }

    /**
     * Setup event handlers for PhotoSwipe
     */
    private setupEventHandlers(): void {
        if (!this.photoSwipe) return;

        // Opening event
        const openHandler = () => {
            if (this.callbacks.onOpen) {
                this.callbacks.onOpen();
            }
        };
        this.photoSwipe.on('openingAnimationEnd', openHandler);
        this.cleanupHandlers.push(() => this.photoSwipe?.off('openingAnimationEnd', openHandler));

        // Closing event
        const closeHandler = () => {
            if (this.callbacks.onClose) {
                this.callbacks.onClose();
            }
        };
        this.photoSwipe.on('close', closeHandler);
        this.cleanupHandlers.push(() => this.photoSwipe?.off('close', closeHandler));

        // Change event
        const changeHandler = () => {
            if (this.callbacks.onChange && this.photoSwipe) {
                this.callbacks.onChange(this.photoSwipe.currIndex);
            }
        };
        this.photoSwipe.on('change', changeHandler);
        this.cleanupHandlers.push(() => this.photoSwipe?.off('change', changeHandler));

        // Image load event - also update dimensions if needed
        const loadCompleteHandler = (e: any) => {
            try {
                const { content } = e;
                const extContent = content as Content & { type?: string; data?: HTMLImageElement; index?: number; _originalItem?: MediaItem };
                
                if (extContent.type === 'image' && extContent.data) {
                    // Update dimensions if they were not provided
                    if (content.width === 0 || content.height === 0) {
                        const img = extContent.data;
                        content.width = img.naturalWidth;
                        content.height = img.naturalHeight;
                        if (typeof extContent.index === 'number') {
                            this.photoSwipe?.refreshSlideContent(extContent.index);
                        }
                    }

                    if (this.callbacks.onImageLoad && typeof extContent.index === 'number' && extContent._originalItem) {
                        this.callbacks.onImageLoad(extContent.index, extContent._originalItem);
                    }
                }
            } catch (error) {
                console.error('Error in loadComplete handler:', error);
            }
        };
        this.photoSwipe.on('loadComplete', loadCompleteHandler);
        this.cleanupHandlers.push(() => this.photoSwipe?.off('loadComplete', loadCompleteHandler));

        // Image error event
        const errorHandler = (e: any) => {
            try {
                const { content } = e;
                const extContent = content as Content & { index?: number; _originalItem?: MediaItem };
                
                if (this.callbacks.onImageError && typeof extContent.index === 'number' && extContent._originalItem) {
                    const error = new MediaViewerError(`Failed to load image at index ${extContent.index}`);
                    this.callbacks.onImageError(extContent.index, extContent._originalItem, error);
                }
            } catch (error) {
                console.error('Error in errorHandler:', error);
            }
        };
        this.photoSwipe.on('loadError', errorHandler);
        this.cleanupHandlers.push(() => this.photoSwipe?.off('loadError', errorHandler));
    }

    /**
     * Cleanup event handlers
     */
    private cleanupEventHandlers(): void {
        this.cleanupHandlers.forEach(handler => handler());
        this.cleanupHandlers = [];
    }

    /**
     * Destroy the service and cleanup resources
     */
    destroy(): void {
        this.close();
        this.currentItems = [];
        this.callbacks = {};
        
        // Cleanup mobile and accessibility enhancements
        mobileA11yService.cleanup();
    }

    /**
     * Get dimensions from image element or URL with proper resource cleanup
     */
    async getImageDimensions(src: string): Promise<{ width: number; height: number }> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            let resolved = false;
            
            const cleanup = () => {
                img.onload = null;
                img.onerror = null;
                // Clear the src to help with garbage collection
                if (!resolved) {
                    img.src = '';
                }
            };
            
            img.onload = () => {
                resolved = true;
                const dimensions = {
                    width: img.naturalWidth,
                    height: img.naturalHeight
                };
                cleanup();
                resolve(dimensions);
            };
            
            img.onerror = () => {
                const error = new MediaViewerError(`Failed to load image: ${src}`);
                cleanup();
                reject(error);
            };
            
            // Set a timeout for image loading
            const timeoutId = setTimeout(() => {
                if (!resolved) {
                    cleanup();
                    reject(new MediaViewerError(`Image loading timeout: ${src}`));
                }
            }, 30000); // 30 second timeout
            
            img.src = src;
            
            // Clear timeout on success or error
            // Store the original handlers with timeout cleanup
            const originalOnload = img.onload;
            const originalOnerror = img.onerror;
            
            img.onload = function(ev: Event) {
                clearTimeout(timeoutId);
                if (originalOnload) {
                    originalOnload.call(img, ev);
                }
            };
            
            img.onerror = function(ev: Event | string) {
                clearTimeout(timeoutId);
                if (originalOnerror) {
                    originalOnerror.call(img, ev);
                }
            };
        });
    }

    /**
     * Create items from image elements in a container with error isolation
     */
    async createItemsFromContainer(container: HTMLElement, selector: string = 'img'): Promise<MediaItem[]> {
        const images = container.querySelectorAll<HTMLImageElement>(selector);
        const items: MediaItem[] = [];

        // Process each image with isolated error handling
        const promises = Array.from(images).map(async (img) => {
            try {
                const item: MediaItem = {
                    src: img.src,
                    alt: img.alt || `Image ${items.length + 1}`,
                    title: img.title || img.alt || `Image ${items.length + 1}`,
                    element: img,
                    width: img.naturalWidth || undefined,
                    height: img.naturalHeight || undefined
                };

                // Try to get dimensions if not available
                if (!item.width || !item.height) {
                    try {
                        const dimensions = await this.getImageDimensions(img.src);
                        item.width = dimensions.width;
                        item.height = dimensions.height;
                    } catch (error) {
                        // Log but don't fail - image will still be viewable
                        console.warn(`Failed to get dimensions for image: ${img.src}`, error);
                        // Set default dimensions as fallback
                        item.width = 800;
                        item.height = 600;
                    }
                }

                return item;
            } catch (error) {
                // Log error but continue processing other images
                console.error(`Failed to process image: ${img.src}`, error);
                return null;
            }
        });

        // Wait for all promises and filter out nulls
        const results = await Promise.allSettled(promises);
        for (const result of results) {
            if (result.status === 'fulfilled' && result.value !== null) {
                items.push(result.value);
            }
        }

        return items;
    }

    /**
     * Apply theme-specific styles
     */
    applyTheme(isDarkTheme: boolean): void {
        // This will be expanded to modify PhotoSwipe's appearance based on Trilium's theme
        const opacity = isDarkTheme ? 0.95 : 0.9;
        this.updateConfig({ bgOpacity: opacity });
    }
    
    /**
     * Check if mobile/accessibility enhancements should be auto-enabled
     */
    private shouldAutoEnhance(): boolean {
        // Auto-enable for touch devices
        const isTouchDevice = 'ontouchstart' in window || 
                             navigator.maxTouchPoints > 0;
        
        // Auto-enable if user has accessibility preferences
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
        
        return isTouchDevice || prefersReducedMotion || prefersHighContrast;
    }
}

// Export singleton instance
export default MediaViewerService.getInstance();