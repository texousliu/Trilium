/**
 * Tests for Gallery Manager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import galleryManager from './gallery_manager';
import mediaViewer from './media_viewer';
import type { GalleryItem, GalleryConfig } from './gallery_manager';
import type { MediaViewerCallbacks } from './media_viewer';

// Mock media viewer
vi.mock('./media_viewer', () => ({
    default: {
        open: vi.fn(),
        openSingle: vi.fn(),
        close: vi.fn(),
        next: vi.fn(),
        prev: vi.fn(),
        goTo: vi.fn(),
        getCurrentIndex: vi.fn(() => 0),
        isOpen: vi.fn(() => false),
        getImageDimensions: vi.fn(() => Promise.resolve({ width: 800, height: 600 }))
    }
}));

// Mock froca
vi.mock('./froca', () => ({
    default: {
        getNoteComplement: vi.fn()
    }
}));

// Mock utils
vi.mock('./utils', () => ({
    default: {
        createImageSrcUrl: vi.fn((note: any) => `/api/images/${note.noteId}`),
        randomString: vi.fn(() => 'test123')
    }
}));

describe('GalleryManager', () => {
    let mockItems: GalleryItem[];
    
    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        
        // Create mock gallery items
        mockItems = [
            {
                src: '/api/images/note1/image1.jpg',
                alt: 'Image 1',
                title: 'First Image',
                noteId: 'note1',
                index: 0,
                width: 800,
                height: 600
            },
            {
                src: '/api/images/note1/image2.jpg',
                alt: 'Image 2',
                title: 'Second Image',
                noteId: 'note1',
                index: 1,
                width: 1024,
                height: 768
            },
            {
                src: '/api/images/note1/image3.jpg',
                alt: 'Image 3',
                title: 'Third Image',
                noteId: 'note1',
                index: 2,
                width: 1920,
                height: 1080
            }
        ];
        
        // Setup DOM
        document.body.innerHTML = '';
    });
    
    afterEach(() => {
        // Cleanup
        galleryManager.cleanup();
        document.body.innerHTML = '';
    });
    
    describe('Gallery Creation', () => {
        it('should create gallery from container with images', async () => {
            // Create container with images
            const container = document.createElement('div');
            container.innerHTML = `
                <img src="/api/images/note1/image1.jpg" alt="Image 1" />
                <img src="/api/images/note1/image2.jpg" alt="Image 2" />
                <img src="/api/images/note1/image3.jpg" alt="Image 3" />
            `;
            document.body.appendChild(container);
            
            // Create gallery from container
            const items = await galleryManager.createGalleryFromContainer(container);
            
            expect(items).toHaveLength(3);
            expect(items[0].src).toBe('/api/images/note1/image1.jpg');
            expect(items[0].alt).toBe('Image 1');
            expect(items[0].index).toBe(0);
        });
        
        it('should extract captions from figure elements', async () => {
            const container = document.createElement('div');
            container.innerHTML = `
                <figure>
                    <img src="/api/images/note1/image1.jpg" alt="Image 1" />
                    <figcaption>This is a caption</figcaption>
                </figure>
            `;
            document.body.appendChild(container);
            
            const items = await galleryManager.createGalleryFromContainer(container);
            
            expect(items).toHaveLength(1);
            expect(items[0].caption).toBe('This is a caption');
        });
        
        it('should handle images without dimensions', async () => {
            const container = document.createElement('div');
            container.innerHTML = `<img src="/api/images/note1/image1.jpg" alt="Image 1" />`;
            document.body.appendChild(container);
            
            const items = await galleryManager.createGalleryFromContainer(container);
            
            expect(items).toHaveLength(1);
            expect(items[0].width).toBe(800); // From mocked getImageDimensions
            expect(items[0].height).toBe(600);
            expect(mediaViewer.getImageDimensions).toHaveBeenCalledWith('/api/images/note1/image1.jpg');
        });
    });
    
    describe('Gallery Opening', () => {
        it('should open gallery with multiple items', () => {
            const callbacks: MediaViewerCallbacks = {
                onOpen: vi.fn(),
                onClose: vi.fn(),
                onChange: vi.fn()
            };
            
            galleryManager.openGallery(mockItems, 0, {}, callbacks);
            
            expect(mediaViewer.open).toHaveBeenCalledWith(
                mockItems,
                0,
                expect.objectContaining({
                    loop: true,
                    allowPanToNext: true,
                    preload: [2, 2]
                }),
                expect.objectContaining({
                    onOpen: expect.any(Function),
                    onClose: expect.any(Function),
                    onChange: expect.any(Function)
                })
            );
        });
        
        it('should handle empty items array', () => {
            galleryManager.openGallery([], 0);
            expect(mediaViewer.open).not.toHaveBeenCalled();
        });
        
        it('should apply custom configuration', () => {
            const config: GalleryConfig = {
                showThumbnails: false,
                autoPlay: true,
                slideInterval: 5000,
                loop: false
            };
            
            galleryManager.openGallery(mockItems, 0, config);
            
            expect(mediaViewer.open).toHaveBeenCalledWith(
                mockItems,
                0,
                expect.objectContaining({
                    loop: false
                }),
                expect.any(Object)
            );
        });
    });
    
    describe('Gallery Navigation', () => {
        beforeEach(() => {
            // Open a gallery first
            galleryManager.openGallery(mockItems, 0);
        });
        
        it('should navigate to next slide', () => {
            galleryManager.nextSlide();
            expect(mediaViewer.next).toHaveBeenCalled();
        });
        
        it('should navigate to previous slide', () => {
            galleryManager.previousSlide();
            expect(mediaViewer.prev).toHaveBeenCalled();
        });
        
        it('should go to specific slide', () => {
            galleryManager.goToSlide(2);
            expect(mediaViewer.goTo).toHaveBeenCalledWith(2);
        });
        
        it('should not navigate to invalid slide index', () => {
            const state = galleryManager.getGalleryState();
            if (state) {
                // Try to go to invalid index
                galleryManager.goToSlide(-1);
                expect(mediaViewer.goTo).not.toHaveBeenCalled();
                
                galleryManager.goToSlide(10);
                expect(mediaViewer.goTo).not.toHaveBeenCalled();
            }
        });
    });
    
    describe('Slideshow Functionality', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            galleryManager.openGallery(mockItems, 0, { autoPlay: false });
        });
        
        afterEach(() => {
            vi.useRealTimers();
        });
        
        it('should start slideshow', () => {
            const state = galleryManager.getGalleryState();
            expect(state?.isPlaying).toBe(false);
            
            galleryManager.startSlideshow();
            
            const updatedState = galleryManager.getGalleryState();
            expect(updatedState?.isPlaying).toBe(true);
        });
        
        it('should stop slideshow', () => {
            galleryManager.startSlideshow();
            galleryManager.stopSlideshow();
            
            const state = galleryManager.getGalleryState();
            expect(state?.isPlaying).toBe(false);
        });
        
        it('should toggle slideshow', () => {
            const initialState = galleryManager.getGalleryState();
            expect(initialState?.isPlaying).toBe(false);
            
            galleryManager.toggleSlideshow();
            expect(galleryManager.getGalleryState()?.isPlaying).toBe(true);
            
            galleryManager.toggleSlideshow();
            expect(galleryManager.getGalleryState()?.isPlaying).toBe(false);
        });
        
        it('should advance slides automatically in slideshow', () => {
            galleryManager.startSlideshow();
            
            // Fast-forward time
            vi.advanceTimersByTime(4000); // Default interval
            
            expect(mediaViewer.goTo).toHaveBeenCalledWith(1);
        });
        
        it('should update slideshow interval', () => {
            galleryManager.startSlideshow();
            galleryManager.updateSlideshowInterval(5000);
            
            const state = galleryManager.getGalleryState();
            expect(state?.config.slideInterval).toBe(5000);
        });
    });
    
    describe('Gallery State', () => {
        it('should track gallery state', () => {
            expect(galleryManager.getGalleryState()).toBeNull();
            
            galleryManager.openGallery(mockItems, 1);
            
            const state = galleryManager.getGalleryState();
            expect(state).not.toBeNull();
            expect(state?.items).toEqual(mockItems);
            expect(state?.currentIndex).toBe(1);
        });
        
        it('should check if gallery is open', () => {
            expect(galleryManager.isGalleryOpen()).toBe(false);
            
            vi.mocked(mediaViewer.isOpen).mockReturnValue(true);
            galleryManager.openGallery(mockItems, 0);
            
            expect(galleryManager.isGalleryOpen()).toBe(true);
        });
    });
    
    describe('Gallery Cleanup', () => {
        it('should close gallery on cleanup', () => {
            galleryManager.openGallery(mockItems, 0);
            galleryManager.cleanup();
            
            expect(mediaViewer.close).toHaveBeenCalled();
            expect(galleryManager.getGalleryState()).toBeNull();
        });
        
        it('should stop slideshow on close', () => {
            galleryManager.openGallery(mockItems, 0, { autoPlay: true });
            
            const state = galleryManager.getGalleryState();
            expect(state?.isPlaying).toBe(true);
            
            galleryManager.closeGallery();
            expect(mediaViewer.close).toHaveBeenCalled();
        });
    });
    
    describe('UI Enhancements', () => {
        beforeEach(() => {
            // Create PhotoSwipe container mock
            const pswpElement = document.createElement('div');
            pswpElement.className = 'pswp';
            document.body.appendChild(pswpElement);
        });
        
        it('should add thumbnail strip when enabled', (done) => {
            galleryManager.openGallery(mockItems, 0, { showThumbnails: true });
            
            // Wait for UI setup
            setTimeout(() => {
                const thumbnailStrip = document.querySelector('.gallery-thumbnail-strip');
                expect(thumbnailStrip).toBeTruthy();
                
                const thumbnails = document.querySelectorAll('.gallery-thumbnail');
                expect(thumbnails).toHaveLength(3);
                
                done();
            }, 150);
        });
        
        it('should add slideshow controls', (done) => {
            galleryManager.openGallery(mockItems, 0);
            
            setTimeout(() => {
                const controls = document.querySelector('.gallery-slideshow-controls');
                expect(controls).toBeTruthy();
                
                const playPauseBtn = document.querySelector('.slideshow-play-pause');
                expect(playPauseBtn).toBeTruthy();
                
                done();
            }, 150);
        });
        
        it('should add image counter when enabled', (done) => {
            galleryManager.openGallery(mockItems, 0, { showCounter: true });
            
            setTimeout(() => {
                const counter = document.querySelector('.gallery-counter');
                expect(counter).toBeTruthy();
                expect(counter?.textContent).toContain('1');
                expect(counter?.textContent).toContain('3');
                
                done();
            }, 150);
        });
        
        it('should add keyboard hints', (done) => {
            galleryManager.openGallery(mockItems, 0);
            
            setTimeout(() => {
                const hints = document.querySelector('.gallery-keyboard-hints');
                expect(hints).toBeTruthy();
                expect(hints?.textContent).toContain('Navigate');
                expect(hints?.textContent).toContain('ESC');
                
                done();
            }, 150);
        });
    });
});