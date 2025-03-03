import type { EmbeddingProvider, EmbeddingConfig, NoteEmbeddingContext } from './embeddings_interface.js';

/**
 * Base class that implements common functionality for embedding providers
 */
export abstract class BaseEmbeddingProvider implements EmbeddingProvider {
    abstract name: string;
    protected config: EmbeddingConfig;

    constructor(config: EmbeddingConfig) {
        this.config = config;
    }

    getConfig(): EmbeddingConfig {
        return this.config;
    }

    abstract generateEmbeddings(text: string): Promise<Float32Array>;
    abstract generateBatchEmbeddings(texts: string[]): Promise<Float32Array[]>;

    /**
     * Generates a rich text representation of a note's context for embedding
     */
    protected generateNoteContextText(context: NoteEmbeddingContext): string {
        const parts = [
            `Title: ${context.title}`,
            `Type: ${context.type}`,
            `MIME: ${context.mime}`,
            `Created: ${context.dateCreated}`,
            `Modified: ${context.dateModified}`
        ];

        if (context.attributes.length > 0) {
            parts.push('Attributes:');
            for (const attr of context.attributes) {
                parts.push(`  ${attr.type} - ${attr.name}: ${attr.value}`);
            }
        }

        if (context.parentTitles.length > 0) {
            parts.push('Parent Notes:');
            parts.push(...context.parentTitles.map(t => `  ${t}`));
        }

        if (context.childTitles.length > 0) {
            parts.push('Child Notes:');
            parts.push(...context.childTitles.map(t => `  ${t}`));
        }

        if (context.attachments.length > 0) {
            parts.push('Attachments:');
            for (const att of context.attachments) {
                parts.push(`  ${att.title} (${att.mime})`);
            }
        }

        parts.push('Content:', context.content);

        return parts.join('\n');
    }

    /**
     * Default implementation that converts note context to text and generates embeddings
     */
    async generateNoteEmbeddings(context: NoteEmbeddingContext): Promise<Float32Array> {
        const text = this.generateNoteContextText(context);
        return this.generateEmbeddings(text);
    }

    /**
     * Default implementation that processes notes in batch
     */
    async generateBatchNoteEmbeddings(contexts: NoteEmbeddingContext[]): Promise<Float32Array[]> {
        const texts = contexts.map(ctx => this.generateNoteContextText(ctx));
        return this.generateBatchEmbeddings(texts);
    }
}
