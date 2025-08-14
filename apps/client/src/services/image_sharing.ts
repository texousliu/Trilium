/**
 * Image Sharing and Export Module for Trilium Notes
 * Provides functionality for sharing, downloading, and exporting images
 */

import server from './server.js';
import utils from './utils.js';
import toastService from './toast.js';
import type FNote from '../entities/fnote.js';
import { ImageValidator, withErrorBoundary, MemoryMonitor, ImageError, ImageErrorType } from './image_error_handler.js';

/**
 * Export format options
 */
export type ExportFormat = 'original' | 'jpeg' | 'png' | 'webp';

/**
 * Export size presets
 */
export type SizePreset = 'original' | 'thumbnail' | 'small' | 'medium' | 'large' | 'custom';

/**
 * Export configuration
 */
export interface ExportConfig {
    format: ExportFormat;
    quality: number; // 0-100 for JPEG/WebP
    size: SizePreset;
    customWidth?: number;
    customHeight?: number;
    maintainAspectRatio: boolean;
    addWatermark: boolean;
    watermarkText?: string;
    watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    watermarkOpacity?: number;
}

/**
 * Share options
 */
export interface ShareOptions {
    method: 'link' | 'email' | 'social';
    expiresIn?: number; // Hours
    password?: string;
    allowDownload: boolean;
    trackViews: boolean;
}

/**
 * Share link data
 */
export interface ShareLink {
    url: string;
    shortUrl?: string;
    expiresAt?: Date;
    password?: string;
    views: number;
    maxViews?: number;
    created: Date;
}

/**
 * Size presets in pixels
 */
const SIZE_PRESETS = {
    thumbnail: { width: 150, height: 150 },
    small: { width: 400, height: 400 },
    medium: { width: 800, height: 800 },
    large: { width: 1600, height: 1600 }
};

/**
 * ImageSharingService handles image sharing, downloading, and exporting
 */
class ImageSharingService {
    private static instance: ImageSharingService;
    private activeShares: Map<string, ShareLink> = new Map();
    private downloadCanvas?: HTMLCanvasElement;
    private downloadContext?: CanvasRenderingContext2D;
    
    // Canvas size limits for security and memory management
    private readonly MAX_CANVAS_SIZE = 8192; // Maximum width/height
    private readonly MAX_CANVAS_AREA = 50000000; // 50 megapixels

    private defaultExportConfig: ExportConfig = {
        format: 'original',
        quality: 90,
        size: 'original',
        maintainAspectRatio: true,
        addWatermark: false,
        watermarkPosition: 'bottom-right',
        watermarkOpacity: 0.5
    };

    private constructor() {
        // Initialize download canvas
        this.downloadCanvas = document.createElement('canvas');
        this.downloadContext = this.downloadCanvas.getContext('2d') || undefined;
    }

    static getInstance(): ImageSharingService {
        if (!ImageSharingService.instance) {
            ImageSharingService.instance = new ImageSharingService();
        }
        return ImageSharingService.instance;
    }

    /**
     * Download image with options
     */
    async downloadImage(
        src: string,
        filename: string,
        config?: Partial<ExportConfig>
    ): Promise<void> {
        await withErrorBoundary(async () => {
            // Validate inputs
            ImageValidator.validateUrl(src);
            const sanitizedFilename = ImageValidator.sanitizeFilename(filename);
            const finalConfig = { ...this.defaultExportConfig, ...config };
            
            // Load image
            const img = await this.loadImage(src);
            
            // Process image based on config
            const processedBlob = await this.processImage(img, finalConfig);
            
            // Create download link
            const url = URL.createObjectURL(processedBlob);
            const link = document.createElement('a');
            link.href = url;
            
            // Determine filename with extension
            const extension = finalConfig.format === 'original' 
                ? this.getOriginalExtension(sanitizedFilename) 
                : finalConfig.format;
            const finalFilename = this.ensureExtension(sanitizedFilename, extension);
            
            link.download = finalFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Cleanup
            URL.revokeObjectURL(url);
            
            toastService.showMessage(`Downloaded ${finalFilename}`);
        });
    }

