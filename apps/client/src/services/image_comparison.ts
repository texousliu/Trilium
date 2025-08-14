/**
 * Image Comparison Module for Trilium Notes
 * Provides side-by-side and overlay comparison modes for images
 */

import mediaViewer from './media_viewer.js';
import utils from './utils.js';

/**
 * Comparison mode types
 */
export type ComparisonMode = 'side-by-side' | 'overlay' | 'swipe' | 'difference';

/**
 * Image comparison configuration
 */
export interface ComparisonConfig {
    mode: ComparisonMode;
    syncZoom: boolean;
    syncPan: boolean;
    showLabels: boolean;
    swipePosition?: number; // For swipe mode (0-100)
    opacity?: number; // For overlay mode (0-1)
    highlightDifferences?: boolean; // For difference mode
}

/**
 * Comparison state
 */
interface ComparisonState {
    leftImage: ComparisonImage;
    rightImage: ComparisonImage;
    config: ComparisonConfig;
    container?: HTMLElement;
    isActive: boolean;
}

/**
 * Image data for comparison
 */
export interface ComparisonImage {
    src: string;
    title?: string;
    noteId?: string;
    width?: number;
    height?: number;
}

/**
 * ImageComparisonService provides various comparison modes for images
 */
class ImageComparisonService {
    private static instance: ImageComparisonService;
    private currentComparison: ComparisonState | null = null;
    private comparisonContainer?: HTMLElement;
    private leftCanvas?: HTMLCanvasElement;
    private rightCanvas?: HTMLCanvasElement;
    private leftContext?: CanvasRenderingContext2D;
    private rightContext?: CanvasRenderingContext2D;
    private swipeHandle?: HTMLElement;
    private isDraggingSwipe: boolean = false;
    private currentZoom: number = 1;
    private panX: number = 0;
    private panY: number = 0;
    
    private defaultConfig: ComparisonConfig = {
        mode: 'side-by-side',
        syncZoom: true,
        syncPan: true,
        showLabels: true,
        swipePosition: 50,
        opacity: 0.5,
        highlightDifferences: false
    };

    private constructor() {}

    static getInstance(): ImageComparisonService {
        if (!ImageComparisonService.instance) {
            ImageComparisonService.instance = new ImageComparisonService();
        }
        return ImageComparisonService.instance;
    }

    /**
     * Start image comparison
     */
    async startComparison(
        leftImage: ComparisonImage,
        rightImage: ComparisonImage,
        container: HTMLElement,
        config?: Partial<ComparisonConfig>
    ): Promise<void> {
        try {
            // Close any existing comparison
            this.closeComparison();

            // Merge configuration
            const finalConfig = { ...this.defaultConfig, ...config };

            // Initialize state
            this.currentComparison = {
                leftImage,
                rightImage,
                config: finalConfig,
                container,
                isActive: true
            };

            // Load images
            await this.loadImages(leftImage, rightImage);

            // Create comparison UI based on mode
            switch (finalConfig.mode) {
                case 'side-by-side':
                    await this.createSideBySideComparison(container);
                    break;
                case 'overlay':
                    await this.createOverlayComparison(container);
                    break;
                case 'swipe':
                    await this.createSwipeComparison(container);
                    break;
                case 'difference':
                    await this.createDifferenceComparison(container);
                    break;
            }

            // Add controls
            this.addComparisonControls(container);
        } catch (error) {
            console.error('Failed to start image comparison:', error);
            this.closeComparison();
            throw error;
        }
    }

