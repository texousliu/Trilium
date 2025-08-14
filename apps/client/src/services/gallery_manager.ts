/**
 * Gallery Manager for PhotoSwipe integration in Trilium Notes
 * Handles multi-image galleries, slideshow mode, and navigation features
 */

import mediaViewer, { MediaItem, MediaViewerCallbacks, MediaViewerConfig } from './media_viewer.js';
import utils from './utils.js';
import froca from './froca.js';
import type FNote from '../entities/fnote.js';

/**
 * Gallery configuration options
 */
export interface GalleryConfig {
    showThumbnails?: boolean;
    thumbnailHeight?: number;
    autoPlay?: boolean;
    slideInterval?: number; // in milliseconds
    showCounter?: boolean;
    enableKeyboardNav?: boolean;
    enableSwipeGestures?: boolean;
    preloadCount?: number;
    loop?: boolean;
}

/**
 * Gallery item with additional metadata
 */
export interface GalleryItem extends MediaItem {
    noteId?: string;
    attachmentId?: string;
    caption?: string;
    description?: string;
    index?: number;
}

/**
 * Gallery state management
 */
interface GalleryState {
    items: GalleryItem[];
    currentIndex: number;
    isPlaying: boolean;
    slideshowTimer?: number;
    config: Required<GalleryConfig>;
}

/**
 * GalleryManager handles multi-image galleries with slideshow and navigation features
 */
