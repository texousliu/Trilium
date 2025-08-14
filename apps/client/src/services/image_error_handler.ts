/**
 * Error Handler for Image Processing Operations
 * Provides error boundaries and validation for image-related operations
 */

import toastService from './toast.js';

/**
 * Error types for image operations
 */
export enum ImageErrorType {
    INVALID_INPUT = 'INVALID_INPUT',
    SIZE_LIMIT_EXCEEDED = 'SIZE_LIMIT_EXCEEDED',
    MEMORY_ERROR = 'MEMORY_ERROR',
    PROCESSING_ERROR = 'PROCESSING_ERROR',
    NETWORK_ERROR = 'NETWORK_ERROR',
    SECURITY_ERROR = 'SECURITY_ERROR'
}

/**
 * Custom error class for image operations
 */
export class ImageError extends Error {
    constructor(
        public type: ImageErrorType,
        message: string,
        public details?: any
    ) {
        super(message);
        this.name = 'ImageError';
    }
}

/**
 * Input validation utilities
 */
export class ImageValidator {
    private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    private static readonly ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/bmp'
    ];
    private static readonly MAX_DIMENSION = 16384;
    private static readonly MAX_AREA = 100000000; // 100 megapixels

    /**
     * Validate file input
     */
    static validateFile(file: File): void {
        // Check file size
        if (file.size > this.MAX_FILE_SIZE) {
            throw new ImageError(
                ImageErrorType.SIZE_LIMIT_EXCEEDED,
                `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
                { fileSize: file.size, maxSize: this.MAX_FILE_SIZE }
            );
        }

        // Check MIME type
        if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
            throw new ImageError(
                ImageErrorType.INVALID_INPUT,
                `File type ${file.type} is not supported`,
                { fileType: file.type, allowedTypes: this.ALLOWED_MIME_TYPES }
            );
        }
    }

    /**
     * Validate image dimensions
     */
    static validateDimensions(width: number, height: number): void {
        if (width <= 0 || height <= 0) {
            throw new ImageError(
                ImageErrorType.INVALID_INPUT,
                'Invalid image dimensions',
                { width, height }
            );
        }

        if (width > this.MAX_DIMENSION || height > this.MAX_DIMENSION) {
            throw new ImageError(
                ImageErrorType.SIZE_LIMIT_EXCEEDED,
                `Image dimensions exceed maximum allowed size of ${this.MAX_DIMENSION}px`,
                { width, height, maxDimension: this.MAX_DIMENSION }
            );
        }

        if (width * height > this.MAX_AREA) {
            throw new ImageError(
                ImageErrorType.SIZE_LIMIT_EXCEEDED,
                `Image area exceeds maximum allowed area of ${this.MAX_AREA / 1000000} megapixels`,
                { area: width * height, maxArea: this.MAX_AREA }
            );
        }
    }

    /**
     * Validate URL
     */
    static validateUrl(url: string): void {
        try {
            const parsedUrl = new URL(url);
            
            // Check protocol
            if (!['http:', 'https:', 'data:', 'blob:'].includes(parsedUrl.protocol)) {
                throw new ImageError(
                    ImageErrorType.SECURITY_ERROR,
                    `Unsupported protocol: ${parsedUrl.protocol}`,
                    { url, protocol: parsedUrl.protocol }
                );
            }

            // Additional security checks for data URLs
            if (parsedUrl.protocol === 'data:') {
                const [header] = url.split(',');
                if (!header.includes('image/')) {
                    throw new ImageError(
                        ImageErrorType.INVALID_INPUT,
                        'Data URL does not contain image data',
                        { url: url.substring(0, 100) }
                    );
                }
            }
        } catch (error) {
            if (error instanceof ImageError) {
                throw error;
            }
            throw new ImageError(
                ImageErrorType.INVALID_INPUT,
                'Invalid URL format',
                { url, originalError: error }
            );
        }
    }

    /**
     * Sanitize filename
     */
    static sanitizeFilename(filename: string): string {
        // Remove path traversal attempts
        filename = filename.replace(/\.\./g, '');
        filename = filename.replace(/[\/\\]/g, '_');
        
        // Remove special characters except dots and dashes
        filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        
        // Limit length
        if (filename.length > 255) {
            const ext = filename.split('.').pop();
            filename = filename.substring(0, 250) + '.' + ext;
        }
        
        return filename;
    }
}

/**
 * Error boundary wrapper for async operations
 */
export async function withErrorBoundary<T>(
    operation: () => Promise<T>,
    errorHandler?: (error: Error) => void
): Promise<T | null> {
    try {
        return await operation();
    } catch (error) {
        const imageError = error instanceof ImageError 
            ? error 
            : new ImageError(
                ImageErrorType.PROCESSING_ERROR,
                error instanceof Error ? error.message : 'Unknown error occurred',
                { originalError: error }
            );

        // Log error
        console.error('[Image Error]', imageError.type, imageError.message, imageError.details);

        // Show user-friendly message
        switch (imageError.type) {
            case ImageErrorType.SIZE_LIMIT_EXCEEDED:
                toastService.showError('Image is too large to process');
                break;
            case ImageErrorType.INVALID_INPUT:
                toastService.showError('Invalid image or input provided');
                break;
            case ImageErrorType.MEMORY_ERROR:
                toastService.showError('Not enough memory to process image');
                break;
            case ImageErrorType.SECURITY_ERROR:
                toastService.showError('Security violation detected');
                break;
            case ImageErrorType.NETWORK_ERROR:
                toastService.showError('Network error occurred');
                break;
            default:
                toastService.showError('Failed to process image');
        }

        // Call custom error handler if provided
        if (errorHandler) {
            errorHandler(imageError);
        }

        return null;
    }
}

/**
 * Memory monitoring utilities
 */
export class MemoryMonitor {
    private static readonly WARNING_THRESHOLD = 0.8; // 80% of available memory
    
    /**
     * Check if memory is available for operation
     */
    static checkMemoryAvailable(estimatedBytes: number): boolean {
        if ('memory' in performance && (performance as any).memory) {
            const memory = (performance as any).memory;
            const used = memory.usedJSHeapSize;
            const limit = memory.jsHeapSizeLimit;
            const available = limit - used;
            
            if (estimatedBytes > available * this.WARNING_THRESHOLD) {
                console.warn(`Memory warning: Estimated ${estimatedBytes} bytes needed, ${available} bytes available`);
                return false;
            }
        }
        return true;
    }

    /**
     * Estimate memory needed for image
     */
    static estimateImageMemory(width: number, height: number, channels: number = 4): number {
        // Each pixel uses 4 bytes (RGBA) or specified channels
        return width * height * channels;
    }

    /**
     * Force garbage collection if available
     */
    static requestGarbageCollection(): void {
        if (typeof (globalThis as any).gc === 'function') {
            (globalThis as any).gc();
        }
    }
}

/**
 * Web Worker support for heavy operations
 */
export class ImageWorkerPool {
    private workers: Worker[] = [];
    private taskQueue: Array<{
        data: any;
        resolve: (value: any) => void;
        reject: (error: any) => void;
    }> = [];
    private busyWorkers = new Set<Worker>();

    constructor(
        private workerScript: string,
        private poolSize: number = navigator.hardwareConcurrency || 4
    ) {
        this.initializeWorkers();
    }

    private initializeWorkers(): void {
        for (let i = 0; i < this.poolSize; i++) {
            try {
                const worker = new Worker(this.workerScript);
                worker.addEventListener('message', (e) => this.handleWorkerMessage(worker, e));
                worker.addEventListener('error', (e) => this.handleWorkerError(worker, e));
                this.workers.push(worker);
            } catch (error) {
                console.error('Failed to create worker:', error);
            }
        }
    }

    private handleWorkerMessage(worker: Worker, event: MessageEvent): void {
        this.busyWorkers.delete(worker);
        
        // Process next task if available
        if (this.taskQueue.length > 0) {
            const task = this.taskQueue.shift()!;
            this.executeTask(worker, task);
        }
    }

    private handleWorkerError(worker: Worker, event: ErrorEvent): void {
        this.busyWorkers.delete(worker);
        console.error('Worker error:', event);
    }

    private executeTask(
        worker: Worker,
        task: { data: any; resolve: (value: any) => void; reject: (error: any) => void }
    ): void {
        this.busyWorkers.add(worker);
        
        const messageHandler = (e: MessageEvent) => {
            worker.removeEventListener('message', messageHandler);
            worker.removeEventListener('error', errorHandler);
            this.busyWorkers.delete(worker);
            task.resolve(e.data);
            
            // Process next task
            if (this.taskQueue.length > 0) {
                const nextTask = this.taskQueue.shift()!;
                this.executeTask(worker, nextTask);
            }
        };
        
        const errorHandler = (e: ErrorEvent) => {
            worker.removeEventListener('message', messageHandler);
            worker.removeEventListener('error', errorHandler);
            this.busyWorkers.delete(worker);
            task.reject(e);
            
            // Process next task
            if (this.taskQueue.length > 0) {
                const nextTask = this.taskQueue.shift()!;
                this.executeTask(worker, nextTask);
            }
        };
        
        worker.addEventListener('message', messageHandler);
        worker.addEventListener('error', errorHandler);
        worker.postMessage(task.data);
    }

    async process(data: any): Promise<any> {
        return new Promise((resolve, reject) => {
            // Find available worker
            const availableWorker = this.workers.find(w => !this.busyWorkers.has(w));
            
            if (availableWorker) {
                this.executeTask(availableWorker, { data, resolve, reject });
            } else {
                // Queue task
                this.taskQueue.push({ data, resolve, reject });
            }
        });
    }

    terminate(): void {
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
        this.taskQueue = [];
        this.busyWorkers.clear();
    }
}

export default {
    ImageError,
    ImageErrorType,
    ImageValidator,
    MemoryMonitor,
    ImageWorkerPool,
    withErrorBoundary
};