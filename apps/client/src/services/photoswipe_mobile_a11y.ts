/**
 * PhotoSwipe Mobile & Accessibility Enhancement Module
 * Phase 6: Complete mobile optimization and WCAG 2.1 AA compliance
 */

import type PhotoSwipe from 'photoswipe';
import type { SlideData } from 'photoswipe';
import utils from './utils.js';

/**
 * Device capabilities detection
 */
interface DeviceCapabilities {
    isTouchDevice: boolean;
    isMobile: boolean;
    isTablet: boolean;
    hasHapticSupport: boolean;
    screenWidth: number;
    screenHeight: number;
    pixelRatio: number;
    connectionType: 'slow' | 'fast' | 'unknown';
    memoryLimit: 'low' | 'medium' | 'high';
    reducedMotion: boolean;
    highContrast: boolean;
}

/**
 * Touch gesture configuration
 */
interface TouchGestureConfig {
    pinchThreshold: number;
    swipeThreshold: number;
    tapDelay: number;
    doubleTapDelay: number;
    longPressDelay: number;
    hapticFeedback: boolean;
    multiTouchEnabled: boolean;
}

/**
 * Accessibility configuration
 */
interface A11yConfig {
    enableKeyboardNav: boolean;
    enableScreenReaderAnnouncements: boolean;
    enableFocusIndicators: boolean;
    enableHighContrastMode: boolean;
    enableReducedMotion: boolean;
    ariaLiveRegion: 'polite' | 'assertive';
    keyboardShortcutsEnabled: boolean;
}

/**
 * Mobile UI configuration
 */
interface MobileUIConfig {
    minTouchTargetSize: number; // Minimum 44px for WCAG
    bottomSheetEnabled: boolean;
    adaptiveToolbar: boolean;
    swipeIndicators: boolean;
    gestureHints: boolean;
}

/**
 * Performance optimization settings
 */
interface PerformanceConfig {
    adaptiveQuality: boolean;
    lazyLoadDistance: number;
    maxImageSize: number;
    enableWebP: boolean;
    cacheStrategy: 'aggressive' | 'balanced' | 'minimal';
    batteryOptimization: boolean;
}

/**
 * Complete configuration for mobile and accessibility
 */
export interface MobileA11yConfig {
    touch?: Partial<TouchGestureConfig>;
    a11y?: Partial<A11yConfig>;
    mobileUI?: Partial<MobileUIConfig>;
    performance?: Partial<PerformanceConfig>;
}

/**
 * PhotoSwipe Mobile & Accessibility Enhancement Service
 */
class PhotoSwipeMobileA11yService {
    private static instance: PhotoSwipeMobileA11yService;
    private deviceCapabilities: DeviceCapabilities;
    private touchConfig: TouchGestureConfig;
    private a11yConfig: A11yConfig;
    private mobileUIConfig: MobileUIConfig;
    private performanceConfig: PerformanceConfig;
    
    // DOM elements for accessibility
    private liveRegion: HTMLElement | null = null;
    private keyboardHelpDialog: HTMLElement | null = null;
    private focusTrap: FocusTrap | null = null;
    
    // Touch gesture tracking
    private touchStartTime: number = 0;
    private touchStartPos: { x: number; y: number } = { x: 0, y: 0 };
    private lastTapTime: number = 0;
    private pinchStartDistance: number = 0;
    private isMultiTouch: boolean = false;
    
    // Performance monitoring
    private frameDropCount: number = 0;
    private lastFrameTime: number = 0;
    private performanceObserver: PerformanceObserver | null = null;
    
    private constructor() {
        // Detect device capabilities
        this.deviceCapabilities = this.detectDeviceCapabilities();
        
        // Initialize configurations with defaults
        this.touchConfig = {
            pinchThreshold: 0.1,
            swipeThreshold: 50,
            tapDelay: 300,
            doubleTapDelay: 300,
            longPressDelay: 500,
            hapticFeedback: this.deviceCapabilities.hasHapticSupport,
            multiTouchEnabled: true
        };
        
        this.a11yConfig = {
            enableKeyboardNav: true,
            enableScreenReaderAnnouncements: true,
            enableFocusIndicators: true,
            enableHighContrastMode: this.deviceCapabilities.highContrast,
            enableReducedMotion: this.deviceCapabilities.reducedMotion,
            ariaLiveRegion: 'polite',
            keyboardShortcutsEnabled: true
        };
        
        this.mobileUIConfig = {
            minTouchTargetSize: 44, // WCAG minimum
            bottomSheetEnabled: this.deviceCapabilities.isMobile,
            adaptiveToolbar: true,
            swipeIndicators: this.deviceCapabilities.isTouchDevice,
            gestureHints: true
        };
        
        this.performanceConfig = {
            adaptiveQuality: true,
            lazyLoadDistance: 2,
            maxImageSize: this.getMaxImageSize(),
            enableWebP: this.supportsWebP(),
            cacheStrategy: this.getCacheStrategy(),
            batteryOptimization: true
        };
        
        // Initialize accessibility features
        this.initializeA11y();
        
        // Monitor performance
        this.startPerformanceMonitoring();
    }
    
    /**
     * Get singleton instance
     */
    static getInstance(): PhotoSwipeMobileA11yService {
        if (!PhotoSwipeMobileA11yService.instance) {
            PhotoSwipeMobileA11yService.instance = new PhotoSwipeMobileA11yService();
        }
        return PhotoSwipeMobileA11yService.instance;
    }
    
