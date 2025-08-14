/**
 * Basic Image Editor Module for Trilium Notes
 * Provides non-destructive image editing capabilities
 */

import server from './server.js';
import toastService from './toast.js';
import { ImageValidator, withErrorBoundary, MemoryMonitor, ImageError, ImageErrorType } from './image_error_handler.js';

/**
 * Edit operation types
 */
export type EditOperation = 
    | 'rotate'
    | 'crop'
    | 'brightness'
    | 'contrast'
    | 'saturation'
    | 'blur'
    | 'sharpen';

/**
 * Edit history entry
 */
export interface EditHistoryEntry {
    operation: EditOperation;
    params: any;
    timestamp: Date;
}

/**
 * Crop area definition
 */
export interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Editor state
 */
interface EditorState {
    originalImage: HTMLImageElement | null;
    currentImage: HTMLImageElement | null;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    history: EditHistoryEntry[];
    historyIndex: number;
    isEditing: boolean;
}

/**
 * Filter parameters
 */
export interface FilterParams {
    brightness?: number; // -100 to 100
    contrast?: number; // -100 to 100
    saturation?: number; // -100 to 100
    blur?: number; // 0 to 20
    sharpen?: number; // 0 to 100
}

/**
 * ImageEditorService provides basic image editing capabilities
 */
class ImageEditorService {
    private static instance: ImageEditorService;
    private editorState: EditorState;
    private tempCanvas: HTMLCanvasElement;
    private tempContext: CanvasRenderingContext2D;
    private cropOverlay?: HTMLElement;
    private cropHandles?: HTMLElement[];
    private cropArea: CropArea | null = null;
    private isDraggingCrop: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;
    private currentFilters: FilterParams = {};
    
    // Canvas size limits for security and memory management
    private readonly MAX_CANVAS_SIZE = 8192; // Maximum width/height
    private readonly MAX_CANVAS_AREA = 50000000; // 50 megapixels

    private constructor() {
        // Initialize canvases
        this.editorState = {
            originalImage: null,
            currentImage: null,
            canvas: document.createElement('canvas'),
            context: null as any,
            history: [],
            historyIndex: -1,
            isEditing: false
        };
        
        const ctx = this.editorState.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }
        this.editorState.context = ctx;
        
