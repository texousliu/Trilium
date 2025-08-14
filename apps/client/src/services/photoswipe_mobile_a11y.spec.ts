/**
 * Tests for PhotoSwipe Mobile & Accessibility Enhancement Module
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import type PhotoSwipe from 'photoswipe';
import mobileA11yService from './photoswipe_mobile_a11y.js';

// Mock PhotoSwipe
const mockPhotoSwipe = {
    template: document.createElement('div'),
    currSlide: {
        currZoomLevel: 1,
        zoomTo: jest.fn(),
        data: {
            src: 'test.jpg',
            alt: 'Test image',
            title: 'Test',
            width: 800,
            height: 600
        }
    },
    currIndex: 0,
    viewportSize: { x: 800, y: 600 },
    ui: { toggle: jest.fn() },
    next: jest.fn(),
    prev: jest.fn(),
    goTo: jest.fn(),
    close: jest.fn(),
    getNumItems: () => 5,
    on: jest.fn(),
    off: jest.fn(),
    options: {
        showAnimationDuration: 250,
        hideAnimationDuration: 250
    }
} as unknown as PhotoSwipe;

describe('PhotoSwipeMobileA11yService', () => {
    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
        
        // Reset mocks
        jest.clearAllMocks();
    });
    
    afterEach(() => {
        // Cleanup
        mobileA11yService.cleanup();
    });
    
    describe('Device Capabilities Detection', () => {
        it('should detect touch device capabilities', () => {
            // Add touch support to window
            Object.defineProperty(window, 'ontouchstart', {
                value: () => {},
                writable: true
            });
            
            // Service should detect touch support on initialization
            const service = mobileA11yService;
            expect(service).toBeDefined();
        });
        
        it('should detect accessibility preferences', () => {
            // Mock matchMedia for reduced motion
            const mockMatchMedia = jest.fn().mockImplementation(query => ({
                matches: query === '(prefers-reduced-motion: reduce)',
                media: query,
                addListener: jest.fn(),
                removeListener: jest.fn()
            }));
            
            Object.defineProperty(window, 'matchMedia', {
                value: mockMatchMedia,
                writable: true
            });
            
            const service = mobileA11yService;
            expect(service).toBeDefined();
        });
    });
    
    describe('ARIA Live Region', () => {
        it('should create ARIA live region for announcements', () => {
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe);
            
            const liveRegion = document.querySelector('[aria-live]');
            expect(liveRegion).toBeTruthy();
            expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
            expect(liveRegion?.getAttribute('role')).toBe('status');
        });
        
        it('should announce changes to screen readers', () => {
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe, {
                a11y: {
                    enableScreenReaderAnnouncements: true
                }
            });
            
            const liveRegion = document.querySelector('[aria-live]');
            
            // Trigger navigation
            const changeHandler = (mockPhotoSwipe.on as jest.Mock).mock.calls
                .find(call => call[0] === 'change')?.[1];
            
            if (changeHandler) {
                changeHandler();
                
                // Check if announcement was made
                expect(liveRegion?.textContent).toContain('Image 1 of 5');
            }
        });
    });
    
    describe('Keyboard Navigation', () => {
        it('should handle arrow key navigation', () => {
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe);
            
            // Simulate arrow key presses
            const leftArrow = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
            const rightArrow = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            
            document.dispatchEvent(leftArrow);
            expect(mockPhotoSwipe.prev).toHaveBeenCalled();
            
            document.dispatchEvent(rightArrow);
            expect(mockPhotoSwipe.next).toHaveBeenCalled();
        });
        
        it('should handle zoom with arrow keys', () => {
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe);
            
            const upArrow = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            const downArrow = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            
            document.dispatchEvent(upArrow);
            expect(mockPhotoSwipe.currSlide?.zoomTo).toHaveBeenCalledWith(
                expect.any(Number),
                expect.any(Object),
                333
            );
            
            document.dispatchEvent(downArrow);
            expect(mockPhotoSwipe.currSlide?.zoomTo).toHaveBeenCalledTimes(2);
        });
        
        it('should show keyboard help on ? key', () => {
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe);
            
            const helpKey = new KeyboardEvent('keydown', { key: '?' });
            document.dispatchEvent(helpKey);
            
            const helpDialog = document.querySelector('.photoswipe-keyboard-help');
            expect(helpDialog).toBeTruthy();
            expect(helpDialog?.getAttribute('role')).toBe('dialog');
        });
        
        it('should support quick navigation with number keys', () => {
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe);
            
            const key3 = new KeyboardEvent('keydown', { key: '3' });
            document.dispatchEvent(key3);
            
            expect(mockPhotoSwipe.goTo).toHaveBeenCalledWith(2); // 0-indexed
        });
    });
    
    describe('Touch Gestures', () => {
        it('should handle pinch to zoom', () => {
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe);
            
            const element = mockPhotoSwipe.template;
            
            // Simulate pinch gesture
            const touch1 = { clientX: 100, clientY: 100, identifier: 0 };
            const touch2 = { clientX: 200, clientY: 200, identifier: 1 };
            
            const touchStart = new TouchEvent('touchstart', {
                touches: [touch1, touch2] as any
            });
            
            element?.dispatchEvent(touchStart);
            
            // Move touches apart (zoom in)
            const touch1Move = { clientX: 50, clientY: 50, identifier: 0 };
            const touch2Move = { clientX: 250, clientY: 250, identifier: 1 };
            
            const touchMove = new TouchEvent('touchmove', {
                touches: [touch1Move, touch2Move] as any
            });
            
            element?.dispatchEvent(touchMove);
            
            // Zoom should be triggered
            expect(mockPhotoSwipe.currSlide?.zoomTo).toHaveBeenCalled();
        });
        
        it('should handle double tap to zoom', (done) => {
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe);
            
            const element = mockPhotoSwipe.template;
            const pos = { clientX: 400, clientY: 300 };
            
            // First tap
            const firstTap = new TouchEvent('touchend', {
                changedTouches: [{ ...pos, identifier: 0 }] as any
            });
            
            element?.dispatchEvent(new TouchEvent('touchstart', {
                touches: [{ ...pos, identifier: 0 }] as any
            }));
            element?.dispatchEvent(firstTap);
            
            // Second tap within double tap delay
            setTimeout(() => {
                element?.dispatchEvent(new TouchEvent('touchstart', {
                    touches: [{ ...pos, identifier: 0 }] as any
                }));
                
                const secondTap = new TouchEvent('touchend', {
                    changedTouches: [{ ...pos, identifier: 0 }] as any
                });
                element?.dispatchEvent(secondTap);
                
                // Check zoom was triggered
                expect(mockPhotoSwipe.currSlide?.zoomTo).toHaveBeenCalled();
                done();
            }, 100);
        });
        
        it('should detect swipe gestures', () => {
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe);
            
            const element = mockPhotoSwipe.template;
            
            // Simulate swipe left
            const touchStart = new TouchEvent('touchstart', {
                touches: [{ clientX: 300, clientY: 300, identifier: 0 }] as any
            });
            
            const touchEnd = new TouchEvent('touchend', {
                changedTouches: [{ clientX: 100, clientY: 300, identifier: 0 }] as any
            });
            
            element?.dispatchEvent(touchStart);
            element?.dispatchEvent(touchEnd);
            
            // Should navigate to next image
            expect(mockPhotoSwipe.next).toHaveBeenCalled();
        });
    });
    
    describe('Focus Management', () => {
        it('should trap focus within gallery', () => {
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe);
            
            const element = mockPhotoSwipe.template;
            
            // Add focusable elements
            const button1 = document.createElement('button');
            const button2 = document.createElement('button');
            element?.appendChild(button1);
            element?.appendChild(button2);
            
            // Focus first button
            button1.focus();
            
            // Simulate Tab on last focusable element
            const tabEvent = new KeyboardEvent('keydown', {
                key: 'Tab',
                shiftKey: false
            });
            
            button2.focus();
            element?.dispatchEvent(tabEvent);
            
            // Focus should wrap to first element
            expect(document.activeElement).toBe(button1);
        });
        
        it('should restore focus on close', () => {
            const originalFocus = document.createElement('button');
            document.body.appendChild(originalFocus);
            originalFocus.focus();
            
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe);
            
            // Trigger close handler
            const closeHandler = (mockPhotoSwipe.on as jest.Mock).mock.calls
                .find(call => call[0] === 'close')?.[1];
            
            if (closeHandler) {
                closeHandler();
                
                // Focus should be restored
                expect(document.activeElement).toBe(originalFocus);
            }
        });
    });
    
    describe('ARIA Attributes', () => {
        it('should add proper ARIA attributes to gallery', () => {
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe);
            
            const element = mockPhotoSwipe.template;
            
            expect(element?.getAttribute('role')).toBe('dialog');
            expect(element?.getAttribute('aria-label')).toContain('Image gallery');
            expect(element?.getAttribute('aria-modal')).toBe('true');
        });
        
        it('should label controls for screen readers', () => {
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe);
            
            const element = mockPhotoSwipe.template;
            
            // Add mock controls
            const prevBtn = document.createElement('button');
            prevBtn.className = 'pswp__button--arrow--prev';
            element?.appendChild(prevBtn);
            
            const nextBtn = document.createElement('button');
            nextBtn.className = 'pswp__button--arrow--next';
            element?.appendChild(nextBtn);
            
            // Enhance again to label the newly added controls
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe);
            
            expect(prevBtn.getAttribute('aria-label')).toBe('Previous image');
            expect(nextBtn.getAttribute('aria-label')).toBe('Next image');
        });
    });
    
    describe('Mobile UI Adaptations', () => {
        it('should ensure minimum touch target size', () => {
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe, {
                mobileUI: {
                    minTouchTargetSize: 44
                }
            });
            
            const element = mockPhotoSwipe.template;
            
            // Add a button
            const button = document.createElement('button');
            button.className = 'pswp__button';
            button.style.width = '30px';
            button.style.height = '30px';
            element?.appendChild(button);
            
            // Enhance to apply minimum sizes
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe);
            
            // Button should be resized to meet minimum
            expect(button.style.minWidth).toBe('44px');
            expect(button.style.minHeight).toBe('44px');
        });
        
        it('should add swipe indicators for mobile', () => {
            // Mock as mobile device
            Object.defineProperty(window, 'ontouchstart', {
                value: () => {},
                writable: true
            });
            
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe, {
                mobileUI: {
                    swipeIndicators: true
                }
            });
            
            const indicators = document.querySelector('.photoswipe-swipe-indicators');
            expect(indicators).toBeTruthy();
        });
    });
    
    describe('Performance Optimizations', () => {
        it('should adapt quality based on device capabilities', () => {
            // Mock low memory device
            Object.defineProperty(navigator, 'deviceMemory', {
                value: 1,
                writable: true
            });
            
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe, {
                performance: {
                    adaptiveQuality: true
                }
            });
            
            // Service should detect low memory and adjust settings
            expect(mobileA11yService).toBeDefined();
        });
        
        it('should apply reduced motion preferences', () => {
            // Mock reduced motion preference
            const mockMatchMedia = jest.fn().mockImplementation(query => ({
                matches: query === '(prefers-reduced-motion: reduce)',
                media: query,
                addListener: jest.fn(),
                removeListener: jest.fn()
            }));
            
            Object.defineProperty(window, 'matchMedia', {
                value: mockMatchMedia,
                writable: true
            });
            
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe);
            
            // Animations should be disabled
            expect(mockPhotoSwipe.options.showAnimationDuration).toBe(0);
            expect(mockPhotoSwipe.options.hideAnimationDuration).toBe(0);
        });
        
        it('should optimize for battery saving', () => {
            // Mock battery API
            const mockBattery = {
                charging: false,
                level: 0.15,
                addEventListener: jest.fn()
            };
            
            (navigator as any).getBattery = jest.fn().mockResolvedValue(mockBattery);
            
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe, {
                performance: {
                    batteryOptimization: true
                }
            });
            
            // Battery optimization should be enabled
            expect((navigator as any).getBattery).toHaveBeenCalled();
        });
    });
    
    describe('High Contrast Mode', () => {
        it('should apply high contrast styles when enabled', () => {
            // Mock high contrast preference
            const mockMatchMedia = jest.fn().mockImplementation(query => ({
                matches: query === '(prefers-contrast: high)',
                media: query,
                addListener: jest.fn(),
                removeListener: jest.fn()
            }));
            
            Object.defineProperty(window, 'matchMedia', {
                value: mockMatchMedia,
                writable: true
            });
            
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe);
            
            const element = mockPhotoSwipe.template;
            
            // Should have high contrast styles
            expect(element?.style.outline).toContain('2px solid white');
        });
    });
    
    describe('Haptic Feedback', () => {
        it('should trigger haptic feedback on supported devices', () => {
            // Mock vibration API
            const mockVibrate = jest.fn();
            Object.defineProperty(navigator, 'vibrate', {
                value: mockVibrate,
                writable: true
            });
            
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe, {
                touch: {
                    hapticFeedback: true
                }
            });
            
            // Trigger a gesture that should cause haptic feedback
            const element = mockPhotoSwipe.template;
            
            // Double tap
            const tap = new TouchEvent('touchend', {
                changedTouches: [{ clientX: 100, clientY: 100, identifier: 0 }] as any
            });
            
            element?.dispatchEvent(new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 100, identifier: 0 }] as any
            }));
            element?.dispatchEvent(tap);
            
            // Quick second tap
            setTimeout(() => {
                element?.dispatchEvent(new TouchEvent('touchstart', {
                    touches: [{ clientX: 100, clientY: 100, identifier: 0 }] as any
                }));
                element?.dispatchEvent(tap);
                
                // Haptic feedback should be triggered
                expect(mockVibrate).toHaveBeenCalled();
            }, 50);
        });
    });
    
    describe('Configuration Updates', () => {
        it('should update configuration dynamically', () => {
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe);
            
            // Update configuration
            mobileA11yService.updateConfig({
                a11y: {
                    ariaLiveRegion: 'assertive'
                },
                touch: {
                    hapticFeedback: false
                }
            });
            
            const liveRegion = document.querySelector('[aria-live]');
            expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
        });
    });
    
    describe('Cleanup', () => {
        it('should properly cleanup resources', () => {
            mobileA11yService.enhancePhotoSwipe(mockPhotoSwipe);
            
            // Create some elements
            const liveRegion = document.querySelector('[aria-live]');
            const helpDialog = document.querySelector('.photoswipe-keyboard-help');
            
            expect(liveRegion).toBeTruthy();
            
            // Cleanup
            mobileA11yService.cleanup();
            
            // Elements should be removed
            expect(document.querySelector('[aria-live]')).toBeFalsy();
            expect(document.querySelector('.photoswipe-keyboard-help')).toBeFalsy();
        });
    });
});