    /**
     * Process image according to export configuration
     */
    private async processImage(img: HTMLImageElement, config: ExportConfig): Promise<Blob> {
        if (!this.downloadCanvas || !this.downloadContext) {
            throw new Error('Canvas not initialized');
        }

        // Calculate dimensions
        const { width, height } = this.calculateDimensions(
            img.naturalWidth,
            img.naturalHeight,
            config
        );

        // Validate canvas dimensions
        ImageValidator.validateDimensions(width, height);
        
        // Check memory availability
        const estimatedMemory = MemoryMonitor.estimateImageMemory(width, height);
        if (!MemoryMonitor.checkMemoryAvailable(estimatedMemory)) {
            throw new ImageError(
                ImageErrorType.MEMORY_ERROR,
                'Insufficient memory to process image',
                { width, height, estimatedMemory }
            );
        }
        
        // Set canvas size
        this.downloadCanvas.width = width;
        this.downloadCanvas.height = height;

        // Clear canvas
        this.downloadContext.fillStyle = 'white';
        this.downloadContext.fillRect(0, 0, width, height);

        // Draw image
        this.downloadContext.drawImage(img, 0, 0, width, height);

        // Add watermark if enabled
        if (config.addWatermark && config.watermarkText) {
            this.addWatermark(this.downloadContext, width, height, config);
        }

        // Convert to blob
        return new Promise((resolve, reject) => {
            const mimeType = this.getMimeType(config.format);
            const quality = config.quality / 100;
            
            this.downloadCanvas!.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob'));
                    }
                },
                mimeType,
                quality
            );
        });
    }

    /**
     * Calculate dimensions based on size preset
     */
    private calculateDimensions(
        originalWidth: number,
        originalHeight: number,
        config: ExportConfig
    ): { width: number; height: number } {
        if (config.size === 'original') {
            return { width: originalWidth, height: originalHeight };
        }

        if (config.size === 'custom' && config.customWidth && config.customHeight) {
            if (config.maintainAspectRatio) {
                const aspectRatio = originalWidth / originalHeight;
                const targetRatio = config.customWidth / config.customHeight;
                
                if (aspectRatio > targetRatio) {
                    return {
                        width: config.customWidth,
                        height: Math.round(config.customWidth / aspectRatio)
                    };
                } else {
                    return {
                        width: Math.round(config.customHeight * aspectRatio),
                        height: config.customHeight
                    };
                }
            }
            return { width: config.customWidth, height: config.customHeight };
        }

        // Use preset
        const preset = SIZE_PRESETS[config.size as keyof typeof SIZE_PRESETS];
        if (!preset) {
            return { width: originalWidth, height: originalHeight };
        }

        if (config.maintainAspectRatio) {
            const aspectRatio = originalWidth / originalHeight;
            const maxWidth = preset.width;
            const maxHeight = preset.height;
            
            let width = originalWidth;
            let height = originalHeight;
            
            if (width > maxWidth) {
                width = maxWidth;
                height = Math.round(width / aspectRatio);
            }
            
            if (height > maxHeight) {
                height = maxHeight;
                width = Math.round(height * aspectRatio);
            }
            
            return { width, height };
        }

        return preset;
    }

    /**
     * Add watermark to canvas
     */
    private addWatermark(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        config: ExportConfig
    ): void {
        if (!config.watermarkText) return;

        ctx.save();
        
        // Set watermark style
        ctx.globalAlpha = config.watermarkOpacity || 0.5;
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.font = `${Math.min(width, height) * 0.05}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate position
        let x = width / 2;
        let y = height / 2;
        
        switch (config.watermarkPosition) {
            case 'top-left':
                x = width * 0.1;
                y = height * 0.1;
                ctx.textAlign = 'left';
                break;
            case 'top-right':
                x = width * 0.9;
                y = height * 0.1;
                ctx.textAlign = 'right';
                break;
            case 'bottom-left':
                x = width * 0.1;
                y = height * 0.9;
                ctx.textAlign = 'left';
                break;
            case 'bottom-right':
                x = width * 0.9;
                y = height * 0.9;
                ctx.textAlign = 'right';
                break;
        }

        // Draw watermark with outline
        ctx.strokeText(config.watermarkText, x, y);
        ctx.fillText(config.watermarkText, x, y);
        
        ctx.restore();
    }

    /**
     * Generate shareable link for image
     */
    async generateShareLink(
        noteId: string,
        options?: Partial<ShareOptions>
    ): Promise<ShareLink> {
        try {
            const finalOptions = {
                method: 'link' as const,
                allowDownload: true,
                trackViews: false,
                ...options
            };

            // Create share token on server
            const response = await server.post(`notes/${noteId}/share`, {
                type: 'image',
                expiresIn: finalOptions.expiresIn,
                password: finalOptions.password,
                allowDownload: finalOptions.allowDownload,
                trackViews: finalOptions.trackViews
            });

            const shareLink: ShareLink = {
                url: `${window.location.origin}/share/${response.token}`,
                shortUrl: response.shortUrl,
                expiresAt: response.expiresAt ? new Date(response.expiresAt) : undefined,
                password: finalOptions.password,
                views: 0,
                maxViews: response.maxViews,
                created: new Date()
            };

            // Store in active shares
            this.activeShares.set(response.token, shareLink);

            return shareLink;
        } catch (error) {
            console.error('Failed to generate share link:', error);
            throw error;
        }
    }

    /**
     * Copy image or link to clipboard
     */
    async copyToClipboard(
        src: string,
        type: 'image' | 'link' = 'link'
    ): Promise<void> {
        await withErrorBoundary(async () => {
            // Validate URL
            ImageValidator.validateUrl(src);
            if (type === 'link') {
                // Copy URL to clipboard
                await navigator.clipboard.writeText(src);
                toastService.showMessage('Link copied to clipboard');
            } else {
                // Copy image data to clipboard
                const img = await this.loadImage(src);
                
                if (!this.downloadCanvas || !this.downloadContext) {
                    throw new Error('Canvas not initialized');
                }
                
                // Validate dimensions before setting
                ImageValidator.validateDimensions(img.naturalWidth, img.naturalHeight);
                
                this.downloadCanvas.width = img.naturalWidth;
                this.downloadCanvas.height = img.naturalHeight;
                this.downloadContext.drawImage(img, 0, 0);
                
                this.downloadCanvas.toBlob(async (blob) => {
                    if (blob) {
                        try {
                            const item = new ClipboardItem({ 'image/png': blob });
                            await navigator.clipboard.write([item]);
                            toastService.showMessage('Image copied to clipboard');
                        } catch (error) {
                            console.error('Failed to copy image to clipboard:', error);
                            // Fallback to copying link
                            await navigator.clipboard.writeText(src);
                            toastService.showMessage('Image link copied to clipboard');
                        }
                    }
                });
            }
        });
    }

    /**
     * Share via native share API (mobile)
     */
    async shareNative(
        src: string,
        title: string,
        text?: string
    ): Promise<void> {
        if (!navigator.share) {
            throw new Error('Native share not supported');
        }

        try {
            // Try to share with file
            const img = await this.loadImage(src);
            const blob = await this.processImage(img, this.defaultExportConfig);
            const file = new File([blob], `${title}.${this.defaultExportConfig.format}`, {
                type: this.getMimeType(this.defaultExportConfig.format)
            });

            await navigator.share({
                title,
                text: text || `Check out this image: ${title}`,
                files: [file]
            });
        } catch (error) {
            // Fallback to sharing URL
            try {
                await navigator.share({
                    title,
                    text: text || `Check out this image: ${title}`,
                    url: src
                });
            } catch (shareError) {
                console.error('Failed to share:', shareError);
                throw shareError;
            }
        }
    }

    /**
     * Export multiple images as ZIP
     */
    async exportBatch(
        images: Array<{ src: string; filename: string }>,
        config?: Partial<ExportConfig>
    ): Promise<void> {
        try {
            // Dynamic import of JSZip
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            
            const finalConfig = { ...this.defaultExportConfig, ...config };
            
            // Process each image
            for (const { src, filename } of images) {
                try {
                    const img = await this.loadImage(src);
                    const blob = await this.processImage(img, finalConfig);
                    const extension = finalConfig.format === 'original' 
                        ? this.getOriginalExtension(filename) 
                        : finalConfig.format;
                    const finalFilename = this.ensureExtension(filename, extension);
                    
                    zip.file(finalFilename, blob);
                } catch (error) {
                    console.error(`Failed to process image ${filename}:`, error);
                }
            }
            
            // Generate and download ZIP
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `images_${Date.now()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toastService.showMessage(`Exported ${images.length} images`);
        } catch (error) {
            console.error('Failed to export images:', error);
            toastService.showError('Failed to export images');
            throw error;
        }
    }

    /**
     * Open share dialog
     */
    openShareDialog(
        src: string,
        title: string,
        noteId?: string
    ): void {
        // Create modal dialog
        const dialog = document.createElement('div');
        dialog.className = 'share-dialog-overlay';
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const content = document.createElement('div');
        content.className = 'share-dialog';
        content.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            width: 400px;
            max-width: 90%;
        `;

        content.innerHTML = `
            <h3 style="margin: 0 0 15px 0;">Share Image</h3>
            <div class="share-options" style="display: flex; flex-direction: column; gap: 10px;">
                <button class="share-copy-link" style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                    <i class="bx bx-link"></i> Copy Link
                </button>
                <button class="share-copy-image" style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                    <i class="bx bx-copy"></i> Copy Image
                </button>
                <button class="share-download" style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                    <i class="bx bx-download"></i> Download
                </button>
                ${navigator.share ? `
                    <button class="share-native" style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                        <i class="bx bx-share"></i> Share...
                    </button>
                ` : ''}
                ${noteId ? `
                    <button class="share-generate-link" style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                        <i class="bx bx-link-external"></i> Generate Share Link
                    </button>
                ` : ''}
            </div>
            <button class="close-dialog" style="margin-top: 15px; padding: 8px 16px; background: #f0f0f0; border: none; border-radius: 4px; cursor: pointer;">
                Close
            </button>
        `;

        // Add event handlers
        content.querySelector('.share-copy-link')?.addEventListener('click', () => {
            this.copyToClipboard(src, 'link');
            dialog.remove();
        });

        content.querySelector('.share-copy-image')?.addEventListener('click', () => {
            this.copyToClipboard(src, 'image');
            dialog.remove();
        });

        content.querySelector('.share-download')?.addEventListener('click', () => {
            this.downloadImage(src, title);
            dialog.remove();
        });

        content.querySelector('.share-native')?.addEventListener('click', () => {
            this.shareNative(src, title);
            dialog.remove();
        });

        content.querySelector('.share-generate-link')?.addEventListener('click', async () => {
            if (noteId) {
                const link = await this.generateShareLink(noteId);
                await this.copyToClipboard(link.url, 'link');
                dialog.remove();
            }
        });

        content.querySelector('.close-dialog')?.addEventListener('click', () => {
            dialog.remove();
        });

        dialog.appendChild(content);
        document.body.appendChild(dialog);
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
     * Get MIME type for format
     */
    private getMimeType(format: ExportFormat): string {
        switch (format) {
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'webp':
                return 'image/webp';
            default:
                return 'image/png';
        }
    }

    /**
     * Get original extension from filename
     */
    private getOriginalExtension(filename: string): string {
        const parts = filename.split('.');
        if (parts.length > 1) {
            return parts[parts.length - 1].toLowerCase();
        }
        return 'png';
    }

    /**
     * Ensure filename has correct extension
     */
    private ensureExtension(filename: string, extension: string): string {
        const parts = filename.split('.');
        if (parts.length > 1) {
            parts[parts.length - 1] = extension;
            return parts.join('.');
        }
        return `${filename}.${extension}`;
    }

    /**
     * Cleanup resources
     */
    cleanup(): void {
        this.activeShares.clear();
        
        // Clean up canvas memory
        if (this.downloadCanvas && this.downloadContext) {
            this.downloadContext.clearRect(0, 0, this.downloadCanvas.width, this.downloadCanvas.height);
            this.downloadCanvas.width = 0;
            this.downloadCanvas.height = 0;
        }
        
        this.downloadCanvas = undefined;
        this.downloadContext = undefined;
    }
}

export default ImageSharingService.getInstance();