        this.tempCanvas = document.createElement('canvas');
        const tempCtx = this.tempCanvas.getContext('2d');
        if (!tempCtx) {
            throw new Error('Failed to get temp canvas context');
        }
        this.tempContext = tempCtx;
    }

    static getInstance(): ImageEditorService {
        if (!ImageEditorService.instance) {
            ImageEditorService.instance = new ImageEditorService();
        }
        return ImageEditorService.instance;
    }

    /**
     * Start editing an image
     */
    async startEditing(src: string | HTMLImageElement): Promise<HTMLCanvasElement> {
        return await withErrorBoundary(async () => {
            // Validate input
            if (typeof src === 'string') {
                ImageValidator.validateUrl(src);
            }
            // Load image
            let img: HTMLImageElement;
            if (typeof src === 'string') {
                img = await this.loadImage(src);
            } else {
                img = src;
            }
            
            // Validate image dimensions
            ImageValidator.validateDimensions(img.naturalWidth, img.naturalHeight);
            
            // Check memory availability
            const estimatedMemory = MemoryMonitor.estimateImageMemory(img.naturalWidth, img.naturalHeight);
            if (!MemoryMonitor.checkMemoryAvailable(estimatedMemory)) {
                throw new ImageError(
                    ImageErrorType.MEMORY_ERROR,
                    'Insufficient memory to process image',
                    { estimatedMemory }
                );
            }
            
            if (img.naturalWidth > this.MAX_CANVAS_SIZE || 
                img.naturalHeight > this.MAX_CANVAS_SIZE ||
                img.naturalWidth * img.naturalHeight > this.MAX_CANVAS_AREA) {
                
                // Scale down if too large
                const scale = Math.min(
                    this.MAX_CANVAS_SIZE / Math.max(img.naturalWidth, img.naturalHeight),
                    Math.sqrt(this.MAX_CANVAS_AREA / (img.naturalWidth * img.naturalHeight))
                );
                
                const scaledWidth = Math.floor(img.naturalWidth * scale);
                const scaledHeight = Math.floor(img.naturalHeight * scale);
                
                console.warn(`Image too large (${img.naturalWidth}x${img.naturalHeight}), scaling to ${scaledWidth}x${scaledHeight}`);
                
                // Create scaled image
                const scaledCanvas = document.createElement('canvas');
                scaledCanvas.width = scaledWidth;
                scaledCanvas.height = scaledHeight;
                const scaledCtx = scaledCanvas.getContext('2d');
                if (!scaledCtx) throw new Error('Failed to get scaled canvas context');
                
                scaledCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
                
                // Create new image from scaled canvas
                const scaledImg = new Image();
                scaledImg.src = scaledCanvas.toDataURL();
                await new Promise(resolve => scaledImg.onload = resolve);
                img = scaledImg;
                
                // Clean up scaled canvas
                scaledCanvas.width = 0;
                scaledCanvas.height = 0;
            }
            
            // Store original
            this.editorState.originalImage = img;
            this.editorState.currentImage = img;
            this.editorState.isEditing = true;
            this.editorState.history = [];
            this.editorState.historyIndex = -1;
            this.currentFilters = {};
            
            // Setup canvas with validated dimensions
            this.editorState.canvas.width = img.naturalWidth;
            this.editorState.canvas.height = img.naturalHeight;
            this.editorState.context.drawImage(img, 0, 0);
            
            return this.editorState.canvas;
        }, (error) => {
            this.stopEditing();
            throw error;
        }) || this.editorState.canvas;
    }

    /**
     * Rotate image by degrees (90, 180, 270)
     */
    rotate(degrees: 90 | 180 | 270 | -90): void {
        if (!this.editorState.isEditing) return;
        
        const { canvas, context } = this.editorState;
        const { width, height } = canvas;
        
        // Setup temp canvas
        if (degrees === 90 || degrees === -90 || degrees === 270) {
            this.tempCanvas.width = height;
            this.tempCanvas.height = width;
        } else {
            this.tempCanvas.width = width;
            this.tempCanvas.height = height;
        }
        
        // Clear temp canvas
        this.tempContext.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
        
        // Rotate
        this.tempContext.save();
        
        if (degrees === 90) {
            this.tempContext.translate(height, 0);
            this.tempContext.rotate(Math.PI / 2);
        } else if (degrees === 180) {
            this.tempContext.translate(width, height);
            this.tempContext.rotate(Math.PI);
        } else if (degrees === 270 || degrees === -90) {
            this.tempContext.translate(0, width);
            this.tempContext.rotate(-Math.PI / 2);
        }
        
        this.tempContext.drawImage(canvas, 0, 0);
        this.tempContext.restore();
        
        // Copy back to main canvas
        canvas.width = this.tempCanvas.width;
        canvas.height = this.tempCanvas.height;
        context.drawImage(this.tempCanvas, 0, 0);
        
        // Add to history
        this.addToHistory('rotate', { degrees });
    }

    /**
     * Start crop selection
     */
    startCrop(container: HTMLElement): void {
        if (!this.editorState.isEditing) return;
        
        // Create crop overlay
        this.cropOverlay = document.createElement('div');
        this.cropOverlay.className = 'crop-overlay';
        this.cropOverlay.style.cssText = `
            position: absolute;
            border: 2px dashed #fff;
            background: rgba(0, 0, 0, 0.3);
            cursor: move;
            z-index: 1000;
        `;
        
        // Create resize handles
        this.cropHandles = [];
        const handlePositions = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
        
        handlePositions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `crop-handle crop-handle-${pos}`;
            handle.dataset.position = pos;
            handle.style.cssText = `
                position: absolute;
                width: 10px;
                height: 10px;
                background: white;
                border: 1px solid #333;
                z-index: 1001;
            `;
            
            // Position handles
            switch (pos) {
                case 'nw':
                    handle.style.top = '-5px';
                    handle.style.left = '-5px';
                    handle.style.cursor = 'nw-resize';
                    break;
                case 'n':
                    handle.style.top = '-5px';
                    handle.style.left = '50%';
                    handle.style.transform = 'translateX(-50%)';
                    handle.style.cursor = 'n-resize';
                    break;
                case 'ne':
                    handle.style.top = '-5px';
                    handle.style.right = '-5px';
                    handle.style.cursor = 'ne-resize';
                    break;
                case 'e':
                    handle.style.top = '50%';
                    handle.style.right = '-5px';
                    handle.style.transform = 'translateY(-50%)';
                    handle.style.cursor = 'e-resize';
                    break;
                case 'se':
                    handle.style.bottom = '-5px';
                    handle.style.right = '-5px';
                    handle.style.cursor = 'se-resize';
                    break;
                case 's':
                    handle.style.bottom = '-5px';
                    handle.style.left = '50%';
                    handle.style.transform = 'translateX(-50%)';
                    handle.style.cursor = 's-resize';
                    break;
                case 'sw':
                    handle.style.bottom = '-5px';
                    handle.style.left = '-5px';
                    handle.style.cursor = 'sw-resize';
                    break;
                case 'w':
                    handle.style.top = '50%';
                    handle.style.left = '-5px';
                    handle.style.transform = 'translateY(-50%)';
                    handle.style.cursor = 'w-resize';
                    break;
            }
            
            this.cropOverlay.appendChild(handle);
            this.cropHandles!.push(handle);
        });
        
        // Set initial crop area (80% of image)
        const canvasRect = this.editorState.canvas.getBoundingClientRect();
        const initialSize = Math.min(canvasRect.width, canvasRect.height) * 0.8;
        const initialX = (canvasRect.width - initialSize) / 2;
        const initialY = (canvasRect.height - initialSize) / 2;
        
        this.cropArea = {
            x: initialX,
            y: initialY,
            width: initialSize,
            height: initialSize
        };
        
        this.updateCropOverlay();
        container.appendChild(this.cropOverlay);
        
        // Setup drag handlers
        this.setupCropHandlers();
    }

    /**
     * Setup crop interaction handlers
     */
    private setupCropHandlers(): void {
        if (!this.cropOverlay) return;
        
        // Drag to move
        this.cropOverlay.addEventListener('mousedown', (e) => {
            if ((e.target as HTMLElement).classList.contains('crop-handle')) return;
            
            this.isDraggingCrop = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            
            const handleMove = (e: MouseEvent) => {
                if (!this.isDraggingCrop || !this.cropArea) return;
                
                const deltaX = e.clientX - this.dragStartX;
                const deltaY = e.clientY - this.dragStartY;
                
                this.cropArea.x += deltaX;
                this.cropArea.y += deltaY;
                
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                
                this.updateCropOverlay();
            };
            
            const handleUp = () => {
                this.isDraggingCrop = false;
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
            };
            
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);
        });
        
        // Resize handles
        this.cropHandles?.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                
                const position = handle.dataset.position!;
                const startX = e.clientX;
                const startY = e.clientY;
                const startCrop = { ...this.cropArea! };
                
                const handleResize = (e: MouseEvent) => {
                    if (!this.cropArea) return;
                    
                    const deltaX = e.clientX - startX;
                    const deltaY = e.clientY - startY;
                    
                    switch (position) {
                        case 'nw':
                            this.cropArea.x = startCrop.x + deltaX;
                            this.cropArea.y = startCrop.y + deltaY;
                            this.cropArea.width = startCrop.width - deltaX;
                            this.cropArea.height = startCrop.height - deltaY;
                            break;
                        case 'n':
                            this.cropArea.y = startCrop.y + deltaY;
                            this.cropArea.height = startCrop.height - deltaY;
                            break;
                        case 'ne':
                            this.cropArea.y = startCrop.y + deltaY;
                            this.cropArea.width = startCrop.width + deltaX;
                            this.cropArea.height = startCrop.height - deltaY;
                            break;
                        case 'e':
                            this.cropArea.width = startCrop.width + deltaX;
                            break;
                        case 'se':
                            this.cropArea.width = startCrop.width + deltaX;
                            this.cropArea.height = startCrop.height + deltaY;
                            break;
                        case 's':
                            this.cropArea.height = startCrop.height + deltaY;
                            break;
                        case 'sw':
                            this.cropArea.x = startCrop.x + deltaX;
                            this.cropArea.width = startCrop.width - deltaX;
                            this.cropArea.height = startCrop.height + deltaY;
                            break;
                        case 'w':
                            this.cropArea.x = startCrop.x + deltaX;
                            this.cropArea.width = startCrop.width - deltaX;
                            break;
                    }
                    
                    // Ensure minimum size
                    this.cropArea.width = Math.max(50, this.cropArea.width);
                    this.cropArea.height = Math.max(50, this.cropArea.height);
                    
                    this.updateCropOverlay();
                };
                
                const handleUp = () => {
                    document.removeEventListener('mousemove', handleResize);
                    document.removeEventListener('mouseup', handleUp);
                };
                
                document.addEventListener('mousemove', handleResize);
                document.addEventListener('mouseup', handleUp);
            });
        });
    }

    /**
     * Update crop overlay position
     */
    private updateCropOverlay(): void {
        if (!this.cropOverlay || !this.cropArea) return;
        
        this.cropOverlay.style.left = `${this.cropArea.x}px`;
        this.cropOverlay.style.top = `${this.cropArea.y}px`;
        this.cropOverlay.style.width = `${this.cropArea.width}px`;
        this.cropOverlay.style.height = `${this.cropArea.height}px`;
    }

    /**
     * Apply crop
     */
    applyCrop(): void {
        if (!this.editorState.isEditing || !this.cropArea) return;
        
        const { canvas, context } = this.editorState;
        const canvasRect = canvas.getBoundingClientRect();
        
        // Convert crop area from screen to canvas coordinates
        const scaleX = canvas.width / canvasRect.width;
        const scaleY = canvas.height / canvasRect.height;
        
        const cropX = this.cropArea.x * scaleX;
        const cropY = this.cropArea.y * scaleY;
        const cropWidth = this.cropArea.width * scaleX;
        const cropHeight = this.cropArea.height * scaleY;
        
        // Get cropped image data
        const imageData = context.getImageData(cropX, cropY, cropWidth, cropHeight);
        
        // Resize canvas and put cropped image
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        context.putImageData(imageData, 0, 0);
        
        // Clean up crop overlay
        this.cancelCrop();
        
        // Add to history
        this.addToHistory('crop', {
            x: cropX,
            y: cropY,
            width: cropWidth,
            height: cropHeight
        });
    }

    /**
     * Cancel crop
     */
    cancelCrop(): void {
        if (this.cropOverlay) {
            this.cropOverlay.remove();
            this.cropOverlay = undefined;
        }
        this.cropHandles = undefined;
        this.cropArea = null;
    }

    /**
     * Apply brightness adjustment
     */
    applyBrightness(value: number): void {
        if (!this.editorState.isEditing) return;
        
        this.currentFilters.brightness = value;
        this.applyFilters();
    }

    /**
     * Apply contrast adjustment
     */
    applyContrast(value: number): void {
        if (!this.editorState.isEditing) return;
        
        this.currentFilters.contrast = value;
        this.applyFilters();
    }

    /**
     * Apply saturation adjustment
     */
    applySaturation(value: number): void {
        if (!this.editorState.isEditing) return;
        
        this.currentFilters.saturation = value;
        this.applyFilters();
    }

    /**
     * Apply all filters
     */
    private applyFilters(): void {
        const { canvas, context, originalImage } = this.editorState;
        
        if (!originalImage) return;
        
        // Clear canvas and redraw original
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Apply brightness
        if (this.currentFilters.brightness) {
            const brightness = this.currentFilters.brightness * 2.55; // Convert to 0-255 range
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, Math.max(0, data[i] + brightness));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness));
            }
        }
        
        // Apply contrast
        if (this.currentFilters.contrast) {
            const factor = (259 * (this.currentFilters.contrast + 255)) / (255 * (259 - this.currentFilters.contrast));
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
                data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
                data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
            }
        }
        
        // Apply saturation
        if (this.currentFilters.saturation) {
            const saturation = this.currentFilters.saturation / 100;
            for (let i = 0; i < data.length; i += 4) {
                const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
                data[i] = Math.min(255, Math.max(0, gray + saturation * (data[i] - gray)));
                data[i + 1] = Math.min(255, Math.max(0, gray + saturation * (data[i + 1] - gray)));
                data[i + 2] = Math.min(255, Math.max(0, gray + saturation * (data[i + 2] - gray)));
            }
        }
        
        // Put modified image data back
        context.putImageData(imageData, 0, 0);
    }

    /**
     * Apply blur effect
     */
    applyBlur(radius: number): void {
        if (!this.editorState.isEditing) return;
        
        const { canvas, context } = this.editorState;
        
        // Use CSS filter for performance
        context.filter = `blur(${radius}px)`;
        context.drawImage(canvas, 0, 0);
        context.filter = 'none';
        
        this.addToHistory('blur', { radius });
    }

    /**
     * Apply sharpen effect
     */
    applySharpen(amount: number): void {
        if (!this.editorState.isEditing) return;
        
        const { canvas, context } = this.editorState;
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;
        
        // Create copy of original data
        const original = new Uint8ClampedArray(data);
        
        // Sharpen kernel
        const kernel = [
            0, -1, 0,
            -1, 5 + amount / 25, -1,
            0, -1, 0
        ];
        
        // Apply convolution
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                
                for (let c = 0; c < 3; c++) {
                    let sum = 0;
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            const kidx = ((y + ky) * width + (x + kx)) * 4;
                            sum += original[kidx + c] * kernel[(ky + 1) * 3 + (kx + 1)];
                        }
                    }
                    data[idx + c] = Math.min(255, Math.max(0, sum));
                }
            }
        }
        
        context.putImageData(imageData, 0, 0);
        this.addToHistory('sharpen', { amount });
    }

    /**
     * Undo last operation
     */
    undo(): void {
        if (!this.editorState.isEditing || this.editorState.historyIndex <= 0) return;
        
        this.editorState.historyIndex--;
        this.replayHistory();
    }

    /**
     * Redo operation
     */
    redo(): void {
        if (!this.editorState.isEditing || 
            this.editorState.historyIndex >= this.editorState.history.length - 1) return;
        
        this.editorState.historyIndex++;
        this.replayHistory();
    }

    /**
     * Replay history up to current index
     */
    private replayHistory(): void {
        const { canvas, context, originalImage, history, historyIndex } = this.editorState;
        
        if (!originalImage) return;
        
        // Reset to original
        canvas.width = originalImage.naturalWidth;
        canvas.height = originalImage.naturalHeight;
        context.drawImage(originalImage, 0, 0);
        
        // Replay operations
        for (let i = 0; i <= historyIndex; i++) {
            const entry = history[i];
            // Apply operation based on entry
            // Note: This is simplified - actual implementation would need to store and replay exact operations
        }
    }

    /**
     * Add operation to history
     */
    private addToHistory(operation: EditOperation, params: any): void {
        // Remove any operations after current index
        this.editorState.history = this.editorState.history.slice(0, this.editorState.historyIndex + 1);
        
        // Add new operation
        this.editorState.history.push({
            operation,
            params,
            timestamp: new Date()
        });
        
        this.editorState.historyIndex++;
        
        // Limit history size
        if (this.editorState.history.length > 50) {
            this.editorState.history.shift();
            this.editorState.historyIndex--;
        }
    }

    /**
     * Save edited image
     */
    async saveImage(noteId?: string): Promise<Blob> {
        if (!this.editorState.isEditing) {
            throw new ImageError(
                ImageErrorType.INVALID_INPUT,
                'No image being edited'
            );
        }
        
        return new Promise((resolve, reject) => {
            this.editorState.canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                    
                    if (noteId) {
                        // Optionally save to server
                        this.saveToServer(noteId, blob);
                    }
                } else {
                    reject(new Error('Failed to create blob'));
                }
            }, 'image/png');
        });
    }

    /**
     * Save edited image to server
     */
    private async saveToServer(noteId: string, blob: Blob): Promise<void> {
        try {
            const formData = new FormData();
            formData.append('image', blob, 'edited.png');
            
            await server.upload(`notes/${noteId}/image`, formData);
            toastService.showMessage('Image saved successfully');
        } catch (error) {
            console.error('Failed to save image:', error);
            toastService.showError('Failed to save image');
        }
    }

    /**
     * Reset to original image
     */
    reset(): void {
        if (!this.editorState.isEditing || !this.editorState.originalImage) return;
        
        const { canvas, context, originalImage } = this.editorState;
        
        canvas.width = originalImage.naturalWidth;
        canvas.height = originalImage.naturalHeight;
        context.drawImage(originalImage, 0, 0);
        
        this.currentFilters = {};
        this.editorState.history = [];
        this.editorState.historyIndex = -1;
    }

    /**
     * Stop editing and clean up resources
     */
    stopEditing(): void {
        this.cancelCrop();
        
        // Request garbage collection after cleanup
        MemoryMonitor.requestGarbageCollection();
        
        // Clean up canvas memory
        if (this.editorState.canvas) {
            this.editorState.context.clearRect(0, 0, this.editorState.canvas.width, this.editorState.canvas.height);
            this.editorState.canvas.width = 0;
            this.editorState.canvas.height = 0;
        }
        
        if (this.tempCanvas) {
            this.tempContext.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
            this.tempCanvas.width = 0;
            this.tempCanvas.height = 0;
        }
        
        // Release image references
        if (this.editorState.originalImage) {
            this.editorState.originalImage.src = '';
        }
        if (this.editorState.currentImage) {
            this.editorState.currentImage.src = '';
        }
        
        this.editorState.isEditing = false;
        this.editorState.originalImage = null;
        this.editorState.currentImage = null;
        this.editorState.history = [];
        this.editorState.historyIndex = -1;
        this.currentFilters = {};
    }

    /**
     * Load image from URL
     */
    private loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }

    /**
     * Check if can undo
     */
    canUndo(): boolean {
        return this.editorState.historyIndex > 0;
    }

    /**
     * Check if can redo
     */
    canRedo(): boolean {
        return this.editorState.historyIndex < this.editorState.history.length - 1;
    }

    /**
     * Get current canvas
     */
    getCanvas(): HTMLCanvasElement {
        return this.editorState.canvas;
    }

    /**
     * Check if editing
     */
    isEditing(): boolean {
        return this.editorState.isEditing;
    }
}

export default ImageEditorService.getInstance();