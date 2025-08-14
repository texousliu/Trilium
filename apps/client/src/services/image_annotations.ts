/**
 * Image Annotations Module for PhotoSwipe
 * Provides ability to add, display, and manage annotations on images
 */

import froca from './froca.js';
import server from './server.js';
import type FNote from '../entities/fnote.js';
import type FAttribute from '../entities/fattribute.js';
import { ImageValidator, withErrorBoundary, ImageError, ImageErrorType } from './image_error_handler.js';

/**
 * Annotation position and data
 */
export interface ImageAnnotation {
    id: string;
    noteId: string;
    x: number; // Percentage from left (0-100)
    y: number; // Percentage from top (0-100)
    text: string;
    author?: string;
    created: Date;
    modified?: Date;
    color?: string;
    icon?: string;
    type?: 'comment' | 'marker' | 'region';
    width?: number; // For region type
    height?: number; // For region type
}

/**
 * Annotation configuration
 */
export interface AnnotationConfig {
    enableAnnotations: boolean;
    showByDefault: boolean;
    allowEditing: boolean;
    defaultColor: string;
    defaultIcon: string;
}

/**
 * ImageAnnotationsService manages image annotations using Trilium's attribute system
 */
class ImageAnnotationsService {
    private static instance: ImageAnnotationsService;
    private activeAnnotations: Map<string, ImageAnnotation[]> = new Map();
    private annotationElements: Map<string, HTMLElement> = new Map();
    private isEditMode: boolean = false;
    private selectedAnnotation: ImageAnnotation | null = null;
    
    private config: AnnotationConfig = {
        enableAnnotations: true,
        showByDefault: true,
        allowEditing: true,
        defaultColor: '#ffeb3b',
        defaultIcon: 'bx-comment'
    };
    
    // Annotation attribute prefix in Trilium
    private readonly ANNOTATION_PREFIX = 'imageAnnotation';

    private constructor() {}

    static getInstance(): ImageAnnotationsService {
        if (!ImageAnnotationsService.instance) {
            ImageAnnotationsService.instance = new ImageAnnotationsService();
        }
        return ImageAnnotationsService.instance;
    }

    /**
     * Load annotations for an image note
     */
    async loadAnnotations(noteId: string): Promise<ImageAnnotation[]> {
        return await withErrorBoundary(async () => {
            // Validate note ID
            if (!noteId || typeof noteId !== 'string') {
                throw new ImageError(
                    ImageErrorType.INVALID_INPUT,
                    'Invalid note ID provided'
                );
            }
            const note = await froca.getNote(noteId);
            if (!note) return [];

            const attributes = note.getAttributes();
            const annotations: ImageAnnotation[] = [];

            // Parse annotation attributes
            for (const attr of attributes) {
                if (attr.name.startsWith(this.ANNOTATION_PREFIX)) {
                    try {
                        const annotationData = JSON.parse(attr.value);
                        annotations.push({
                            ...annotationData,
                            id: attr.attributeId,
                            noteId: noteId,
                            created: new Date(annotationData.created),
                            modified: annotationData.modified ? new Date(annotationData.modified) : undefined
                        });
                    } catch (error) {
                        console.error('Failed to parse annotation:', error);
                    }
                }
            }

            // Sort by creation date
            annotations.sort((a, b) => a.created.getTime() - b.created.getTime());
            
            this.activeAnnotations.set(noteId, annotations);
            return annotations;
        }) || [];
    }

    /**
     * Save a new annotation
     */
    async saveAnnotation(annotation: Omit<ImageAnnotation, 'id' | 'created'>): Promise<ImageAnnotation> {
        return await withErrorBoundary(async () => {
            // Validate annotation data
            if (!annotation.text || !annotation.noteId) {
                throw new ImageError(
                    ImageErrorType.INVALID_INPUT,
                    'Invalid annotation data'
                );
            }
            
            // Sanitize text
            annotation.text = this.sanitizeText(annotation.text);
            const note = await froca.getNote(annotation.noteId);
            if (!note) {
                throw new Error('Note not found');
            }

            const newAnnotation: ImageAnnotation = {
                ...annotation,
                id: this.generateId(),
                created: new Date()
            };

            // Save as note attribute
            const attributeName = `${this.ANNOTATION_PREFIX}_${newAnnotation.id}`;
            const attributeValue = JSON.stringify({
                x: newAnnotation.x,
                y: newAnnotation.y,
                text: newAnnotation.text,
                author: newAnnotation.author,
                created: newAnnotation.created.toISOString(),
                color: newAnnotation.color,
                icon: newAnnotation.icon,
                type: newAnnotation.type,
                width: newAnnotation.width,
                height: newAnnotation.height
            });

            await server.put(`notes/${annotation.noteId}/attributes`, {
                attributes: [{
                    type: 'label',
                    name: attributeName,
                    value: attributeValue
                }]
            });

            // Update cache
            const annotations = this.activeAnnotations.get(annotation.noteId) || [];
            annotations.push(newAnnotation);
            this.activeAnnotations.set(annotation.noteId, annotations);

            return newAnnotation;
        }) as Promise<ImageAnnotation>;
    }