    /**
     * Detect device capabilities
     */
    private detectDeviceCapabilities(): DeviceCapabilities {
        const nav = navigator as any;
        const win = window as any;
        
        // Check touch support
        const isTouchDevice = 'ontouchstart' in window || 
                             navigator.maxTouchPoints > 0 ||
                             (nav.msMaxTouchPoints && nav.msMaxTouchPoints > 0);
        
        // Check screen size
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const isMobile = screenWidth <= 768 && isTouchDevice;
        const isTablet = screenWidth > 768 && screenWidth <= 1024 && isTouchDevice;
        
        // Check haptic support (vibration API)
        const hasHapticSupport = 'vibrate' in navigator;
        
        // Check connection type
        const connection = (nav.connection || nav.mozConnection || nav.webkitConnection);
        let connectionType: 'slow' | 'fast' | 'unknown' = 'unknown';
        if (connection) {
            const effectiveType = connection.effectiveType;
            connectionType = (effectiveType === 'slow-2g' || effectiveType === '2g') ? 'slow' : 'fast';
        }
        
        // Check memory (if available)
        let memoryLimit: 'low' | 'medium' | 'high' = 'medium';
        if (nav.deviceMemory) {
            memoryLimit = nav.deviceMemory < 2 ? 'low' : nav.deviceMemory < 4 ? 'medium' : 'high';
        } else if (isMobile) {
            memoryLimit = 'low'; // Assume low for mobile if we can't detect
        }
        
        // Check accessibility preferences
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const highContrast = window.matchMedia('(prefers-contrast: high)').matches ||
                             window.matchMedia('(-ms-high-contrast: active)').matches;
        
        return {
            isTouchDevice,
            isMobile,
            isTablet,
            hasHapticSupport,
            screenWidth,
            screenHeight,
            pixelRatio: window.devicePixelRatio || 1,
            connectionType,
            memoryLimit,
            reducedMotion,
            highContrast
        };
    }
    
    /**
     * Get optimal max image size based on device
     */
    private getMaxImageSize(): number {
        const { screenWidth, pixelRatio, memoryLimit } = this.deviceCapabilities;
        const effectiveWidth = screenWidth * pixelRatio;
        
        if (memoryLimit === 'low') {
            return Math.min(1920, effectiveWidth);
        } else if (memoryLimit === 'medium') {
            return Math.min(2560, effectiveWidth * 1.5);
        } else {
            return Math.min(3840, effectiveWidth * 2);
        }
    }
    
    /**
     * Check WebP support
     */
    private supportsWebP(): boolean {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
    }
    
    /**
     * Determine cache strategy based on device
     */
    private getCacheStrategy(): 'aggressive' | 'balanced' | 'minimal' {
        const { memoryLimit, connectionType } = this.deviceCapabilities;
        
        if (memoryLimit === 'low' || connectionType === 'slow') {
            return 'minimal';
        } else if (memoryLimit === 'high' && connectionType === 'fast') {
            return 'aggressive';
        } else {
            return 'balanced';
        }
    }
    
    /**
     * Initialize accessibility features
     */
    private initializeA11y(): void {
        // Create ARIA live region for announcements
        this.createLiveRegion();
        
        // Setup keyboard navigation helpers
        this.setupKeyboardHelpers();
        
        // Add skip links for keyboard navigation
        this.addSkipLinks();
        
        // Monitor focus changes
        this.monitorFocus();
    }
    
    /**
     * Create ARIA live region for screen reader announcements
     */
    private createLiveRegion(): void {
        if (this.liveRegion) return;
        
        this.liveRegion = document.createElement('div');
        this.liveRegion.className = 'photoswipe-live-region';
        this.liveRegion.setAttribute('aria-live', this.a11yConfig.ariaLiveRegion);
        this.liveRegion.setAttribute('aria-atomic', 'true');
        this.liveRegion.setAttribute('role', 'status');
        this.liveRegion.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(this.liveRegion);
    }
    
    /**
     * Setup keyboard navigation helpers
     */
    private setupKeyboardHelpers(): void {
        // Create keyboard help dialog
        this.keyboardHelpDialog = document.createElement('div');
        this.keyboardHelpDialog.className = 'photoswipe-keyboard-help';
        this.keyboardHelpDialog.setAttribute('role', 'dialog');
        this.keyboardHelpDialog.setAttribute('aria-label', 'Keyboard shortcuts');
        this.keyboardHelpDialog.innerHTML = this.getKeyboardHelpContent();
        this.keyboardHelpDialog.style.display = 'none';
        document.body.appendChild(this.keyboardHelpDialog);
    }
    
    /**
     * Get keyboard help content
     */
    private getKeyboardHelpContent(): string {
        return `
            <div class="keyboard-help-content">
                <h2>Keyboard Shortcuts</h2>
                <dl>
                    <dt><kbd>←</kbd> / <kbd>→</kbd></dt>
                    <dd>Previous / Next image</dd>
                    
                    <dt><kbd>↑</kbd> / <kbd>↓</kbd></dt>
                    <dd>Zoom in / out</dd>
                    
                    <dt><kbd>Space</kbd></dt>
                    <dd>Play/pause slideshow</dd>
                    
                    <dt><kbd>F</kbd></dt>
                    <dd>Toggle fullscreen</dd>
                    
                    <dt><kbd>T</kbd></dt>
                    <dd>Toggle thumbnails</dd>
                    
                    <dt><kbd>I</kbd></dt>
                    <dd>Show image info</dd>
                    
                    <dt><kbd>Esc</kbd></dt>
                    <dd>Close gallery</dd>
                    
                    <dt><kbd>?</kbd></dt>
                    <dd>Show this help</dd>
                </dl>
                <button class="close-help" aria-label="Close help">Close</button>
            </div>
        `;
    }
    