    /**
     * Load images and get dimensions
     */
    private async loadImages(leftImage: ComparisonImage, rightImage: ComparisonImage): Promise<void> {
        const loadImage = (src: string): Promise<HTMLImageElement> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
                img.src = src;
            });
        };

        const [leftImg, rightImg] = await Promise.all([
            loadImage(leftImage.src),
            loadImage(rightImage.src)
        ]);

        // Update dimensions
        leftImage.width = leftImg.naturalWidth;
        leftImage.height = leftImg.naturalHeight;
        rightImage.width = rightImg.naturalWidth;
        rightImage.height = rightImg.naturalHeight;
    }

    /**
     * Create side-by-side comparison
     */
    private async createSideBySideComparison(container: HTMLElement): Promise<void> {
        if (!this.currentComparison) return;

        // Clear container
        container.innerHTML = '';
        container.style.cssText = `
            display: flex;
            width: 100%;
            height: 100%;
            position: relative;
            background: #1a1a1a;
        `;

        // Create left panel
        const leftPanel = document.createElement('div');
        leftPanel.className = 'comparison-panel comparison-left';
        leftPanel.style.cssText = `
            flex: 1;
            position: relative;
            overflow: hidden;
            border-right: 2px solid #333;
        `;

        // Create right panel
        const rightPanel = document.createElement('div');
        rightPanel.className = 'comparison-panel comparison-right';
        rightPanel.style.cssText = `
            flex: 1;
            position: relative;
            overflow: hidden;
        `;

        // Add images
        const leftImg = await this.createImageElement(this.currentComparison.leftImage);
        const rightImg = await this.createImageElement(this.currentComparison.rightImage);
        
        leftPanel.appendChild(leftImg);
        rightPanel.appendChild(rightImg);

        // Add labels if enabled
        if (this.currentComparison.config.showLabels) {
            this.addImageLabel(leftPanel, this.currentComparison.leftImage.title || 'Image 1');
            this.addImageLabel(rightPanel, this.currentComparison.rightImage.title || 'Image 2');
        }

        container.appendChild(leftPanel);
        container.appendChild(rightPanel);

        // Setup synchronized zoom and pan if enabled
        if (this.currentComparison.config.syncZoom || this.currentComparison.config.syncPan) {
            this.setupSynchronizedControls(leftPanel, rightPanel);
        }
    }

    /**
     * Create overlay comparison
     */
    private async createOverlayComparison(container: HTMLElement): Promise<void> {
        if (!this.currentComparison) return;

        container.innerHTML = '';
        container.style.cssText = `
            position: relative;
            width: 100%;
            height: 100%;
            background: #1a1a1a;
            overflow: hidden;
        `;

        // Create base image
        const baseImg = await this.createImageElement(this.currentComparison.leftImage);
        baseImg.style.position = 'absolute';
        baseImg.style.zIndex = '1';
        
        // Create overlay image
        const overlayImg = await this.createImageElement(this.currentComparison.rightImage);
        overlayImg.style.position = 'absolute';
        overlayImg.style.zIndex = '2';
        overlayImg.style.opacity = String(this.currentComparison.config.opacity || 0.5);
        
        container.appendChild(baseImg);
        container.appendChild(overlayImg);

        // Add opacity slider
        this.addOpacityControl(container, overlayImg);

        // Add labels
        if (this.currentComparison.config.showLabels) {
            const labelContainer = document.createElement('div');
            labelContainer.style.cssText = `
                position: absolute;
                top: 10px;
                left: 10px;
                z-index: 10;
                display: flex;
                gap: 10px;
            `;
            
            const baseLabel = this.createLabel(this.currentComparison.leftImage.title || 'Base', '#4CAF50');
            const overlayLabel = this.createLabel(this.currentComparison.rightImage.title || 'Overlay', '#2196F3');
            
            labelContainer.appendChild(baseLabel);
            labelContainer.appendChild(overlayLabel);
            container.appendChild(labelContainer);
        }
    }

    /**
     * Create swipe comparison
     */
    private async createSwipeComparison(container: HTMLElement): Promise<void> {
        if (!this.currentComparison) return;

        container.innerHTML = '';
        container.style.cssText = `
            position: relative;
            width: 100%;
            height: 100%;
            background: #1a1a1a;
            overflow: hidden;
            cursor: ew-resize;
        `;

        // Create images
        const leftImg = await this.createImageElement(this.currentComparison.leftImage);
        const rightImg = await this.createImageElement(this.currentComparison.rightImage);
        
        leftImg.style.position = 'absolute';
        leftImg.style.zIndex = '1';
        
        // Create clipping container for right image
        const clipContainer = document.createElement('div');
        clipContainer.className = 'swipe-clip-container';
        clipContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: ${this.currentComparison.config.swipePosition}%;
            height: 100%;
            overflow: hidden;
            z-index: 2;
        `;
        
        rightImg.style.position = 'absolute';
        clipContainer.appendChild(rightImg);
        
        // Create swipe handle
        this.swipeHandle = document.createElement('div');
        this.swipeHandle.className = 'swipe-handle';
        this.swipeHandle.style.cssText = `
            position: absolute;
            top: 0;
            left: ${this.currentComparison.config.swipePosition}%;
            width: 4px;
            height: 100%;
            background: white;
            cursor: ew-resize;
            z-index: 3;
            transform: translateX(-50%);
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
        `;

        // Add handle icon
        const handleIcon = document.createElement('div');
        handleIcon.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        handleIcon.innerHTML = '<i class="bx bx-move-horizontal" style="font-size: 24px; color: #333;"></i>';
        this.swipeHandle.appendChild(handleIcon);

        container.appendChild(leftImg);
        container.appendChild(clipContainer);
        container.appendChild(this.swipeHandle);

        // Setup swipe interaction
        this.setupSwipeInteraction(container, clipContainer);

        // Add labels
        if (this.currentComparison.config.showLabels) {
            this.addSwipeLabels(container);
        }
    }

    /**
     * Create difference comparison using canvas
     */
    private async createDifferenceComparison(container: HTMLElement): Promise<void> {
        if (!this.currentComparison) return;

        container.innerHTML = '';
        container.style.cssText = `
            position: relative;
            width: 100%;
            height: 100%;
            background: #1a1a1a;
            overflow: hidden;
        `;

        // Create canvas for difference visualization
        const canvas = document.createElement('canvas');
        canvas.className = 'difference-canvas';
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        // Load images
        const leftImg = new Image();
        const rightImg = new Image();
        
        await Promise.all([
            new Promise((resolve) => {
                leftImg.onload = resolve;
                leftImg.src = this.currentComparison!.leftImage.src;
            }),
            new Promise((resolve) => {
                rightImg.onload = resolve;
                rightImg.src = this.currentComparison!.rightImage.src;
            })
        ]);

        // Set canvas size
        const maxWidth = Math.max(leftImg.width, rightImg.width);
        const maxHeight = Math.max(leftImg.height, rightImg.height);
        canvas.width = maxWidth;
        canvas.height = maxHeight;

        // Calculate difference
        this.calculateImageDifference(ctx, leftImg, rightImg, maxWidth, maxHeight);

        // Style canvas
        canvas.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        `;

        container.appendChild(canvas);

        // Add difference statistics
        this.addDifferenceStatistics(container, ctx, maxWidth, maxHeight);
    }

    /**
     * Calculate and visualize image difference
     */
    private calculateImageDifference(
        ctx: CanvasRenderingContext2D,
        leftImg: HTMLImageElement,
        rightImg: HTMLImageElement,
        width: number,
        height: number
    ): void {
        // Draw left image
        ctx.drawImage(leftImg, 0, 0, width, height);
        const leftData = ctx.getImageData(0, 0, width, height);

        // Draw right image
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(rightImg, 0, 0, width, height);
        const rightData = ctx.getImageData(0, 0, width, height);

        // Calculate difference
        const diffData = ctx.createImageData(width, height);
        let totalDiff = 0;

        for (let i = 0; i < leftData.data.length; i += 4) {
            const rDiff = Math.abs(leftData.data[i] - rightData.data[i]);
            const gDiff = Math.abs(leftData.data[i + 1] - rightData.data[i + 1]);
            const bDiff = Math.abs(leftData.data[i + 2] - rightData.data[i + 2]);
            
            const avgDiff = (rDiff + gDiff + bDiff) / 3;
            totalDiff += avgDiff;

            if (this.currentComparison?.config.highlightDifferences && avgDiff > 30) {
                // Highlight differences in red
                diffData.data[i] = 255; // Red
                diffData.data[i + 1] = 0; // Green
                diffData.data[i + 2] = 0; // Blue
                diffData.data[i + 3] = Math.min(255, avgDiff * 2); // Alpha based on difference
            } else {
                // Show original image with reduced opacity for non-different areas
                diffData.data[i] = leftData.data[i];
                diffData.data[i + 1] = leftData.data[i + 1];
                diffData.data[i + 2] = leftData.data[i + 2];
                diffData.data[i + 3] = avgDiff > 10 ? 255 : 128;
            }
        }

        ctx.putImageData(diffData, 0, 0);
    }

    /**
     * Add difference statistics overlay
     */
    private addDifferenceStatistics(
        container: HTMLElement,
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number
    ): void {
        const imageData = ctx.getImageData(0, 0, width, height);
        let changedPixels = 0;
        const threshold = 30;

        for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            
            if (r > threshold || g > threshold || b > threshold) {
                changedPixels++;
            }
        }

        const totalPixels = width * height;
        const changePercentage = ((changedPixels / totalPixels) * 100).toFixed(2);

        const statsDiv = document.createElement('div');
        statsDiv.className = 'difference-stats';
        statsDiv.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10;
        `;
        
        statsDiv.innerHTML = `
            <div><strong>Difference Analysis</strong></div>
            <div>Changed pixels: ${changedPixels.toLocaleString()}</div>
            <div>Total pixels: ${totalPixels.toLocaleString()}</div>
            <div>Difference: ${changePercentage}%</div>
        `;
        
        container.appendChild(statsDiv);
    }

    /**
     * Create image element
     */
    private async createImageElement(image: ComparisonImage): Promise<HTMLImageElement> {
        const img = document.createElement('img');
        img.src = image.src;
        img.alt = image.title || 'Comparison image';
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
        `;
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });
        
        return img;
    }

    /**
     * Add image label
     */
    private addImageLabel(container: HTMLElement, text: string): void {
        const label = document.createElement('div');
        label.className = 'image-label';
        label.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10;
        `;
        label.textContent = text;
        container.appendChild(label);
    }

    /**
     * Create label element
     */
    private createLabel(text: string, color: string): HTMLElement {
        const label = document.createElement('div');
        label.style.cssText = `
            background: ${color};
            color: white;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
        `;
        label.textContent = text;
        return label;
    }

    /**
     * Add swipe labels
     */
    private addSwipeLabels(container: HTMLElement): void {
        if (!this.currentComparison) return;

        const leftLabel = document.createElement('div');
        leftLabel.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10;
        `;
        leftLabel.textContent = this.currentComparison.leftImage.title || 'Left';

        const rightLabel = document.createElement('div');
        rightLabel.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(33, 150, 243, 0.9);
            color: white;
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10;
        `;
        rightLabel.textContent = this.currentComparison.rightImage.title || 'Right';

        container.appendChild(leftLabel);
        container.appendChild(rightLabel);
    }

    /**
     * Setup swipe interaction
     */
    private setupSwipeInteraction(container: HTMLElement, clipContainer: HTMLElement): void {
        if (!this.swipeHandle) return;

        let startX = 0;
        let startPosition = this.currentComparison?.config.swipePosition || 50;

        const handleMouseMove = (e: MouseEvent) => {
            if (!this.isDraggingSwipe) return;
            
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
            
            clipContainer.style.width = `${percentage}%`;
            if (this.swipeHandle) {
                this.swipeHandle.style.left = `${percentage}%`;
            }
            
            if (this.currentComparison) {
                this.currentComparison.config.swipePosition = percentage;
            }
        };

        const handleMouseUp = () => {
            this.isDraggingSwipe = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            container.style.cursor = 'default';
        };

        this.swipeHandle.addEventListener('mousedown', (e) => {
            this.isDraggingSwipe = true;
            startX = e.clientX;
            startPosition = this.currentComparison?.config.swipePosition || 50;
            container.style.cursor = 'ew-resize';
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });

        // Also allow dragging anywhere in the container
        container.addEventListener('mousedown', (e) => {
            if (e.target === this.swipeHandle || (e.target as HTMLElement).parentElement === this.swipeHandle) {
                return;
            }
            
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = (x / rect.width) * 100;
            
            clipContainer.style.width = `${percentage}%`;
            if (this.swipeHandle) {
                this.swipeHandle.style.left = `${percentage}%`;
            }
            
            if (this.currentComparison) {
                this.currentComparison.config.swipePosition = percentage;
            }
        });
    }

    /**
     * Add opacity control for overlay mode
     */
    private addOpacityControl(container: HTMLElement, overlayImg: HTMLImageElement): void {
        const control = document.createElement('div');
        control.className = 'opacity-control';
        control.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 10;
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        const label = document.createElement('label');
        label.textContent = 'Opacity:';
        label.style.color = 'white';
        label.style.fontSize = '12px';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '100';
        slider.value = String((this.currentComparison?.config.opacity || 0.5) * 100);
        slider.style.width = '150px';

        const value = document.createElement('span');
        value.textContent = `${slider.value}%`;
        value.style.color = 'white';
        value.style.fontSize = '12px';
        value.style.minWidth = '35px';

        slider.addEventListener('input', () => {
            const opacity = parseInt(slider.value) / 100;
            overlayImg.style.opacity = String(opacity);
            value.textContent = `${slider.value}%`;
            
            if (this.currentComparison) {
                this.currentComparison.config.opacity = opacity;
            }
        });

        control.appendChild(label);
        control.appendChild(slider);
        control.appendChild(value);
        container.appendChild(control);
    }

    /**
     * Setup synchronized controls for side-by-side mode
     */
    private setupSynchronizedControls(leftPanel: HTMLElement, rightPanel: HTMLElement): void {
        const leftImg = leftPanel.querySelector('img') as HTMLImageElement;
        const rightImg = rightPanel.querySelector('img') as HTMLImageElement;
        
        if (!leftImg || !rightImg) return;

        // Synchronize scroll
        if (this.currentComparison?.config.syncPan) {
            leftPanel.addEventListener('scroll', () => {
                rightPanel.scrollLeft = leftPanel.scrollLeft;
                rightPanel.scrollTop = leftPanel.scrollTop;
            });
            
            rightPanel.addEventListener('scroll', () => {
                leftPanel.scrollLeft = rightPanel.scrollLeft;
                leftPanel.scrollTop = rightPanel.scrollTop;
            });
        }

        // Synchronize zoom with wheel events
        if (this.currentComparison?.config.syncZoom) {
            const handleWheel = (e: WheelEvent) => {
                e.preventDefault();
                
                const delta = e.deltaY < 0 ? 1.1 : 0.9;
                this.currentZoom = Math.max(0.5, Math.min(5, this.currentZoom * delta));
                
                leftImg.style.transform = `scale(${this.currentZoom})`;
                rightImg.style.transform = `scale(${this.currentZoom})`;
            };
            
            leftPanel.addEventListener('wheel', handleWheel);
            rightPanel.addEventListener('wheel', handleWheel);
        }
    }

    /**
     * Add comparison controls toolbar
     */
    private addComparisonControls(container: HTMLElement): void {
        const toolbar = document.createElement('div');
        toolbar.className = 'comparison-toolbar';
        toolbar.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 4px;
            padding: 8px;
            display: flex;
            gap: 8px;
            z-index: 100;
        `;

        // Mode switcher
        const modes: ComparisonMode[] = ['side-by-side', 'overlay', 'swipe', 'difference'];
        modes.forEach(mode => {
            const btn = document.createElement('button');
            btn.className = `mode-btn mode-${mode}`;
            btn.style.cssText = `
                background: ${this.currentComparison?.config.mode === mode ? '#2196F3' : 'rgba(255,255,255,0.1)'};
                color: white;
                border: none;
                padding: 6px 10px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
            `;
            btn.textContent = mode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            btn.addEventListener('click', async () => {
                if (this.currentComparison && this.currentComparison.container) {
                    this.currentComparison.config.mode = mode;
                    await this.startComparison(
                        this.currentComparison.leftImage,
                        this.currentComparison.rightImage,
                        this.currentComparison.container,
                        this.currentComparison.config
                    );
                }
            });
            
            toolbar.appendChild(btn);
        });

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = `
            background: rgba(255,0,0,0.5);
            color: white;
            border: none;
            padding: 6px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            margin-left: 10px;
        `;
        closeBtn.textContent = 'Close';
        closeBtn.addEventListener('click', () => this.closeComparison());
        
        toolbar.appendChild(closeBtn);
        container.appendChild(toolbar);
    }

    /**
     * Close comparison
     */
    closeComparison(): void {
        if (this.currentComparison?.container) {
            this.currentComparison.container.innerHTML = '';
        }
        
        this.currentComparison = null;
        this.comparisonContainer = undefined;
        this.leftCanvas = undefined;
        this.rightCanvas = undefined;
        this.leftContext = undefined;
        this.rightContext = undefined;
        this.swipeHandle = undefined;
        this.isDraggingSwipe = false;
        this.currentZoom = 1;
        this.panX = 0;
        this.panY = 0;
    }

    /**
     * Check if comparison is active
     */
    isComparisonActive(): boolean {
        return this.currentComparison?.isActive || false;
    }

    /**
     * Get current comparison state
     */
    getComparisonState(): ComparisonState | null {
        return this.currentComparison;
    }
}

export default ImageComparisonService.getInstance();