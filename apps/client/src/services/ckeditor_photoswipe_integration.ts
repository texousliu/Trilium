/**
 * CKEditor PhotoSwipe Integration
 * Handles click-to-lightbox functionality for images in CKEditor content
 */

import mediaViewer from './media_viewer.js';
import galleryManager from './gallery_manager.js';
import type { MediaItem } from './media_viewer.js';
import type { GalleryItem } from './gallery_manager.js';

/**
 * Configuration for CKEditor PhotoSwipe integration
 */
interface CKEditorPhotoSwipeConfig {
    enableGalleryMode?: boolean;
    showHints?: boolean;
    hintDelay?: number;
    excludeSelector?: string;
}

/**
 * Integration manager for CKEditor and PhotoSwipe
 */
class CKEditorPhotoSwipeIntegration {
    private static instance: CKEditorPhotoSwipeIntegration;
    private config: Required<CKEditorPhotoSwipeConfig>;
    private observers: Map<HTMLElement, MutationObserver> = new Map();
    private processedImages: WeakSet<HTMLImageElement> = new WeakSet();
    private containerGalleries: Map<HTMLElement, GalleryItem[]> = new Map();
    private hintPool: HTMLElement[] = [];
    private activeHints: Map<string, HTMLElement> = new Map();
    private hintTimeouts: Map<string, number> = new Map();
    
    private constructor() {
        this.config = {
            enableGalleryMode: true,
            showHints: true,
            hintDelay: 2000,
            excludeSelector: '.no-lightbox, .cke_widget_element'
        };
    }
    
    /**
     * Get singleton instance
     */
    static getInstance(): CKEditorPhotoSwipeIntegration {
        if (!CKEditorPhotoSwipeIntegration.instance) {
            CKEditorPhotoSwipeIntegration.instance = new CKEditorPhotoSwipeIntegration();
        }
        return CKEditorPhotoSwipeIntegration.instance;
    }
    
    /**
     * Setup integration for a CKEditor content container
     */
    setupContainer(container: HTMLElement | JQuery<HTMLElement>, config?: Partial<CKEditorPhotoSwipeConfig>): void {
        const element = container instanceof $ ? container[0] : container;
        if (!element) return;
        
        // Merge configuration
        if (config) {
            this.config = { ...this.config, ...config };
        }
        
        // Process existing images
        this.processImages(element);
        
        // Setup mutation observer for dynamically added images
        this.observeContainer(element);
        
        // Setup gallery if enabled
        if (this.config.enableGalleryMode) {
            this.setupGalleryMode(element);
        }
    }
    
    /**
     * Process all images in a container
     */
    private processImages(container: HTMLElement): void {
        const images = container.querySelectorAll<HTMLImageElement>(`img:not(${this.config.excludeSelector})`);
        
        images.forEach(img => {
            if (!this.processedImages.has(img)) {
                this.setupImageLightbox(img);
                this.processedImages.add(img);
            }
        });
    }
    