class GalleryManager {
    private static instance: GalleryManager;
    private currentGallery: GalleryState | null = null;
    private defaultConfig: Required<GalleryConfig> = {
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
    
    private slideshowCallbacks: Set<() => void> = new Set();
    private $thumbnailStrip?: JQuery<HTMLElement>;
    private $slideshowControls?: JQuery<HTMLElement>;
    
    // Track all dynamically created elements for proper cleanup
    private createdElements: Map<string, HTMLElement | JQuery<HTMLElement>> = new Map();
    private setupTimeout?: number;

    private constructor() {
        // Cleanup on window unload
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    /**
     * Get singleton instance
     */
    static getInstance(): GalleryManager {
        if (!GalleryManager.instance) {
            GalleryManager.instance = new GalleryManager();
        }
        return GalleryManager.instance;
    }

    /**
     * Create gallery from images in a note's content
     */
    async createGalleryFromNote(note: FNote, config?: GalleryConfig): Promise<GalleryItem[]> {
        const items: GalleryItem[] = [];
        
        try {
            // Parse note content to find images
            const parser = new DOMParser();
            const content = await note.getContent();
            const doc = parser.parseFromString(content || '', 'text/html');
            const images = doc.querySelectorAll('img');
            
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                const src = img.getAttribute('src');
                
                if (!src) continue;
                
                // Convert relative URLs to absolute
                const absoluteSrc = this.resolveImageSrc(src, note.noteId);
                
                const item: GalleryItem = {
                    src: absoluteSrc,
                    alt: img.getAttribute('alt') || `Image ${i + 1} from ${note.title}`,
                    title: img.getAttribute('title') || img.getAttribute('alt') || undefined,
                    caption: img.getAttribute('data-caption') || undefined,
                    noteId: note.noteId,
                    index: i,
                    width: parseInt(img.getAttribute('width') || '0') || undefined,
                    height: parseInt(img.getAttribute('height') || '0') || undefined
                };
                
                // Try to get thumbnail from data attribute or create one
                const thumbnailSrc = img.getAttribute('data-thumbnail');
                if (thumbnailSrc) {
                    item.msrc = this.resolveImageSrc(thumbnailSrc, note.noteId);
                }
                
                items.push(item);
            }
            
            // Also check for image attachments
            const attachmentItems = await this.getAttachmentImages(note);
            items.push(...attachmentItems);
            
        } catch (error) {
            console.error('Failed to create gallery from note:', error);
        }
        
        return items;
    }

    /**
     * Get image attachments from a note
     */
    private async getAttachmentImages(note: FNote): Promise<GalleryItem[]> {
        const items: GalleryItem[] = [];
        
        try {
            // Get child notes that are images
            const childNotes = await note.getChildNotes();
            
            for (const childNote of childNotes) {
                if (childNote.type === 'image') {
                    const item: GalleryItem = {
                        src: utils.createImageSrcUrl(childNote),
                        alt: childNote.title,
                        title: childNote.title,
                        noteId: childNote.noteId,
                        index: items.length
                    };
                    
                    items.push(item);
                }
            }
        } catch (error) {
            console.error('Failed to get attachment images:', error);
        }
        
        return items;
    }

    /**
     * Create gallery from a container element with images
     */
    async createGalleryFromContainer(
        container: HTMLElement | JQuery<HTMLElement>, 
        selector: string = 'img',
        config?: GalleryConfig
    ): Promise<GalleryItem[]> {
        const $container = $(container);
        const images = $container.find(selector);
        const items: GalleryItem[] = [];
        
        for (let i = 0; i < images.length; i++) {
            const img = images[i] as HTMLImageElement;
            
            const item: GalleryItem = {
                src: img.src,
                alt: img.alt || `Image ${i + 1}`,
                title: img.title || img.alt || undefined,
                element: img,
                index: i,
                width: img.naturalWidth || undefined,
                height: img.naturalHeight || undefined
            };
            
            // Try to extract caption from nearby elements
            const $img = $(img);
            const $figure = $img.closest('figure');
            if ($figure.length) {
                const $caption = $figure.find('figcaption');
                if ($caption.length) {
                    item.caption = $caption.text();
                }
            }
            
            // Check for data attributes
            item.noteId = $img.data('note-id');
            item.attachmentId = $img.data('attachment-id');
            
            items.push(item);
        }
        
        return items;
    }

    /**
     * Open gallery with specified items
     */
    openGallery(
        items: GalleryItem[], 
        startIndex: number = 0, 
        config?: GalleryConfig,
        callbacks?: MediaViewerCallbacks
    ): void {
        if (!items || items.length === 0) {
            console.warn('No items provided to gallery');
            return;
        }
        
        // Close any existing gallery
        this.closeGallery();
        
        // Merge configuration
        const finalConfig = { ...this.defaultConfig, ...config };
        
        // Initialize gallery state
        this.currentGallery = {
            items,
            currentIndex: startIndex,
            isPlaying: finalConfig.autoPlay,
            config: finalConfig
        };
        
        // Enhanced PhotoSwipe configuration for gallery
        const photoSwipeConfig: Partial<MediaViewerConfig> = {
            bgOpacity: 0.95,
            showHideOpacity: true,
            allowPanToNext: true,
            spacing: 0.12,
            loop: finalConfig.loop,
            arrowKeys: finalConfig.enableKeyboardNav,
            pinchToClose: finalConfig.enableSwipeGestures,
            closeOnVerticalDrag: finalConfig.enableSwipeGestures,
            preload: [finalConfig.preloadCount, finalConfig.preloadCount],
            wheelToZoom: true,
            // Enable mobile and accessibility enhancements
            mobileA11y: {
                touch: {
                    hapticFeedback: true,
                    multiTouchEnabled: true
                },
                a11y: {
                    enableKeyboardNav: finalConfig.enableKeyboardNav,
                    enableScreenReaderAnnouncements: true,
                    keyboardShortcutsEnabled: true
                },
                mobileUI: {
                    bottomSheetEnabled: true,
                    adaptiveToolbar: true,
                    swipeIndicators: true,
                    gestureHints: true
                },
                performance: {
                    adaptiveQuality: true,
                    batteryOptimization: true
                }
            }
        };
        
        // Enhanced callbacks
        const enhancedCallbacks: MediaViewerCallbacks = {
            onOpen: () => {
                this.onGalleryOpen();
                callbacks?.onOpen?.();
            },
            onClose: () => {
                this.onGalleryClose();
                callbacks?.onClose?.();
            },
            onChange: (index) => {
                this.onSlideChange(index);
                callbacks?.onChange?.(index);
            },
            onImageLoad: callbacks?.onImageLoad,
            onImageError: callbacks?.onImageError
        };
        
        // Open with media viewer
        mediaViewer.open(items, startIndex, photoSwipeConfig, enhancedCallbacks);
        
        // Setup gallery UI enhancements
        this.setupGalleryUI();
        
        // Start slideshow if configured
        if (finalConfig.autoPlay) {
            this.startSlideshow();
        }
    }

    /**
     * Setup gallery UI enhancements
     */
    private setupGalleryUI(): void {
        if (!this.currentGallery) return;
        
        // Clear any existing timeout
        if (this.setupTimeout) {
            clearTimeout(this.setupTimeout);
        }
        
        // Add gallery-specific UI elements to PhotoSwipe
        this.setupTimeout = window.setTimeout(() => {
            // Validate gallery is still open before manipulating DOM
            if (!this.currentGallery || !this.isGalleryOpen()) {
                return;
            }
            
            // PhotoSwipe needs a moment to initialize
            const pswpElement = document.querySelector('.pswp');
            if (!pswpElement) return;
            
            // Add thumbnail strip if enabled
            if (this.currentGallery.config.showThumbnails) {
                this.addThumbnailStrip(pswpElement);
            }
            
            // Add slideshow controls
            this.addSlideshowControls(pswpElement);
            
            // Add image counter if enabled
            if (this.currentGallery.config.showCounter) {
                this.addImageCounter(pswpElement);
            }
            
            // Add keyboard hints
            this.addKeyboardHints(pswpElement);
        }, 100);
    }

    /**
     * Add thumbnail strip navigation
     */
    private addThumbnailStrip(container: Element): void {
        if (!this.currentGallery) return;
        
        // Create thumbnail strip container safely using DOM APIs
        const stripDiv = document.createElement('div');
        stripDiv.className = 'gallery-thumbnail-strip';
        stripDiv.setAttribute('style', `
            position: absolute;
            bottom: 60px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            padding: 10px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 8px;
            max-width: 90%;
            overflow-x: auto;
            z-index: 100;
        `);
        
        // Create thumbnails safely
        this.currentGallery.items.forEach((item, index) => {
            const thumbDiv = document.createElement('div');
            thumbDiv.className = 'gallery-thumbnail';
            thumbDiv.dataset.index = index.toString();
            thumbDiv.setAttribute('style', `
                width: ${this.currentGallery!.config.thumbnailHeight}px;
                height: ${this.currentGallery!.config.thumbnailHeight}px;
                cursor: pointer;
                border: 2px solid ${index === this.currentGallery!.currentIndex ? '#fff' : 'transparent'};
                border-radius: 4px;
                overflow: hidden;
                flex-shrink: 0;
                opacity: ${index === this.currentGallery!.currentIndex ? '1' : '0.6'};
                transition: all 0.2s;
            `);
            
            const img = document.createElement('img');
            // Sanitize src URLs
            const src = this.sanitizeUrl(item.msrc || item.src);
            img.src = src;
            // Use textContent for safe text insertion
            img.alt = this.sanitizeText(item.alt || '');
            img.setAttribute('style', `
                width: 100%;
                height: 100%;
                object-fit: cover;
            `);
            
            thumbDiv.appendChild(img);
            stripDiv.appendChild(thumbDiv);
        });
        
        this.$thumbnailStrip = $(stripDiv);
        $(container).append(this.$thumbnailStrip);
        this.createdElements.set('thumbnailStrip', this.$thumbnailStrip);
        
        // Handle thumbnail clicks
        this.$thumbnailStrip.on('click', '.gallery-thumbnail', (e) => {
            const index = parseInt($(e.currentTarget).data('index'));
            this.goToSlide(index);
        });
        
        // Handle hover effect
        this.$thumbnailStrip.on('mouseenter', '.gallery-thumbnail', (e) => {
            if (!$(e.currentTarget).hasClass('active')) {
                $(e.currentTarget).css('opacity', '0.8');
            }
        });
        
        this.$thumbnailStrip.on('mouseleave', '.gallery-thumbnail', (e) => {
            if (!$(e.currentTarget).hasClass('active')) {
                $(e.currentTarget).css('opacity', '0.6');
            }
        });
    }

    /**
     * Sanitize text content to prevent XSS
     */
    private sanitizeText(text: string): string {
        // Remove any HTML tags and entities
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Sanitize URL to prevent XSS
     */
    private sanitizeUrl(url: string): string {
        // Only allow safe protocols
        const allowedProtocols = ['http:', 'https:', 'data:'];
        try {
            const urlObj = new URL(url, window.location.href);
            
            // Special validation for data URLs
            if (urlObj.protocol === 'data:') {
                // Only allow image MIME types for data URLs
                const allowedImageTypes = [
                    'data:image/jpeg',
                    'data:image/jpg',
                    'data:image/png',
                    'data:image/gif',
                    'data:image/webp',
                    'data:image/svg+xml',
                    'data:image/bmp'
                ];
                
                // Check if data URL starts with an allowed image type
                const isAllowedImage = allowedImageTypes.some(type => 
                    url.toLowerCase().startsWith(type)
                );
                
                if (!isAllowedImage) {
                    console.warn('Rejected non-image data URL:', url.substring(0, 50));
                    return '';
                }
                
                // Additional check for base64 encoding
                if (!url.includes(';base64,') && !url.includes(';charset=')) {
                    console.warn('Rejected data URL with invalid encoding');
                    return '';
                }
            } else if (!allowedProtocols.includes(urlObj.protocol)) {
                return '';
            }
            
            return urlObj.href;
        } catch {
            // If URL parsing fails, check if it's a relative path
            if (url.startsWith('/') || url.startsWith('api/')) {
                return url;
            }
            return '';
        }
    }
    
    /**
     * Add slideshow controls
     */
    private addSlideshowControls(container: Element): void {
        if (!this.currentGallery) return;
        
        const controlsHtml = `
            <div class="gallery-slideshow-controls" style="
                position: absolute;
                top: 20px;
                right: 20px;
                display: flex;
                gap: 10px;
                z-index: 100;
            ">
                <button class="slideshow-play-pause" style="
                    background: rgba(255, 255, 255, 0.9);
                    border: none;
                    border-radius: 4px;
                    width: 44px;
                    height: 44px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                " aria-label="${this.currentGallery.isPlaying ? 'Pause slideshow' : 'Play slideshow'}">
                    <i class="bx ${this.currentGallery.isPlaying ? 'bx-pause' : 'bx-play'}"></i>
                </button>
                
                <button class="slideshow-settings" style="
                    background: rgba(255, 255, 255, 0.9);
                    border: none;
                    border-radius: 4px;
                    width: 44px;
                    height: 44px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                " aria-label="Slideshow settings">
                    <i class="bx bx-cog"></i>
                </button>
            </div>
            
            <div class="slideshow-interval-selector" style="
                position: absolute;
                top: 80px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px;
                border-radius: 4px;
                display: none;
                z-index: 101;
            ">
                <label style="display: block; margin-bottom: 5px;">Slide interval:</label>
                <select class="interval-select" style="
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    padding: 4px;
                    border-radius: 3px;
                ">
                    <option value="3000">3 seconds</option>
                    <option value="4000" selected>4 seconds</option>
                    <option value="5000">5 seconds</option>
                    <option value="7000">7 seconds</option>
                    <option value="10000">10 seconds</option>
                </select>
            </div>
        `;
        
        this.$slideshowControls = $(controlsHtml);
        $(container).append(this.$slideshowControls);
        this.createdElements.set('slideshowControls', this.$slideshowControls);
        
        // Handle play/pause button
        this.$slideshowControls.find('.slideshow-play-pause').on('click', () => {
            this.toggleSlideshow();
        });
        
        // Handle settings button
        this.$slideshowControls.find('.slideshow-settings').on('click', () => {
            const $selector = this.$slideshowControls?.find('.slideshow-interval-selector');
            $selector?.toggle();
        });
        
        // Handle interval change
        this.$slideshowControls.find('.interval-select').on('change', (e) => {
            const interval = parseInt($(e.target).val() as string);
            this.updateSlideshowInterval(interval);
        });
    }

    /**
     * Add image counter
     */
    private addImageCounter(container: Element): void {
        if (!this.currentGallery) return;
        
        // Create counter element safely
        const counterDiv = document.createElement('div');
        counterDiv.className = 'gallery-counter';
        counterDiv.setAttribute('style', `
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 100;
        `);
        
        const currentSpan = document.createElement('span');
        currentSpan.className = 'current-index';
        currentSpan.textContent = String(this.currentGallery.currentIndex + 1);
        
        const separatorSpan = document.createElement('span');
        separatorSpan.textContent = ' / ';
        
        const totalSpan = document.createElement('span');
        totalSpan.className = 'total-count';
        totalSpan.textContent = String(this.currentGallery.items.length);
        
        counterDiv.appendChild(currentSpan);
        counterDiv.appendChild(separatorSpan);
        counterDiv.appendChild(totalSpan);
        
        container.appendChild(counterDiv);
        this.createdElements.set('counter', counterDiv);
    }

    /**
     * Add keyboard hints overlay
     */
    private addKeyboardHints(container: Element): void {
        // Create hints element safely
        const hintsDiv = document.createElement('div');
        hintsDiv.className = 'gallery-keyboard-hints';
        hintsDiv.setAttribute('style', `
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 100;
        `);
        
        // Create hint items
        const hints = [
            { key: '←/→', action: 'Navigate' },
            { key: 'Space', action: 'Play/Pause' },
            { key: 'ESC', action: 'Close' }
        ];
        
        hints.forEach(hint => {
            const hintItem = document.createElement('div');
            const kbd = document.createElement('kbd');
            kbd.style.cssText = 'background: rgba(255,255,255,0.2); padding: 2px 4px; border-radius: 2px;';
            kbd.textContent = hint.key;
            hintItem.appendChild(kbd);
            hintItem.appendChild(document.createTextNode(' ' + hint.action));
            hintsDiv.appendChild(hintItem);
        });
        
        container.appendChild(hintsDiv);
        this.createdElements.set('keyboardHints', hintsDiv);
        
        const $hints = $(hintsDiv);
        
        // Show hints on hover with scoped selector
        const handleMouseEnter = () => {
            if (this.currentGallery) {
                $hints.css('opacity', '0.6');
            }
        };
        
        const handleMouseLeave = () => {
            $hints.css('opacity', '0');
        };
        
        $(container).on('mouseenter.galleryHints', handleMouseEnter);
        $(container).on('mouseleave.galleryHints', handleMouseLeave);
        
        // Track cleanup callback
        this.slideshowCallbacks.add(() => {
            $(container).off('.galleryHints');
        });
    }

    /**
     * Handle gallery open event
     */
    private onGalleryOpen(): void {
        // Add keyboard listener for slideshow control
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ') {
                e.preventDefault();
                this.toggleSlideshow();
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        this.slideshowCallbacks.add(() => {
            document.removeEventListener('keydown', handleKeyDown);
        });
    }

    /**
     * Handle gallery close event
     */
    private onGalleryClose(): void {
        this.stopSlideshow();
        
        // Clear setup timeout if exists
        if (this.setupTimeout) {
            clearTimeout(this.setupTimeout);
            this.setupTimeout = undefined;
        }
        
        // Cleanup event listeners
        this.slideshowCallbacks.forEach(callback => callback());
        this.slideshowCallbacks.clear();
        
        // Remove all tracked UI elements
        this.createdElements.forEach((element, key) => {
            if (element instanceof HTMLElement) {
                element.remove();
            } else if (element instanceof $) {
                element.remove();
            }
        });
        this.createdElements.clear();
        
        // Clear jQuery references
        this.$thumbnailStrip = undefined;
        this.$slideshowControls = undefined;
        
        // Clear state
        this.currentGallery = null;
    }

    /**
     * Handle slide change event
     */
    private onSlideChange(index: number): void {
        if (!this.currentGallery) return;
        
        this.currentGallery.currentIndex = index;
        
        // Update thumbnail highlighting
        if (this.$thumbnailStrip) {
            this.$thumbnailStrip.find('.gallery-thumbnail').each((i, el) => {
                const $thumb = $(el);
                if (i === index) {
                    $thumb.css({
                        'border-color': '#fff',
                        'opacity': '1'
                    });
                    
                    // Scroll thumbnail into view
                    const thumbLeft = $thumb.position().left;
                    const thumbWidth = $thumb.outerWidth() || 0;
                    const stripWidth = this.$thumbnailStrip!.width() || 0;
                    const scrollLeft = this.$thumbnailStrip!.scrollLeft() || 0;
                    
                    if (thumbLeft < 0) {
                        this.$thumbnailStrip!.scrollLeft(scrollLeft + thumbLeft - 10);
                    } else if (thumbLeft + thumbWidth > stripWidth) {
                        this.$thumbnailStrip!.scrollLeft(scrollLeft + (thumbLeft + thumbWidth - stripWidth) + 10);
                    }
                } else {
                    $thumb.css({
                        'border-color': 'transparent',
                        'opacity': '0.6'
                    });
                }
            });
        }
        
        // Update counter using tracked element
        const counterElement = this.createdElements.get('counter');
        if (counterElement instanceof HTMLElement) {
            const currentIndexElement = counterElement.querySelector('.current-index');
            if (currentIndexElement) {
                currentIndexElement.textContent = String(index + 1);
            }
        }
    }

    /**
     * Start slideshow
     */
    startSlideshow(): void {
        if (!this.currentGallery || this.currentGallery.isPlaying) return;
        
        // Validate gallery state before starting slideshow
        if (!this.isGalleryOpen() || this.currentGallery.items.length === 0) {
            console.warn('Cannot start slideshow: gallery not ready');
            return;
        }
        
        // Ensure PhotoSwipe is ready
        if (!mediaViewer.isOpen()) {
            console.warn('Cannot start slideshow: PhotoSwipe not ready');
            return;
        }
        
        this.currentGallery.isPlaying = true;
        
        // Update button icon
        this.$slideshowControls?.find('.slideshow-play-pause i')
            .removeClass('bx-play')
            .addClass('bx-pause');
        
        // Start timer
        this.scheduleNextSlide();
    }

    /**
     * Stop slideshow
     */
    stopSlideshow(): void {
        if (!this.currentGallery) return;
        
        this.currentGallery.isPlaying = false;
        
        // Clear timer
        if (this.currentGallery.slideshowTimer) {
            clearTimeout(this.currentGallery.slideshowTimer);
            this.currentGallery.slideshowTimer = undefined;
        }
        
        // Update button icon
        this.$slideshowControls?.find('.slideshow-play-pause i')
            .removeClass('bx-pause')
            .addClass('bx-play');
    }

    /**
     * Toggle slideshow play/pause
     */
    toggleSlideshow(): void {
        if (!this.currentGallery) return;
        
        if (this.currentGallery.isPlaying) {
            this.stopSlideshow();
        } else {
            this.startSlideshow();
        }
    }

    /**
     * Schedule next slide in slideshow
     */
    private scheduleNextSlide(): void {
        if (!this.currentGallery || !this.currentGallery.isPlaying) return;
        
        // Clear any existing timer
        if (this.currentGallery.slideshowTimer) {
            clearTimeout(this.currentGallery.slideshowTimer);
        }
        
        this.currentGallery.slideshowTimer = window.setTimeout(() => {
            if (!this.currentGallery || !this.currentGallery.isPlaying) return;
            
            // Go to next slide
            const nextIndex = (this.currentGallery.currentIndex + 1) % this.currentGallery.items.length;
            this.goToSlide(nextIndex);
            
            // Schedule next transition
            this.scheduleNextSlide();
        }, this.currentGallery.config.slideInterval);
    }

    /**
     * Update slideshow interval
     */
    updateSlideshowInterval(interval: number): void {
        if (!this.currentGallery) return;
        
        this.currentGallery.config.slideInterval = interval;
        
        // Restart slideshow with new interval if playing
        if (this.currentGallery.isPlaying) {
            this.stopSlideshow();
            this.startSlideshow();
        }
    }

    /**
     * Go to specific slide
     */
    goToSlide(index: number): void {
        if (!this.currentGallery) return;
        
        if (index >= 0 && index < this.currentGallery.items.length) {
            mediaViewer.goTo(index);
        }
    }

    /**
     * Navigate to next slide
     */
    nextSlide(): void {
        mediaViewer.next();
    }

    /**
     * Navigate to previous slide
     */
    previousSlide(): void {
        mediaViewer.prev();
    }

    /**
     * Close gallery
     */
    closeGallery(): void {
        mediaViewer.close();
    }

    /**
     * Check if gallery is open
     */
    isGalleryOpen(): boolean {
        return this.currentGallery !== null && mediaViewer.isOpen();
    }

    /**
     * Get current gallery state
     */
    getGalleryState(): GalleryState | null {
        return this.currentGallery;
    }

    /**
     * Resolve image source URL
     */
    private resolveImageSrc(src: string, noteId: string): string {
        // Handle different image source formats
        if (src.startsWith('http://') || src.startsWith('https://')) {
            return src;
        }
        
        if (src.startsWith('api/images/')) {
            return `/${src}`;
        }
        
        if (src.startsWith('/')) {
            return src;
        }
        
        // Assume it's a note ID or attachment reference
        return `/api/images/${noteId}/${src}`;
    }

    /**
     * Cleanup resources
     */
    cleanup(): void {
        // Clear any pending timeouts
        if (this.setupTimeout) {
            clearTimeout(this.setupTimeout);
            this.setupTimeout = undefined;
        }
        
        this.closeGallery();
        
        // Ensure all elements are removed
        this.createdElements.forEach((element) => {
            if (element instanceof HTMLElement) {
                element.remove();
            } else if (element instanceof $) {
                element.remove();
            }
        });
        this.createdElements.clear();
        
        this.slideshowCallbacks.clear();
        this.currentGallery = null;
    }
}

// Export singleton instance
export default GalleryManager.getInstance();