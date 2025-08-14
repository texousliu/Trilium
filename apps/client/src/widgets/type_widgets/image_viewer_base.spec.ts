import { ImageViewerBase } from './image_viewer_base.js';
import mediaViewer from '../../services/media_viewer.js';

// Mock mediaViewer
jest.mock('../../services/media_viewer.js', () => ({
    default: {
        isOpen: jest.fn().mockReturnValue(false),
        close: jest.fn(),
        openSingle: jest.fn(),
        getImageDimensions: jest.fn().mockResolvedValue({ width: 1920, height: 1080 })
    }
}));

// Create a concrete test class
class TestImageViewer extends ImageViewerBase {
    static getType() {
        return 'test';
    }

    doRender() {
        this.$widget = $('<div class="test-widget" tabindex="0"></div>');
        this.$imageWrapper = $('<div class="image-wrapper"></div>');
        this.$imageView = $('<img class="image-view" />');
        this.$widget.append(this.$imageWrapper.append(this.$imageView));
        super.doRender();
    }

    async doRefresh() {
        // Test implementation
    }
}

describe('ImageViewerBase', () => {
    let widget: TestImageViewer;
    let $container: JQuery<HTMLElement>;

    beforeEach(() => {
        // Setup DOM container
        $container = $('<div id="test-container"></div>');
        $('body').append($container);
        
        widget = new TestImageViewer();
        widget.doRender();
        $container.append(widget.$widget!);
    });

    afterEach(() => {
        widget.cleanup();
        $container.remove();
        jest.clearAllMocks();
    });

    describe('PhotoSwipe Verification', () => {
        it('should verify PhotoSwipe availability on initialization', () => {
            expect(widget['isPhotoSwipeAvailable']).toBe(true);
        });

        it('should handle PhotoSwipe not being available gracefully', () => {
            const originalMediaViewer = mediaViewer;
            // @ts-ignore - Temporarily set to undefined for testing
            window.mediaViewer = undefined;
            
            const newWidget = new TestImageViewer();
            expect(newWidget['isPhotoSwipeAvailable']).toBe(false);
            
            // @ts-ignore - Restore
            window.mediaViewer = originalMediaViewer;
        });
    });

    describe('Configuration', () => {
        it('should have default configuration values', () => {
            expect(widget['config'].minZoom).toBe(0.5);
            expect(widget['config'].maxZoom).toBe(5);
            expect(widget['config'].zoomStep).toBe(0.25);
            expect(widget['config'].debounceDelay).toBe(16);
            expect(widget['config'].touchTargetSize).toBe(44);
        });

        it('should allow configuration overrides', () => {
            widget['applyConfig']({
                minZoom: 0.2,
                maxZoom: 10,
                zoomStep: 0.5
            });
            
            expect(widget['config'].minZoom).toBe(0.2);
            expect(widget['config'].maxZoom).toBe(10);
            expect(widget['config'].zoomStep).toBe(0.5);
            expect(widget['config'].debounceDelay).toBe(16); // Unchanged
        });
    });

    describe('Loading States', () => {
        it('should show loading indicator when loading image', () => {
            widget['showLoadingIndicator']();
            expect(widget.$imageWrapper?.find('.image-loading-indicator').length).toBe(1);
        });

        it('should hide loading indicator after loading', () => {
            widget['showLoadingIndicator']();
            widget['hideLoadingIndicator']();
            expect(widget.$imageWrapper?.find('.image-loading-indicator').length).toBe(0);
        });

        it('should handle image load errors gracefully', async () => {
            const mockImage = {
                onload: null as any,
                onerror: null as any,
                src: ''
            };
            
            // @ts-ignore
            global.Image = jest.fn(() => mockImage);
            
            const setupPromise = widget['setupImage']('test.jpg', widget.$imageView!);
            
            // Trigger error
            mockImage.onerror(new Error('Failed to load'));
            
            await expect(setupPromise).rejects.toThrow('Failed to load image');
            expect(widget.$imageWrapper?.find('.alert-danger').length).toBe(1);
        });
    });

    describe('Zoom Functionality', () => {
        it('should zoom in correctly', () => {
            const initialZoom = widget['currentZoom'];
            widget['zoomIn']();
            
            // Wait for debounce
            jest.advanceTimersByTime(20);
            
            expect(widget['currentZoom']).toBeGreaterThan(initialZoom);
        });

        it('should zoom out correctly', () => {
            widget['currentZoom'] = 2;
            widget['zoomOut']();
            
            // Wait for debounce
            jest.advanceTimersByTime(20);
            
            expect(widget['currentZoom']).toBeLessThan(2);
        });

        it('should respect zoom limits', () => {
            // Test max zoom
            widget['currentZoom'] = widget['config'].maxZoom;
            widget['zoomIn']();
            jest.advanceTimersByTime(20);
            expect(widget['currentZoom']).toBe(widget['config'].maxZoom);
            
            // Test min zoom
            widget['currentZoom'] = widget['config'].minZoom;
            widget['zoomOut']();
            jest.advanceTimersByTime(20);
            expect(widget['currentZoom']).toBe(widget['config'].minZoom);
        });

        it('should reset zoom to 100%', () => {
            widget['currentZoom'] = 3;
            widget['resetZoom']();
            expect(widget['currentZoom']).toBe(1);
        });

        it('should show zoom indicator when zooming', () => {
            widget['updateZoomIndicator']();
            expect(widget.$widget?.find('.zoom-indicator').length).toBe(1);
            expect(widget.$widget?.find('.zoom-indicator').text()).toBe('100%');
        });
    });

    describe('Keyboard Navigation', () => {
        it('should only handle keyboard events when widget has focus', () => {
            const preventDefaultSpy = jest.fn();
            const stopPropagationSpy = jest.fn();
            
            // Simulate widget not having focus
            widget.$widget?.blur();
            
            const event = $.Event('keydown', {
                key: '+',
                preventDefault: preventDefaultSpy,
                stopPropagation: stopPropagationSpy
            });
            
            widget.$widget?.trigger(event);
            
            expect(preventDefaultSpy).not.toHaveBeenCalled();
            expect(stopPropagationSpy).not.toHaveBeenCalled();
        });

        it('should handle zoom keyboard shortcuts when focused', () => {
            // Focus the widget
            widget.$widget?.focus();
            jest.spyOn(widget.$widget!, 'is').mockImplementation((selector) => {
                if (selector === ':focus-within') return true;
                return false;
            });
            
            const zoomInSpy = jest.spyOn(widget as any, 'zoomIn');
            
            const event = $.Event('keydown', { key: '+' });
            widget.$widget?.trigger(event);
            
            expect(zoomInSpy).toHaveBeenCalled();
        });
    });

    describe('Pan Functionality', () => {
        it('should setup pan event handlers', () => {
            widget['setupPanFunctionality']();
            expect(widget['boundHandlers'].size).toBeGreaterThan(0);
        });

        it('should only allow panning when zoomed in', () => {
            widget['currentZoom'] = 1; // Not zoomed
            const mouseDownEvent = $.Event('mousedown', { pageX: 100, pageY: 100 });
            widget.$imageWrapper?.trigger(mouseDownEvent);
            
            expect(widget['isDragging']).toBe(false);
            
            // Now zoom in and try again
            widget['currentZoom'] = 2;
            widget.$imageWrapper?.trigger(mouseDownEvent);
            
            expect(widget['isDragging']).toBe(true);
        });
    });

    describe('Accessibility', () => {
        it('should add ARIA labels to buttons', () => {
            const $button = $('<button class="zoom-in"></button>');
            widget.$widget?.append($button);
            
            widget['addAccessibilityLabels']();
            
            expect($button.attr('aria-label')).toBe('Zoom in');
            expect($button.attr('role')).toBe('button');
        });

        it('should make widget focusable with proper ARIA attributes', () => {
            widget['setupKeyboardNavigation']();
            
            expect(widget.$widget?.attr('tabindex')).toBe('0');
            expect(widget.$widget?.attr('role')).toBe('application');
            expect(widget.$widget?.attr('aria-label')).toBeTruthy();
        });
    });

    describe('Lightbox Integration', () => {
        it('should open lightbox when PhotoSwipe is available', () => {
            const openSingleSpy = jest.spyOn(mediaViewer, 'openSingle');
            
            widget['openInLightbox']('test.jpg', 'Test Image', 'note123');
            
            expect(openSingleSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    src: 'test.jpg',
                    alt: 'Test Image',
                    title: 'Test Image',
                    noteId: 'note123'
                }),
                expect.any(Object),
                expect.any(Object)
            );
        });

        it('should fallback to opening in new tab when PhotoSwipe is not available', () => {
            widget['isPhotoSwipeAvailable'] = false;
            const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();
            
            widget['openInLightbox']('test.jpg', 'Test Image');
            
            expect(windowOpenSpy).toHaveBeenCalledWith('test.jpg', '_blank');
            expect(mediaViewer.openSingle).not.toHaveBeenCalled();
        });
    });

    describe('Memory Leak Prevention', () => {
        it('should cleanup all event handlers on cleanup', () => {
            widget['setupPanFunctionality']();
            widget['setupKeyboardNavigation']();
            
            const initialHandlerCount = widget['boundHandlers'].size;
            expect(initialHandlerCount).toBeGreaterThan(0);
            
            widget.cleanup();
            
            expect(widget['boundHandlers'].size).toBe(0);
        });

        it('should cancel animation frames on cleanup', () => {
            const cancelAnimationFrameSpy = jest.spyOn(window, 'cancelAnimationFrame');
            widget['rafId'] = 123;
            
            widget.cleanup();
            
            expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(123);
            expect(widget['rafId']).toBeNull();
        });

        it('should clear timers on cleanup', () => {
            const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');
            widget['zoomDebounceTimer'] = 456;
            
            widget.cleanup();
            
            expect(clearTimeoutSpy).toHaveBeenCalledWith(456);
            expect(widget['zoomDebounceTimer']).toBeNull();
        });

        it('should close lightbox if open on cleanup', () => {
            jest.spyOn(mediaViewer, 'isOpen').mockReturnValue(true);
            const closeSpy = jest.spyOn(mediaViewer, 'close');
            
            widget.cleanup();
            
            expect(closeSpy).toHaveBeenCalled();
        });
    });

    describe('Double-click Reset', () => {
        it('should reset zoom on double-click', () => {
            widget['currentZoom'] = 3;
            widget['setupDoubleClickReset']();
            
            const dblClickEvent = $.Event('dblclick');
            widget.$imageView?.trigger(dblClickEvent);
            
            expect(widget['currentZoom']).toBe(1);
        });
    });

    describe('Error Handling', () => {
        it('should show error message to user on failure', () => {
            widget['showErrorMessage']('Test error message');
            
            const $error = widget.$imageWrapper?.find('.alert-danger');
            expect($error?.length).toBe(1);
            expect($error?.text()).toBe('Test error message');
        });

        it('should handle null/undefined elements safely', () => {
            widget.$imageView = undefined;
            
            // Should not throw
            expect(() => widget['setupImage']('test.jpg', widget.$imageView!)).not.toThrow();
        });
    });
});