    /**
     * Add skip links for keyboard navigation
     */
    private addSkipLinks(): void {
        const skipLink = document.createElement('a');
        skipLink.className = 'photoswipe-skip-link';
        skipLink.href = '#photoswipe-main';
        skipLink.textContent = 'Skip to main image';
        skipLink.style.cssText = `
            position: absolute;
            left: -10000px;
            top: 0;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        
        // Show on focus
        skipLink.addEventListener('focus', () => {
            skipLink.style.left = '10px';
            skipLink.style.width = 'auto';
            skipLink.style.height = 'auto';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.left = '-10000px';
            skipLink.style.width = '1px';
            skipLink.style.height = '1px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    }
    
    /**
     * Monitor focus for accessibility
     */
    private monitorFocus(): void {
        let lastFocusedElement: Element | null = null;
        
        document.addEventListener('focusin', (e) => {
            lastFocusedElement = e.target as Element;
            
            // Add focus indicator class
            if (this.a11yConfig.enableFocusIndicators) {
                lastFocusedElement.classList.add('photoswipe-focused');
            }
        });
        
        document.addEventListener('focusout', (e) => {
            const element = e.target as Element;
            
            // Remove focus indicator class
            if (element.classList.contains('photoswipe-focused')) {
                element.classList.remove('photoswipe-focused');
            }
        });
    }
    
    /**
     * Start performance monitoring
     */
    private startPerformanceMonitoring(): void {
        if (!window.PerformanceObserver) return;
        
        try {
            this.performanceObserver = new PerformanceObserver((entries) => {
                for (const entry of entries.getEntries()) {
                    if (entry.entryType === 'frame') {
                        this.analyzeFramePerformance(entry as any);
                    }
                }
            });
            
            // Observe frame timing if available
            if ('PerformanceFrameTiming' in window) {
                this.performanceObserver.observe({ entryTypes: ['frame'] });
            }
        } catch (error) {
            console.warn('Performance monitoring not available:', error);
        }
        
        // Fallback: Monitor with requestAnimationFrame
        this.monitorFrameRate();
    }
    
    /**
     * Monitor frame rate
     */
    private monitorFrameRate(): void {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const checkFrameRate = () => {
            const currentTime = performance.now();
            const delta = currentTime - lastTime;
            
            if (delta >= 1000) {
                const fps = (frameCount * 1000) / delta;
                
                if (fps < 30 && this.performanceConfig.adaptiveQuality) {
                    this.adjustQualitySettings('decrease');
                } else if (fps > 50) {
                    this.adjustQualitySettings('increase');
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            frameCount++;
            requestAnimationFrame(checkFrameRate);
        };
        
        requestAnimationFrame(checkFrameRate);
    }
    
    /**
     * Analyze frame performance
     */
    private analyzeFramePerformance(entry: any): void {
        const duration = entry.duration;
        
        // Frame took longer than 16.67ms (60fps threshold)
        if (duration > 16.67) {
            this.frameDropCount++;
            
            if (this.frameDropCount > 10 && this.performanceConfig.adaptiveQuality) {
                this.adjustQualitySettings('decrease');
                this.frameDropCount = 0;
            }
        }
    }
    
    /**
     * Adjust quality settings based on performance
     */
    private adjustQualitySettings(direction: 'increase' | 'decrease'): void {
        if (direction === 'decrease') {
            // Reduce quality for better performance
            this.performanceConfig.maxImageSize = Math.max(
                1280,
                this.performanceConfig.maxImageSize * 0.75
            );
            this.performanceConfig.lazyLoadDistance = Math.max(1, this.performanceConfig.lazyLoadDistance - 1);
            
            this.announce('Adjusting image quality for better performance');
        } else {
            // Increase quality if performance allows
            const newSize = this.performanceConfig.maxImageSize * 1.25;
            if (newSize <= this.getMaxImageSize()) {
                this.performanceConfig.maxImageSize = newSize;
                this.performanceConfig.lazyLoadDistance = Math.min(3, this.performanceConfig.lazyLoadDistance + 1);
            }
        }
    }
    
    /**
     * Enhance PhotoSwipe instance with mobile and accessibility features
     */
    enhancePhotoSwipe(pswp: PhotoSwipe, config?: MobileA11yConfig): void {
        // Apply configuration
        if (config) {
            this.updateConfig(config);
        }
        
        // Enhance touch gestures
        this.enhanceTouchGestures(pswp);
        
        // Enhance keyboard navigation
        this.enhanceKeyboardNavigation(pswp);
        
        // Add ARIA attributes
        this.enhanceAccessibility(pswp);
        
        // Optimize for mobile UI
        this.optimizeMobileUI(pswp);
        
        // Apply performance optimizations
        this.applyPerformanceOptimizations(pswp);
        
        // Setup battery optimization
        if (this.performanceConfig.batteryOptimization) {
            this.setupBatteryOptimization(pswp);
        }
    }
    
    /**
     * Enhance touch gestures
     */
    private enhanceTouchGestures(pswp: PhotoSwipe): void {
        const element = pswp.template;
        if (!element) return;
        
        // Track touch events
        let touches: Touch[] = [];
        let gestureState: 'none' | 'pinch' | 'swipe' | 'tap' = 'none';
        
        element.addEventListener('touchstart', (e) => {
            touches = Array.from(e.touches);
            this.touchStartTime = Date.now();
            this.touchStartPos = {
                x: touches[0].clientX,
                y: touches[0].clientY
            };
            
            // Detect multi-touch
            if (touches.length === 2) {
                this.isMultiTouch = true;
                gestureState = 'pinch';
                this.pinchStartDistance = this.getDistance(touches[0], touches[1]);
                
                // Haptic feedback for pinch start
                this.triggerHapticFeedback('light');
            }
        }, { passive: true });
        
        element.addEventListener('touchmove', (e) => {
            if (touches.length === 2 && e.touches.length === 2) {
                // Handle pinch gesture
                const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
                const scale = currentDistance / this.pinchStartDistance;
                
                if (Math.abs(scale - 1) > this.touchConfig.pinchThreshold) {
                    // Trigger zoom based on pinch
                    const currentZoom = pswp.currSlide?.currZoomLevel || 1;
                    const newZoom = currentZoom * scale;
                    
                    if (pswp.currSlide) {
                        pswp.currSlide.zoomTo(
                            newZoom,
                            { x: pswp.viewportSize.x / 2, y: pswp.viewportSize.y / 2 },
                            0,
                            true
                        );
                    }
                    
                    this.pinchStartDistance = currentDistance;
                }
            }
        }, { passive: true });
        
        element.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - this.touchStartTime;
            const touchEndPos = {
                x: e.changedTouches[0].clientX,
                y: e.changedTouches[0].clientY
            };
            
            const distance = Math.sqrt(
                Math.pow(touchEndPos.x - this.touchStartPos.x, 2) +
                Math.pow(touchEndPos.y - this.touchStartPos.y, 2)
            );
            
            // Detect tap
            if (distance < 10 && touchDuration < this.touchConfig.tapDelay) {
                const now = Date.now();
                
                // Check for double tap
                if (now - this.lastTapTime < this.touchConfig.doubleTapDelay) {
                    this.handleDoubleTap(pswp, touchEndPos);
                    this.lastTapTime = 0;
                } else {
                    this.lastTapTime = now;
                    
                    // Single tap handling
                    setTimeout(() => {
                        if (this.lastTapTime === now) {
                            this.handleSingleTap(pswp, touchEndPos);
                        }
                    }, this.touchConfig.doubleTapDelay);
                }
            }
            
            // Detect swipe
            if (distance > this.touchConfig.swipeThreshold) {
                const swipeDirection = this.getSwipeDirection(this.touchStartPos, touchEndPos);
                this.handleSwipe(pswp, swipeDirection);
            }
            
            // Reset
            this.isMultiTouch = false;
            gestureState = 'none';
        }, { passive: true });
        
        // Long press detection
        let longPressTimer: number | null = null;
        
        element.addEventListener('touchstart', (e) => {
            longPressTimer = window.setTimeout(() => {
                this.handleLongPress(pswp, { x: e.touches[0].clientX, y: e.touches[0].clientY });
                this.triggerHapticFeedback('heavy');
            }, this.touchConfig.longPressDelay);
        });
        
        element.addEventListener('touchend', () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });
        
        element.addEventListener('touchmove', () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });
    }
    
    /**
     * Get distance between two touch points
     */
    private getDistance(touch1: Touch, touch2: Touch): number {
        return Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
    }
    
    /**
     * Get swipe direction
     */
    private getSwipeDirection(start: { x: number; y: number }, end: { x: number; y: number }): string {
        const deltaX = end.x - start.x;
        const deltaY = end.y - start.y;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            return deltaX > 0 ? 'right' : 'left';
        } else {
            return deltaY > 0 ? 'down' : 'up';
        }
    }
    
    /**
     * Handle single tap
     */
    private handleSingleTap(pswp: PhotoSwipe, pos: { x: number; y: number }): void {
        // Toggle UI visibility
        if (pswp.ui) {
            pswp.ui.toggle();
        }
        
        this.announce('Controls toggled');
    }
    
    /**
     * Handle double tap
     */
    private handleDoubleTap(pswp: PhotoSwipe, pos: { x: number; y: number }): void {
        // Zoom in/out at tap position
        const currZoom = pswp.currSlide?.currZoomLevel || 1;
        const destZoom = currZoom === 1 ? 2 : 1;
        
        if (pswp.currSlide) {
            pswp.currSlide.zoomTo(destZoom, pos, 333);
        }
        
        this.triggerHapticFeedback('light');
        this.announce(destZoom > 1 ? 'Zoomed in' : 'Zoomed out');
    }
    
    /**
     * Handle swipe gesture
     */
    private handleSwipe(pswp: PhotoSwipe, direction: string): void {
        switch (direction) {
            case 'left':
                pswp.next();
                this.announce('Next image');
                break;
            case 'right':
                pswp.prev();
                this.announce('Previous image');
                break;
            case 'up':
                // Could trigger additional info display
                this.showImageInfo(pswp);
                break;
            case 'down':
                // Could close gallery on swipe down
                if (pswp.currSlide?.currZoomLevel === 1) {
                    pswp.close();
                }
                break;
        }
        
        this.triggerHapticFeedback('light');
    }
    
    /**
     * Handle long press
     */
    private handleLongPress(pswp: PhotoSwipe, pos: { x: number; y: number }): void {
        // Show context menu or image options
        this.showContextMenu(pswp, pos);
    }
    
    /**
     * Trigger haptic feedback
     */
    private triggerHapticFeedback(style: 'light' | 'medium' | 'heavy' = 'light'): void {
        if (!this.touchConfig.hapticFeedback || !this.deviceCapabilities.hasHapticSupport) {
            return;
        }
        
        const duration = style === 'light' ? 10 : style === 'medium' ? 20 : 30;
        
        if ('vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    }
    
    /**
     * Enhance keyboard navigation
     */
    private enhanceKeyboardNavigation(pswp: PhotoSwipe): void {
        const keyboardHandler = (e: KeyboardEvent) => {
            // Don't handle if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }
            
            let handled = true;
            
            switch (e.key) {
                case 'ArrowLeft':
                    pswp.prev();
                    this.announce('Previous image');
                    break;
                case 'ArrowRight':
                    pswp.next();
                    this.announce('Next image');
                    break;
                case 'ArrowUp':
                    this.zoomIn(pswp);
                    break;
                case 'ArrowDown':
                    this.zoomOut(pswp);
                    break;
                case ' ': // Space
                    e.preventDefault();
                    this.toggleSlideshow(pswp);
                    break;
                case 'f':
                case 'F':
                    this.toggleFullscreen(pswp);
                    break;
                case 't':
                case 'T':
                    this.toggleThumbnails(pswp);
                    break;
                case 'i':
                case 'I':
                    this.showImageInfo(pswp);
                    break;
                case '?':
                    this.showKeyboardHelp();
                    break;
                case 'Escape':
                    if (this.keyboardHelpDialog?.style.display !== 'none') {
                        this.hideKeyboardHelp();
                    } else {
                        pswp.close();
                    }
                    break;
                case 'Home':
                    pswp.goTo(0);
                    this.announce('First image');
                    break;
                case 'End':
                    pswp.goTo(pswp.getNumItems() - 1);
                    this.announce('Last image');
                    break;
                case 'PageUp':
                    // Jump back 5 images
                    pswp.goTo(Math.max(0, pswp.currIndex - 5));
                    break;
                case 'PageDown':
                    // Jump forward 5 images
                    pswp.goTo(Math.min(pswp.getNumItems() - 1, pswp.currIndex + 5));
                    break;
                default:
                    // Check for number keys (1-9) for quick navigation
                    if (e.key >= '1' && e.key <= '9') {
                        const index = parseInt(e.key) - 1;
                        if (index < pswp.getNumItems()) {
                            pswp.goTo(index);
                            this.announce(`Image ${index + 1}`);
                        }
                    } else {
                        handled = false;
                    }
            }
            
            if (handled) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        
        // Add keyboard listener
        document.addEventListener('keydown', keyboardHandler);
        
        // Clean up on close
        pswp.on('close', () => {
            document.removeEventListener('keydown', keyboardHandler);
        });
    }
    
    /**
     * Zoom in
     */
    private zoomIn(pswp: PhotoSwipe): void {
        const currZoom = pswp.currSlide?.currZoomLevel || 1;
        const newZoom = Math.min(currZoom * 1.5, 4);
        
        if (pswp.currSlide) {
            pswp.currSlide.zoomTo(
                newZoom,
                { x: pswp.viewportSize.x / 2, y: pswp.viewportSize.y / 2 },
                333
            );
        }
        
        this.announce(`Zoom ${Math.round(newZoom * 100)}%`);
    }
    
    /**
     * Zoom out
     */
    private zoomOut(pswp: PhotoSwipe): void {
        const currZoom = pswp.currSlide?.currZoomLevel || 1;
        const newZoom = Math.max(currZoom / 1.5, 1);
        
        if (pswp.currSlide) {
            pswp.currSlide.zoomTo(
                newZoom,
                { x: pswp.viewportSize.x / 2, y: pswp.viewportSize.y / 2 },
                333
            );
        }
        
        this.announce(`Zoom ${Math.round(newZoom * 100)}%`);
    }
    
    /**
     * Toggle slideshow
     */
    private toggleSlideshow(pswp: PhotoSwipe): void {
        // This would integrate with gallery manager's slideshow functionality
        const event = new CustomEvent('photoswipe:toggle-slideshow', { detail: { pswp } });
        document.dispatchEvent(event);
        
        this.announce('Slideshow toggled');
    }
    
    /**
     * Toggle fullscreen
     */
    private toggleFullscreen(pswp: PhotoSwipe): void {
        if (!document.fullscreenElement) {
            pswp.template?.requestFullscreen();
            this.announce('Entered fullscreen');
        } else {
            document.exitFullscreen();
            this.announce('Exited fullscreen');
        }
    }
    
    /**
     * Toggle thumbnails
     */
    private toggleThumbnails(pswp: PhotoSwipe): void {
        const event = new CustomEvent('photoswipe:toggle-thumbnails', { detail: { pswp } });
        document.dispatchEvent(event);
        
        this.announce('Thumbnails toggled');
    }
    
    /**
     * Show image information
     */
    private showImageInfo(pswp: PhotoSwipe): void {
        const currentItem = pswp.currSlide?.data;
        if (!currentItem) return;
        
        const info = `
            Image ${pswp.currIndex + 1} of ${pswp.getNumItems()}.
            ${currentItem.alt || 'No description available'}.
            ${currentItem.title ? `Title: ${currentItem.title}.` : ''}
            ${currentItem.width && currentItem.height ? `Dimensions: ${currentItem.width} by ${currentItem.height} pixels.` : ''}
        `;
        
        this.announce(info);
    }
    
    /**
     * Show context menu
     */
    private showContextMenu(pswp: PhotoSwipe, pos: { x: number; y: number }): void {
        // Create context menu
        const menu = document.createElement('div');
        menu.className = 'photoswipe-context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${pos.x}px;
            top: ${pos.y}px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            min-width: 200px;
        `;
        
        const options = [
            { label: 'Copy Image', action: () => this.copyImage(pswp) },
            { label: 'Save Image', action: () => this.saveImage(pswp) },
            { label: 'Share', action: () => this.shareImage(pswp) },
            { label: 'Image Info', action: () => this.showImageInfo(pswp) }
        ];
        
        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option.label;
            button.style.cssText = `
                display: block;
                width: 100%;
                padding: 10px;
                border: none;
                background: none;
                text-align: left;
                cursor: pointer;
                min-height: 44px;
            `;
            button.addEventListener('click', () => {
                option.action();
                menu.remove();
            });
            menu.appendChild(button);
        });
        
        document.body.appendChild(menu);
        
        // Remove on click outside
        setTimeout(() => {
            const removeMenu = () => {
                menu.remove();
                document.removeEventListener('click', removeMenu);
            };
            document.addEventListener('click', removeMenu);
        }, 100);
    }
    
    /**
     * Copy image to clipboard
     */
    private async copyImage(pswp: PhotoSwipe): Promise<void> {
        const currentItem = pswp.currSlide?.data;
        if (!currentItem || !currentItem.src) return;
        
        try {
            // Fetch image as blob
            const response = await fetch(currentItem.src);
            const blob = await response.blob();
            
            // Copy to clipboard if supported
            if ('ClipboardItem' in window) {
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob })
                ]);
                this.announce('Image copied to clipboard');
            }
        } catch (error) {
            console.error('Failed to copy image:', error);
            this.announce('Failed to copy image');
        }
    }
    
    /**
     * Save image
     */
    private saveImage(pswp: PhotoSwipe): void {
        const currentItem = pswp.currSlide?.data;
        if (!currentItem || !currentItem.src) return;
        
        // Create download link
        const link = document.createElement('a');
        link.href = currentItem.src;
        link.download = currentItem.title || 'image';
        link.click();
        
        this.announce('Downloading image');
    }
    
    /**
     * Share image
     */
    private async shareImage(pswp: PhotoSwipe): Promise<void> {
        const currentItem = pswp.currSlide?.data;
        if (!currentItem || !currentItem.src) return;
        
        if ('share' in navigator) {
            try {
                await navigator.share({
                    title: currentItem.title || 'Image',
                    text: currentItem.alt || '',
                    url: currentItem.src
                });
                this.announce('Sharing options opened');
            } catch (error) {
                // User cancelled or share failed
                console.log('Share cancelled or failed:', error);
            }
        } else {
            // Fallback: Copy URL to clipboard
            await navigator.clipboard.writeText(currentItem.src);
            this.announce('Image URL copied to clipboard');
        }
    }
    
    /**
     * Show keyboard help
     */
    private showKeyboardHelp(): void {
        if (!this.keyboardHelpDialog) return;
        
        this.keyboardHelpDialog.style.display = 'block';
        this.keyboardHelpDialog.style.cssText += `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10001;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        // Setup focus trap
        this.setupFocusTrap(this.keyboardHelpDialog);
        
        // Close button handler
        const closeBtn = this.keyboardHelpDialog.querySelector('.close-help');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideKeyboardHelp());
        }
        
        this.announce('Keyboard shortcuts help opened');
    }
    
    /**
     * Hide keyboard help
     */
    private hideKeyboardHelp(): void {
        if (!this.keyboardHelpDialog) return;
        
        this.keyboardHelpDialog.style.display = 'none';
        this.removeFocusTrap();
        
        this.announce('Keyboard shortcuts help closed');
    }
    
    /**
     * Setup focus trap for modal dialogs
     */
    private setupFocusTrap(element: HTMLElement): void {
        this.focusTrap = new FocusTrap(element);
        this.focusTrap.activate();
    }
    
    /**
     * Remove focus trap
     */
    private removeFocusTrap(): void {
        if (this.focusTrap) {
            this.focusTrap.deactivate();
            this.focusTrap = null;
        }
    }
    
    /**
     * Enhance accessibility
     */
    private enhanceAccessibility(pswp: PhotoSwipe): void {
        const template = pswp.template;
        if (!template) return;
        
        // Add ARIA attributes to main container
        template.setAttribute('role', 'dialog');
        template.setAttribute('aria-label', 'Image gallery');
        template.setAttribute('aria-modal', 'true');
        
        // Add ARIA live region for updates
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'photoswipe-aria-live';
        liveRegion.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        template.appendChild(liveRegion);
        
        // Update on slide change
        pswp.on('change', () => {
            const current = pswp.currIndex + 1;
            const total = pswp.getNumItems();
            const currentItem = pswp.currSlide?.data;
            
            const announcement = `Image ${current} of ${total}. ${currentItem?.alt || 'No description available'}`;
            this.announce(announcement);
            
            // Update aria-label
            template.setAttribute('aria-label', `Image gallery - ${announcement}`);
        });
        
        // Add ARIA labels to controls
        this.labelControls(template);
        
        // Setup focus management
        this.setupFocusManagement(pswp);
    }
    
    /**
     * Label controls for screen readers
     */
    private labelControls(container: Element): void {
        // Previous button
        const prevBtn = container.querySelector('.pswp__button--arrow--prev');
        if (prevBtn) {
            prevBtn.setAttribute('aria-label', 'Previous image');
            prevBtn.setAttribute('role', 'button');
        }
        
        // Next button
        const nextBtn = container.querySelector('.pswp__button--arrow--next');
        if (nextBtn) {
            nextBtn.setAttribute('aria-label', 'Next image');
            nextBtn.setAttribute('role', 'button');
        }
        
        // Close button
        const closeBtn = container.querySelector('.pswp__button--close');
        if (closeBtn) {
            closeBtn.setAttribute('aria-label', 'Close gallery');
            closeBtn.setAttribute('role', 'button');
        }
        
        // Zoom button
        const zoomBtn = container.querySelector('.pswp__button--zoom');
        if (zoomBtn) {
            zoomBtn.setAttribute('aria-label', 'Zoom in/out');
            zoomBtn.setAttribute('role', 'button');
        }
        
        // Fullscreen button
        const fsBtn = container.querySelector('.pswp__button--fs');
        if (fsBtn) {
            fsBtn.setAttribute('aria-label', 'Toggle fullscreen');
            fsBtn.setAttribute('role', 'button');
        }
    }
    
    /**
     * Setup focus management
     */
    private setupFocusManagement(pswp: PhotoSwipe): void {
        const template = pswp.template;
        if (!template) return;
        
        // Store previously focused element
        const previouslyFocused = document.activeElement as HTMLElement;
        
        // Focus first focusable element on open
        pswp.on('openingAnimationEnd', () => {
            const firstFocusable = template.querySelector<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (firstFocusable) {
                firstFocusable.focus();
            }
        });
        
        // Restore focus on close
        pswp.on('close', () => {
            if (previouslyFocused) {
                previouslyFocused.focus();
            }
        });
        
        // Trap focus within gallery
        template.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const focusables = template.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                
                if (focusables.length === 0) return;
                
                const firstFocusable = focusables[0];
                const lastFocusable = focusables[focusables.length - 1];
                
                if (e.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        });
    }
    
    /**
     * Optimize mobile UI
     */
    private optimizeMobileUI(pswp: PhotoSwipe): void {
        if (!this.deviceCapabilities.isMobile && !this.deviceCapabilities.isTablet) {
            return;
        }
        
        const template = pswp.template;
        if (!template) return;
        
        // Ensure minimum touch target sizes
        const buttons = template.querySelectorAll<HTMLElement>('button, .pswp__button');
        buttons.forEach(button => {
            const rect = button.getBoundingClientRect();
            const minSize = this.mobileUIConfig.minTouchTargetSize;
            
            if (rect.width < minSize || rect.height < minSize) {
                button.style.minWidth = `${minSize}px`;
                button.style.minHeight = `${minSize}px`;
                button.style.padding = '10px';
            }
        });
        
        // Add bottom sheet for mobile controls
        if (this.mobileUIConfig.bottomSheetEnabled) {
            this.createBottomSheet(pswp);
        }
        
        // Add swipe indicators
        if (this.mobileUIConfig.swipeIndicators) {
            this.addSwipeIndicators(template);
        }
        
        // Add gesture hints
        if (this.mobileUIConfig.gestureHints) {
            this.showGestureHints(template);
        }
    }
    
    /**
     * Create bottom sheet for mobile controls
     */
    private createBottomSheet(pswp: PhotoSwipe): void {
        const sheet = document.createElement('div');
        sheet.className = 'photoswipe-bottom-sheet';
        sheet.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            display: flex;
            justify-content: space-around;
            align-items: center;
            z-index: 100;
            transform: translateY(100%);
            transition: transform 0.3s ease;
        `;
        
        // Add controls
        const controls = [
            { icon: '←', label: 'Previous', action: () => pswp.prev() },
            { icon: '→', label: 'Next', action: () => pswp.next() },
            { icon: '🔍', label: 'Zoom', action: () => this.toggleZoom(pswp) },
            { icon: 'ℹ️', label: 'Info', action: () => this.showImageInfo(pswp) },
            { icon: '✕', label: 'Close', action: () => pswp.close() }
        ];
        
        controls.forEach(control => {
            const button = document.createElement('button');
            button.innerHTML = control.icon;
            button.setAttribute('aria-label', control.label);
            button.style.cssText = `
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                min-width: 44px;
                min-height: 44px;
                cursor: pointer;
            `;
            button.addEventListener('click', control.action);
            sheet.appendChild(button);
        });
        
        pswp.template?.appendChild(sheet);
        
        // Show on tap
        let sheetVisible = false;
        pswp.template?.addEventListener('click', () => {
            sheetVisible = !sheetVisible;
            sheet.style.transform = sheetVisible ? 'translateY(0)' : 'translateY(100%)';
        });
    }
    
    /**
     * Toggle zoom
     */
    private toggleZoom(pswp: PhotoSwipe): void {
        const currZoom = pswp.currSlide?.currZoomLevel || 1;
        const newZoom = currZoom === 1 ? 2 : 1;
        
        if (pswp.currSlide) {
            pswp.currSlide.zoomTo(
                newZoom,
                { x: pswp.viewportSize.x / 2, y: pswp.viewportSize.y / 2 },
                333
            );
        }
    }
    
    /**
     * Add swipe indicators
     */
    private addSwipeIndicators(container: Element): void {
        const indicators = document.createElement('div');
        indicators.className = 'photoswipe-swipe-indicators';
        indicators.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        
        indicators.innerHTML = `
            <div style="display: flex; gap: 20px; align-items: center;">
                <span style="font-size: 30px; color: white;">←</span>
                <span style="color: white;">Swipe</span>
                <span style="font-size: 30px; color: white;">→</span>
            </div>
        `;
        
        container.appendChild(indicators);
        
        // Show briefly on load
        setTimeout(() => {
            indicators.style.opacity = '0.7';
            setTimeout(() => {
                indicators.style.opacity = '0';
            }, 2000);
        }, 500);
    }
    
    /**
     * Show gesture hints
     */
    private showGestureHints(container: Element): void {
        const hints = [
            'Pinch to zoom',
            'Double tap to zoom',
            'Swipe to navigate'
        ];
        
        const hintsContainer = document.createElement('div');
        hintsContainer.className = 'photoswipe-gesture-hints';
        hintsContainer.style.cssText = `
            position: absolute;
            top: 60px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
        `;
        
        let currentHint = 0;
        const showNextHint = () => {
            if (currentHint >= hints.length) return;
            
            hintsContainer.textContent = hints[currentHint];
            hintsContainer.style.opacity = '1';
            
            setTimeout(() => {
                hintsContainer.style.opacity = '0';
                currentHint++;
                
                if (currentHint < hints.length) {
                    setTimeout(showNextHint, 1000);
                }
            }, 2000);
        };
        
        container.appendChild(hintsContainer);
        
        // Start showing hints after a delay
        setTimeout(showNextHint, 1000);
    }
    
    /**
     * Apply performance optimizations
     */
    private applyPerformanceOptimizations(pswp: PhotoSwipe): void {
        // Optimize image loading based on device
        pswp.on('contentLoad', (e) => {
            const { content } = e;
            
            if (content.type === 'image' && content.data) {
                // Apply adaptive quality
                if (this.performanceConfig.adaptiveQuality) {
                    this.optimizeImageQuality(content);
                }
                
                // Setup lazy loading
                this.setupLazyLoading(pswp, content);
            }
        });
        
        // Optimize animations for reduced motion
        if (this.deviceCapabilities.reducedMotion) {
            pswp.options.showAnimationDuration = 0;
            pswp.options.hideAnimationDuration = 0;
        }
        
        // Optimize for high contrast mode
        if (this.deviceCapabilities.highContrast) {
            this.applyHighContrastStyles(pswp);
        }
    }
    
    /**
     * Optimize image quality based on device
     */
    private optimizeImageQuality(content: any): void {
        const img = content.data as HTMLImageElement;
        
        // Set image rendering based on device capabilities
        if (this.deviceCapabilities.memoryLimit === 'low') {
            img.style.imageRendering = 'pixelated';
        } else {
            img.style.imageRendering = 'auto';
        }
        
        // Apply will-change for smooth transforms on capable devices
        if (this.deviceCapabilities.memoryLimit !== 'low') {
            img.style.willChange = 'transform';
        }
    }
    
    /**
     * Setup lazy loading
     */
    private setupLazyLoading(pswp: PhotoSwipe, content: any): void {
        // Preload adjacent images based on configuration
        const preloadDistance = this.performanceConfig.lazyLoadDistance;
        const currentIndex = pswp.currIndex;
        
        for (let i = 1; i <= preloadDistance; i++) {
            // Preload next images
            const nextIndex = currentIndex + i;
            if (nextIndex < pswp.getNumItems()) {
                this.preloadImage(pswp, nextIndex);
            }
            
            // Preload previous images
            const prevIndex = currentIndex - i;
            if (prevIndex >= 0) {
                this.preloadImage(pswp, prevIndex);
            }
        }
    }
    
    /**
     * Preload an image
     */
    private preloadImage(pswp: PhotoSwipe, index: number): void {
        const item = pswp.options.dataSource?.[index];
        if (!item || !item.src) return;
        
        const img = new Image();
        img.src = item.src;
    }
    
    /**
     * Apply high contrast styles
     */
    private applyHighContrastStyles(pswp: PhotoSwipe): void {
        const template = pswp.template;
        if (!template) return;
        
        template.style.cssText += `
            outline: 2px solid white;
            outline-offset: -2px;
        `;
        
        // Enhance button contrast
        const buttons = template.querySelectorAll<HTMLElement>('button');
        buttons.forEach(button => {
            button.style.cssText += `
                border: 2px solid white;
                background: black;
                color: white;
            `;
        });
    }
    
    /**
     * Setup battery optimization
     */
    private setupBatteryOptimization(pswp: PhotoSwipe): void {
        if (!('getBattery' in navigator)) return;
        
        (navigator as any).getBattery().then((battery: any) => {
            const adjustForBattery = () => {
                if (battery.charging) {
                    // Full quality when charging
                    this.performanceConfig.adaptiveQuality = false;
                    this.performanceConfig.maxImageSize = this.getMaxImageSize();
                } else if (battery.level < 0.2) {
                    // Aggressive optimization on low battery
                    this.performanceConfig.adaptiveQuality = true;
                    this.performanceConfig.maxImageSize = 1280;
                    this.performanceConfig.cacheStrategy = 'minimal';
                    
                    this.announce('Low battery mode activated');
                }
            };
            
            // Initial check
            adjustForBattery();
            
            // Monitor battery changes
            battery.addEventListener('levelchange', adjustForBattery);
            battery.addEventListener('chargingchange', adjustForBattery);
        });
    }
    
    /**
     * Announce to screen readers
     */
    private announce(message: string): void {
        if (!this.a11yConfig.enableScreenReaderAnnouncements || !this.liveRegion) {
            return;
        }
        
        this.liveRegion.textContent = message;
        
        // Clear after announcement
        setTimeout(() => {
            if (this.liveRegion) {
                this.liveRegion.textContent = '';
            }
        }, 1000);
    }
    
    /**
     * Update configuration
     */
    updateConfig(config: MobileA11yConfig): void {
        if (config.touch) {
            this.touchConfig = { ...this.touchConfig, ...config.touch };
        }
        
        if (config.a11y) {
            this.a11yConfig = { ...this.a11yConfig, ...config.a11y };
            
            // Update live region if needed
            if (this.liveRegion) {
                this.liveRegion.setAttribute('aria-live', this.a11yConfig.ariaLiveRegion);
            }
        }
        
        if (config.mobileUI) {
            this.mobileUIConfig = { ...this.mobileUIConfig, ...config.mobileUI };
        }
        
        if (config.performance) {
            this.performanceConfig = { ...this.performanceConfig, ...config.performance };
        }
    }
    
    /**
     * Cleanup resources
     */
    cleanup(): void {
        // Remove live region
        if (this.liveRegion) {
            this.liveRegion.remove();
            this.liveRegion = null;
        }
        
        // Remove keyboard help dialog
        if (this.keyboardHelpDialog) {
            this.keyboardHelpDialog.remove();
            this.keyboardHelpDialog = null;
        }
        
        // Stop performance monitoring
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
            this.performanceObserver = null;
        }
        
        // Clean up focus trap
        this.removeFocusTrap();
    }
}

/**
 * Focus trap utility
 */
class FocusTrap {
    private element: HTMLElement;
    private previouslyFocused: HTMLElement | null = null;
    private handleKeyDown: (e: KeyboardEvent) => void;
    
    constructor(element: HTMLElement) {
        this.element = element;
        this.handleKeyDown = this.onKeyDown.bind(this);
    }
    
    activate(): void {
        this.previouslyFocused = document.activeElement as HTMLElement;
        
        // Focus first focusable element
        const firstFocusable = this.element.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (firstFocusable) {
            firstFocusable.focus();
        }
        
        document.addEventListener('keydown', this.handleKeyDown);
    }
    
    deactivate(): void {
        document.removeEventListener('keydown', this.handleKeyDown);
        
        if (this.previouslyFocused) {
            this.previouslyFocused.focus();
        }
    }
    
    private onKeyDown(e: KeyboardEvent): void {
        if (e.key !== 'Tab') return;
        
        const focusables = this.element.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusables.length === 0) return;
        
        const firstFocusable = focusables[0];
        const lastFocusable = focusables[focusables.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }
}

// Export singleton instance
export default PhotoSwipeMobileA11yService.getInstance();