    /**
     * Update an existing annotation
     */
    async updateAnnotation(annotation: ImageAnnotation): Promise<void> {
        try {
            const note = await froca.getNote(annotation.noteId);
            if (!note) {
                throw new Error('Note not found');
            }

            annotation.modified = new Date();

            // Update attribute
            const attributeName = `${this.ANNOTATION_PREFIX}_${annotation.id}`;
            const attributeValue = JSON.stringify({
                x: annotation.x,
                y: annotation.y,
                text: annotation.text,
                author: annotation.author,
                created: annotation.created.toISOString(),
                modified: annotation.modified.toISOString(),
                color: annotation.color,
                icon: annotation.icon,
                type: annotation.type,
                width: annotation.width,
                height: annotation.height
            });

            // Find and update the attribute
            const attributes = note.getAttributes();
            const attr = attributes.find(a => a.name === attributeName);
            
            if (attr) {
                await server.put(`notes/${annotation.noteId}/attributes/${attr.attributeId}`, {
                    value: attributeValue
                });
            }

            // Update cache
            const annotations = this.activeAnnotations.get(annotation.noteId) || [];
            const index = annotations.findIndex(a => a.id === annotation.id);
            if (index !== -1) {
                annotations[index] = annotation;
                this.activeAnnotations.set(annotation.noteId, annotations);
            }
        } catch (error) {
            console.error('Failed to update annotation:', error);
            throw error;
        }
    }

    /**
     * Delete an annotation
     */
    async deleteAnnotation(noteId: string, annotationId: string): Promise<void> {
        try {
            const note = await froca.getNote(noteId);
            if (!note) return;

            const attributeName = `${this.ANNOTATION_PREFIX}_${annotationId}`;
            const attributes = note.getAttributes();
            const attr = attributes.find(a => a.name === attributeName);
            
            if (attr) {
                await server.remove(`notes/${noteId}/attributes/${attr.attributeId}`);
            }

            // Update cache
            const annotations = this.activeAnnotations.get(noteId) || [];
            const filtered = annotations.filter(a => a.id !== annotationId);
            this.activeAnnotations.set(noteId, filtered);

            // Remove element if exists
            const element = this.annotationElements.get(annotationId);
            if (element) {
                element.remove();
                this.annotationElements.delete(annotationId);
            }
        } catch (error) {
            console.error('Failed to delete annotation:', error);
            throw error;
        }
    }

    /**
     * Render annotations on an image container
     */
    renderAnnotations(container: HTMLElement, noteId: string, imageElement: HTMLImageElement): void {
        const annotations = this.activeAnnotations.get(noteId) || [];
        
        // Clear existing annotation elements
        this.clearAnnotationElements();

        // Create annotation overlay container
        const overlay = this.createOverlayContainer(container, imageElement);

        // Render each annotation
        annotations.forEach(annotation => {
            const element = this.createAnnotationElement(annotation, overlay);
            this.annotationElements.set(annotation.id, element);
        });

        // Add click handler for creating new annotations
        if (this.config.allowEditing && this.isEditMode) {
            this.setupAnnotationCreation(overlay, noteId);
        }
        
        // Add ARIA attributes for accessibility
        overlay.setAttribute('role', 'img');
        overlay.setAttribute('aria-label', 'Image with annotations');
    }