    /**
     * Setup lightbox for a single image
     */
    private setupImageLightbox(img: HTMLImageElement): void {
        // Skip if already processed or is a CKEditor widget element
        if (img.closest('.cke_widget_element') || img.closest('.ck-widget')) {
            return;
        }
        
        // Make image clickable
        img.style.cursor = 'zoom-in';
        img.style.transition = 'opacity 0.2s';
        
        // Store event handlers for cleanup
        const mouseEnterHandler = () => {
            img.style.opacity = '0.9';
            if (this.config.showHints) {
                this.showHint(img);
            }
        };
        
        const mouseLeaveHandler = () => {
            img.style.opacity = '1';
            this.hideHint(img);
        };
        
        // Add hover effect with cleanup tracking
        img.addEventListener('mouseenter', mouseEnterHandler);
        img.addEventListener('mouseleave', mouseLeaveHandler);
        
        // Store handlers for cleanup
        (img as any)._photoswipeHandlers = { mouseEnterHandler, mouseLeaveHandler };
        
        // Add click handler
        img.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Check if we should open as gallery
            const container = img.closest('.note-detail-editable-text, .note-detail-readonly-text');
            if (container && this.config.enableGalleryMode) {
                const gallery = this.containerGalleries.get(container as HTMLElement);
                if (gallery && gallery.length > 1) {
                    // Find index of clicked image
                    const index = gallery.findIndex(item => {
                        const itemElement = document.querySelector(`img[src="${item.src}"]`);
                        return itemElement === img;
                    });
                    
                    galleryManager.openGallery(gallery, index >= 0 ? index : 0, {
                        showThumbnails: true,
                        showCounter: true,
                        enableKeyboardNav: true,
                        loop: true
                    });
                    return;
                }
            }
            
            // Open single image
            this.openSingleImage(img);
        });
        
        // Add keyboard support
        img.setAttribute('tabindex', '0');
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', 'Click to view in lightbox');
        
        img.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                img.click();
            }
        });
    }
    
    /**
     * Open a single image in lightbox
     */
    private openSingleImage(img: HTMLImageElement): void {
        const item: MediaItem = {
            src: img.src,
            alt: img.alt || 'Image',
            title: img.title || img.alt,
            element: img,
            width: img.naturalWidth || undefined,
            height: img.naturalHeight || undefined
        };
        
        mediaViewer.openSingle(item, {
            bgOpacity: 0.95,
            showHideOpacity: true,
            pinchToClose: true,
            closeOnScroll: false,
            closeOnVerticalDrag: true,
            wheelToZoom: true,
            getThumbBoundsFn: () => {
                const rect = img.getBoundingClientRect();
                return {
                    x: rect.left,
                    y: rect.top,
                    w: rect.width
                };
            }
        }, {
            onClose: () => {
                // Restore focus to the image
                img.focus();
            }
        });
    }
    
    /**
     * Setup gallery mode for a container
     */
    private setupGalleryMode(container: HTMLElement): void {
        const images = container.querySelectorAll<HTMLImageElement>(`img:not(${this.config.excludeSelector})`);
        if (images.length <= 1) return;
        
        const galleryItems: GalleryItem[] = [];
        
        images.forEach((img, index) => {
            // Skip CKEditor widget elements
            if (img.closest('.cke_widget_element') || img.closest('.ck-widget')) {
                return;
            }
            
            const item: GalleryItem = {
                src: img.src,
                alt: img.alt || `Image ${index + 1}`,
                title: img.title || img.alt,
                element: img,
                index: index,
                width: img.naturalWidth || undefined,
                height: img.naturalHeight || undefined
            };
            
            // Check for caption
            const figure = img.closest('figure');
            if (figure) {
                const caption = figure.querySelector('figcaption');
                if (caption) {
                    item.caption = caption.textContent || undefined;
                }
            }
            
            galleryItems.push(item);
        });
        
        if (galleryItems.length > 0) {
            this.containerGalleries.set(container, galleryItems);
        }
    }
    
    /**
     * Observe container for dynamic changes
     */
    private observeContainer(container: HTMLElement): void {
        // Disconnect existing observer if any
        const existingObserver = this.observers.get(container);
        if (existingObserver) {
            existingObserver.disconnect();
        }
        
        const observer = new MutationObserver((mutations) => {
            let hasNewImages = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node as HTMLElement;
                            if (element.tagName === 'IMG') {
                                hasNewImages = true;
                            } else if (element.querySelector('img')) {
                                hasNewImages = true;
                            }
                        }
                    });
                }
            });
            
            if (hasNewImages) {
                // Process new images
                this.processImages(container);
                
                // Update gallery if enabled
                if (this.config.enableGalleryMode) {
                    this.setupGalleryMode(container);
                }
            }
        });
        
        observer.observe(container, {
            childList: true,
            subtree: true
        });
        
        this.observers.set(container, observer);
    }
    
    /**
     * Get or create a hint element from the pool
     */
    private getHintFromPool(): HTMLElement {
        let hint = this.hintPool.pop();
        if (!hint) {
            hint = document.createElement('div');
            hint.className = 'ckeditor-image-hint';
            hint.textContent = 'Click to view in lightbox';
            hint.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 1000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s;
                display: none;
            `;
        }
        return hint;
    }
    
    /**
     * Return hint to pool
     */
    private returnHintToPool(hint: HTMLElement): void {
        hint.style.opacity = '0';
        hint.style.display = 'none';
        if (this.hintPool.length < 10) { // Keep max 10 hints in pool
            this.hintPool.push(hint);
        } else {
            hint.remove();
        }
    }
    
    /**
     * Show hint for an image
     */
    private showHint(img: HTMLImageElement): void {
        // Check if hint already exists
        const imgId = img.dataset.imgId || `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        if (!img.dataset.imgId) {
            img.dataset.imgId = imgId;
        }
        
        // Clear any existing timeout
        const existingTimeout = this.hintTimeouts.get(imgId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            this.hintTimeouts.delete(imgId);
        }
        
        let hint = this.activeHints.get(imgId);
        if (hint) {
            hint.style.opacity = '1';
            return;
        }
        
        // Get hint from pool
        hint = this.getHintFromPool();
        this.activeHints.set(imgId, hint);
        
        // Position and show hint
        if (!hint.parentElement) {
            document.body.appendChild(hint);
        }
        
        const imgRect = img.getBoundingClientRect();
        hint.style.display = 'block';
        hint.style.left = `${imgRect.left + (imgRect.width - hint.offsetWidth) / 2}px`;
        hint.style.top = `${imgRect.top - hint.offsetHeight - 5}px`;
        
        // Show hint
        requestAnimationFrame(() => {
            hint.style.opacity = '1';
        });
        
        // Auto-hide after delay
        const timeout = window.setTimeout(() => {
            this.hideHint(img);
        }, this.config.hintDelay);
        this.hintTimeouts.set(imgId, timeout);
    }
    
    /**
     * Hide hint for an image
     */
    private hideHint(img: HTMLImageElement): void {
        const imgId = img.dataset.imgId;
        if (!imgId) return;
        
        // Clear timeout
        const timeout = this.hintTimeouts.get(imgId);
        if (timeout) {
            clearTimeout(timeout);
            this.hintTimeouts.delete(imgId);
        }
        
        const hint = this.activeHints.get(imgId);
        if (hint) {
            hint.style.opacity = '0';
            this.activeHints.delete(imgId);
            
            setTimeout(() => {
                this.returnHintToPool(hint);
            }, 300);
        }
    }
    
    /**
     * Cleanup integration for a container
     */
    cleanupContainer(container: HTMLElement | JQuery<HTMLElement>): void {
        const element = container instanceof $ ? container[0] : container;
        if (!element) return;
        
        // Disconnect observer
        const observer = this.observers.get(element);
        if (observer) {
            observer.disconnect();
            this.observers.delete(element);
        }
        
        // Clear gallery
        this.containerGalleries.delete(element);
        
        // Remove event handlers and hints
        const images = element.querySelectorAll<HTMLImageElement>('img');
        images.forEach(img => {
            this.hideHint(img);
            
            // Remove event handlers
            const handlers = (img as any)._photoswipeHandlers;
            if (handlers) {
                img.removeEventListener('mouseenter', handlers.mouseEnterHandler);
                img.removeEventListener('mouseleave', handlers.mouseLeaveHandler);
                delete (img as any)._photoswipeHandlers;
            }
            
            // Mark as unprocessed
            this.processedImages.delete(img);
        });
    }
    
    /**
     * Update configuration
     */
    updateConfig(config: Partial<CKEditorPhotoSwipeConfig>): void {
        this.config = { ...this.config, ...config };
    }
    
    /**
     * Cleanup all integrations
     */
    cleanup(): void {
        // Disconnect all observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        
        // Clear all galleries
        this.containerGalleries.clear();
        
        // Clear all hints
        this.activeHints.forEach(hint => hint.remove());
        this.activeHints.clear();
        
        // Clear all timeouts
        this.hintTimeouts.forEach(timeout => clearTimeout(timeout));
        this.hintTimeouts.clear();
        
        // Clear hint pool
        this.hintPool.forEach(hint => hint.remove());
        this.hintPool = [];
        
        // Clear processed images
        this.processedImages = new WeakSet();
    }
}

// Export singleton instance
export default CKEditorPhotoSwipeIntegration.getInstance();