    /**
     * Create overlay container for annotations
     */
    private createOverlayContainer(container: HTMLElement, imageElement: HTMLImageElement): HTMLElement {
        let overlay = container.querySelector('.annotation-overlay') as HTMLElement;
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'annotation-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: ${this.isEditMode ? 'auto' : 'none'};
                z-index: 10;
            `;
            
            // Position overlay over the image
            const rect = imageElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            overlay.style.top = `${rect.top - containerRect.top}px`;
            overlay.style.left = `${rect.left - containerRect.left}px`;
            overlay.style.width = `${rect.width}px`;
            overlay.style.height = `${rect.height}px`;
            
            container.appendChild(overlay);
        }

        return overlay;
    }

    /**
     * Create annotation element
     */
    private createAnnotationElement(annotation: ImageAnnotation, container: HTMLElement): HTMLElement {
        const element = document.createElement('div');
        element.className = `annotation-marker annotation-${annotation.type || 'comment'}`;
        element.dataset.annotationId = annotation.id;
        
        // Position based on percentage
        element.style.cssText = `
            position: absolute;
            left: ${annotation.x}%;
            top: ${annotation.y}%;
            transform: translate(-50%, -50%);
            cursor: pointer;
            z-index: 20;
            pointer-events: auto;
        `;

        // Create marker based on type
        if (annotation.type === 'region') {
            // Region annotation
            element.style.cssText += `
                width: ${annotation.width || 20}%;
                height: ${annotation.height || 20}%;
                border: 2px solid ${annotation.color || this.config.defaultColor};
                background: ${annotation.color || this.config.defaultColor}33;
                border-radius: 4px;
            `;
        } else {
            // Point annotation
            const marker = document.createElement('div');
            marker.style.cssText = `
                width: 24px;
                height: 24px;
                background: ${annotation.color || this.config.defaultColor};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            `;
            
            const icon = document.createElement('i');
            icon.className = `bx ${annotation.icon || this.config.defaultIcon}`;
            icon.style.cssText = `
                color: #333;
                font-size: 14px;
            `;
            
            marker.appendChild(icon);
            element.appendChild(marker);
            
            // Add ARIA attributes for accessibility
            element.setAttribute('role', 'button');
            element.setAttribute('aria-label', `Annotation: ${this.sanitizeText(annotation.text)}`);
            element.setAttribute('tabindex', '0');
        }

        // Add tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'annotation-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            max-width: 200px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            margin-bottom: 8px;
        `;
        // Use textContent to prevent XSS
        tooltip.textContent = this.sanitizeText(annotation.text);
        element.appendChild(tooltip);

        // Show tooltip on hover
        element.addEventListener('mouseenter', () => {
            tooltip.style.opacity = '1';
        });
        
        element.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });

        // Handle click for editing
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectAnnotation(annotation);
        });

        container.appendChild(element);
        return element;
    }

    /**
     * Setup annotation creation on click
     */
    private setupAnnotationCreation(overlay: HTMLElement, noteId: string): void {
        overlay.addEventListener('click', async (e) => {
            if (!this.isEditMode) return;
            
            const rect = overlay.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            // Show annotation creation dialog
            const text = prompt('Enter annotation text:');
            if (text) {
                await this.saveAnnotation({
                    noteId,
                    x,
                    y,
                    text,
                    author: 'current_user', // TODO: Get from session
                    type: 'comment'
                });
                
                // Reload annotations
                await this.loadAnnotations(noteId);
                
                // Re-render
                const imageElement = overlay.parentElement?.querySelector('img') as HTMLImageElement;
                if (imageElement && overlay.parentElement) {
                    this.renderAnnotations(overlay.parentElement, noteId, imageElement);
                }
            }
        });
    }

    /**
     * Select an annotation for editing
     */
    private selectAnnotation(annotation: ImageAnnotation): void {
        this.selectedAnnotation = annotation;
        
        // Highlight selected annotation
        this.annotationElements.forEach((element, id) => {
            if (id === annotation.id) {
                element.classList.add('selected');
                element.style.outline = '2px solid #2196F3';
            } else {
                element.classList.remove('selected');
                element.style.outline = 'none';
            }
        });
        
        // Show edit options
        if (this.isEditMode) {
            this.showEditDialog(annotation);
        }
    }

    /**
     * Show edit dialog for annotation
     */
    private showEditDialog(annotation: ImageAnnotation): void {
        // Simple implementation - could be replaced with a proper modal
        const newText = prompt('Edit annotation:', annotation.text);
        if (newText !== null) {
            annotation.text = newText;
            this.updateAnnotation(annotation);
            
            // Update tooltip with sanitized text
            const element = this.annotationElements.get(annotation.id);
            if (element) {
                const tooltip = element.querySelector('.annotation-tooltip');
                if (tooltip) {
                    // Use textContent to prevent XSS
                    tooltip.textContent = this.sanitizeText(newText);
                }
            }
        }
    }

    /**
     * Toggle edit mode
     */
    toggleEditMode(): void {
        this.isEditMode = !this.isEditMode;
        
        // Update overlay pointer events
        document.querySelectorAll('.annotation-overlay').forEach(overlay => {
            (overlay as HTMLElement).style.pointerEvents = this.isEditMode ? 'auto' : 'none';
        });
    }

    /**
     * Clear all annotation elements
     */
    private clearAnnotationElements(): void {
        this.annotationElements.forEach(element => element.remove());
        this.annotationElements.clear();
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Export annotations as JSON
     */
    exportAnnotations(noteId: string): string {
        const annotations = this.activeAnnotations.get(noteId) || [];
        return JSON.stringify(annotations, null, 2);
    }

    /**
     * Import annotations from JSON
     */
    async importAnnotations(noteId: string, json: string): Promise<void> {
        try {
            const annotations = JSON.parse(json) as ImageAnnotation[];
            
            for (const annotation of annotations) {
                await this.saveAnnotation({
                    noteId,
                    x: annotation.x,
                    y: annotation.y,
                    text: annotation.text,
                    author: annotation.author,
                    color: annotation.color,
                    icon: annotation.icon,
                    type: annotation.type,
                    width: annotation.width,
                    height: annotation.height
                });
            }
            
            await this.loadAnnotations(noteId);
        } catch (error) {
            console.error('Failed to import annotations:', error);
            throw error;
        }
    }

    /**
     * Sanitize text to prevent XSS
     */
    private sanitizeText(text: string): string {
        if (!text) return '';
        
        // Remove any HTML tags and dangerous characters
        const div = document.createElement('div');
        div.textContent = text;
        
        // Additional validation
        const sanitized = div.textContent || '';
        
        // Remove any remaining special characters that could be dangerous
        return sanitized
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    }
    
    /**
     * Cleanup resources
     */
    cleanup(): void {
        this.clearAnnotationElements();
        this.activeAnnotations.clear();
        this.selectedAnnotation = null;
        this.isEditMode = false;
    }
}

export default ImageAnnotationsService.getInstance();