"use strict";

import path from "path";
import log from "./log.js";
import markdownExportService from "./export/markdown.js";
import markdownImportService from "./import/markdown.js";
import BNote from "../becca/entities/bnote.js";
import BFileSystemMapping from "../becca/entities/bfile_system_mapping.js";
import utils from "./utils.js";
import { type NoteType } from "@triliumnext/commons";

export interface ConversionResult {
    content: string | Buffer;
    attributes?: Array<{ type: 'label' | 'relation'; name: string; value: string; isInheritable?: boolean }>;
    mime?: string;
    type?: NoteType;
}

export interface ConversionOptions {
    preserveAttributes?: boolean;
    includeFrontmatter?: boolean;
    relativeImagePaths?: boolean;
}

/**
 * Content converter for file system sync operations
 * Handles conversion between Trilium note formats and file system formats
 */
class FileSystemContentConverter {

    /**
     * Convert note content to file format based on mapping configuration
     */
    async noteToFile(note: BNote, mapping: BFileSystemMapping, filePath: string, options: ConversionOptions = {}): Promise<ConversionResult> {
        const fileExt = path.extname(filePath).toLowerCase();
        const contentFormat = mapping.contentFormat === 'auto' ? this.detectFormatFromExtension(fileExt) : mapping.contentFormat;

        switch (contentFormat) {
            case 'markdown':
                return this.noteToMarkdown(note, options);
            case 'html':
                return this.noteToHtml(note, options);
            case 'raw':
            default:
                return this.noteToRaw(note, options);
        }
    }

    /**
     * Convert file content to note format based on mapping configuration
     */
    async fileToNote(fileContent: string | Buffer, mapping: BFileSystemMapping, filePath: string, options: ConversionOptions = {}): Promise<ConversionResult> {
        const fileExt = path.extname(filePath).toLowerCase();
        const contentFormat = mapping.contentFormat === 'auto' ? this.detectFormatFromExtension(fileExt) : mapping.contentFormat;

        // Convert Buffer to string for text formats
        const content = Buffer.isBuffer(fileContent) ? fileContent.toString('utf8') : fileContent;

        switch (contentFormat) {
            case 'markdown':
                // Extract title from note for proper H1 deduplication
                const note = mapping.note;
                const title = note ? note.title : path.basename(filePath, path.extname(filePath));
                return this.markdownToNote(content, options, title);
            case 'html':
                return this.htmlToNote(content, options);
            case 'raw':
            default:
                return this.rawToNote(fileContent, fileExt, options);
        }
    }

    /**
     * Detect content format from file extension
     */
    private detectFormatFromExtension(extension: string): 'markdown' | 'html' | 'raw' {
        const markdownExts = ['.md', '.markdown', '.mdown', '.mkd'];
        const htmlExts = ['.html', '.htm'];

        if (markdownExts.includes(extension)) {
            return 'markdown';
        } else if (htmlExts.includes(extension)) {
            return 'html';
        } else {
            return 'raw';
        }
    }

    /**
     * Convert note to Markdown format
     */
    private async noteToMarkdown(note: BNote, options: ConversionOptions): Promise<ConversionResult> {
        try {
            let content = note.getContent() as string;

            // Convert HTML content to Markdown
            if (note.type === 'text' && note.mime === 'text/html') {
                content = markdownExportService.toMarkdown(content);
            }

            // Add frontmatter with note attributes if requested
            if (options.includeFrontmatter && options.preserveAttributes) {
                const frontmatter = this.createFrontmatter(note);
                if (frontmatter) {
                    content = `---\n${frontmatter}\n---\n\n${content}`;
                }
            }

            return {
                content,
                mime: 'text/markdown',
                type: 'text'
            };
        } catch (error) {
            log.error(`Error converting note ${note.noteId} to Markdown: ${error}`);
            throw error;
        }
    }

    /**
     * Convert note to HTML format
     */
    private async noteToHtml(note: BNote, options: ConversionOptions): Promise<ConversionResult> {
        let content = note.getContent() as string;

        // If note is already HTML, just clean it up
        if (note.type === 'text' && note.mime === 'text/html') {
            // Could add HTML processing here if needed
        } else if (note.type === 'code') {
            // Wrap code content in pre/code tags
            const language = this.getLanguageFromMime(note.mime);
            content = `<pre><code class="language-${language}">${utils.escapeHtml(content)}</code></pre>`;
        }

        // Add HTML frontmatter as comments if requested
        if (options.includeFrontmatter && options.preserveAttributes) {
            const frontmatter = this.createFrontmatter(note);
            if (frontmatter) {
                content = `<!-- \n${frontmatter}\n-->\n\n${content}`;
            }
        }

        return {
            content,
            mime: 'text/html',
            type: 'text'
        };
    }

    /**
     * Convert note to raw format (preserve original content)
     */
    private async noteToRaw(note: BNote, options: ConversionOptions): Promise<ConversionResult> {
        const content = note.getContent();

        return {
            content,
            mime: note.mime,
            type: note.type
        };
    }

    /**
     * Convert Markdown content to note format
     */
    private async markdownToNote(content: string, options: ConversionOptions, title: string = ''): Promise<ConversionResult> {
        try {
            let processedContent = content;
            let attributes: ConversionResult['attributes'] = [];

            // Extract frontmatter if present
            if (options.preserveAttributes) {
                const frontmatterResult = this.extractFrontmatter(content);
                processedContent = frontmatterResult.content;
                attributes = frontmatterResult.attributes;
            }

            // Convert Markdown to HTML using the correct method
            // The title helps deduplicate <h1> tags with the note title
            const htmlContent = markdownImportService.renderToHtml(processedContent, title);

            return {
                content: htmlContent,
                attributes,
                mime: 'text/html',
                type: 'text'
            };
        } catch (error) {
            log.error(`Error converting Markdown to note: ${error}`);
            throw error;
        }
    }

    /**
     * Convert HTML content to note format
     */
    private async htmlToNote(content: string, options: ConversionOptions): Promise<ConversionResult> {
        let processedContent = content;
        let attributes: ConversionResult['attributes'] = [];

        // Extract HTML comment frontmatter if present
        if (options.preserveAttributes) {
            const frontmatterResult = this.extractHtmlFrontmatter(content);
            processedContent = frontmatterResult.content;
            attributes = frontmatterResult.attributes;
        }

        return {
            content: processedContent,
            attributes,
            mime: 'text/html',
            type: 'text'
        };
    }

    /**
     * Convert raw content to note format
     */
    private async rawToNote(content: string | Buffer, extension: string, options: ConversionOptions): Promise<ConversionResult> {
        // Determine note type and mime based on file extension
        const { type, mime } = this.getTypeAndMimeFromExtension(extension);

        return {
            content,
            mime,
            type
        };
    }

    /**
     * Create YAML frontmatter from note attributes
     */
    private createFrontmatter(note: BNote): string | null {
        const attributes = note.getOwnedAttributes();
        if (attributes.length === 0) {
            return null;
        }

        const yamlLines: string[] = [];
        yamlLines.push(`title: "${note.title.replace(/"/g, '\\"')}"`);
        yamlLines.push(`noteId: "${note.noteId}"`);
        yamlLines.push(`type: "${note.type}"`);
        yamlLines.push(`mime: "${note.mime}"`);

        const labels = attributes.filter(attr => attr.type === 'label');
        const relations = attributes.filter(attr => attr.type === 'relation');

        if (labels.length > 0) {
            yamlLines.push('labels:');
            for (const label of labels) {
                const inheritable = label.isInheritable ? ' (inheritable)' : '';
                yamlLines.push(`  - name: "${label.name}"`);
                yamlLines.push(`    value: "${label.value.replace(/"/g, '\\"')}"`);
                if (label.isInheritable) {
                    yamlLines.push(`    inheritable: true`);
                }
            }
        }

        if (relations.length > 0) {
            yamlLines.push('relations:');
            for (const relation of relations) {
                yamlLines.push(`  - name: "${relation.name}"`);
                yamlLines.push(`    target: "${relation.value}"`);
                if (relation.isInheritable) {
                    yamlLines.push(`    inheritable: true`);
                }
            }
        }

        return yamlLines.join('\n');
    }

    /**
     * Extract YAML frontmatter from Markdown content
     */
    private extractFrontmatter(content: string): { content: string; attributes: ConversionResult['attributes'] } {
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);

        if (!match) {
            return { content, attributes: [] };
        }

        const frontmatterYaml = match[1];
        const mainContent = match[2];

        try {
            const attributes = this.parseFrontmatterYaml(frontmatterYaml);
            return { content: mainContent, attributes };
        } catch (error) {
            log.info(`Error parsing frontmatter YAML: ${error}`);
            return { content, attributes: [] };
        }
    }

    /**
     * Extract frontmatter from HTML comments
     */
    private extractHtmlFrontmatter(content: string): { content: string; attributes: ConversionResult['attributes'] } {
        const frontmatterRegex = /^<!--\s*\n([\s\S]*?)\n-->\s*\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);

        if (!match) {
            return { content, attributes: [] };
        }

        const frontmatterYaml = match[1];
        const mainContent = match[2];

        try {
            const attributes = this.parseFrontmatterYaml(frontmatterYaml);
            return { content: mainContent, attributes };
        } catch (error) {
            log.info(`Error parsing HTML frontmatter YAML: ${error}`);
            return { content, attributes: [] };
        }
    }

    /**
     * Parse YAML frontmatter into attributes (simplified YAML parser)
     */
    private parseFrontmatterYaml(yaml: string): ConversionResult['attributes'] {
        const attributes: ConversionResult['attributes'] = [];
        const lines = yaml.split('\n');

        let currentSection: 'labels' | 'relations' | null = null;
        let currentItem: any = {};

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed === 'labels:') {
                currentSection = 'labels';
                continue;
            } else if (trimmed === 'relations:') {
                currentSection = 'relations';
                continue;
            } else if (trimmed.startsWith('- name:')) {
                // Save previous item if exists
                if (currentItem.name && currentSection) {
                    attributes.push({
                        type: currentSection === 'labels' ? 'label' : 'relation',
                        name: currentItem.name,
                        value: currentItem.value || currentItem.target || '',
                        isInheritable: currentItem.inheritable || false
                    });
                }

                currentItem = { name: this.extractQuotedValue(trimmed) };
            } else if (trimmed.startsWith('name:')) {
                currentItem.name = this.extractQuotedValue(trimmed);
            } else if (trimmed.startsWith('value:')) {
                currentItem.value = this.extractQuotedValue(trimmed);
            } else if (trimmed.startsWith('target:')) {
                currentItem.target = this.extractQuotedValue(trimmed);
            } else if (trimmed.startsWith('inheritable:')) {
                currentItem.inheritable = trimmed.includes('true');
            }
        }

        // Save last item
        if (currentItem.name && currentSection) {
            attributes.push({
                type: currentSection === 'labels' ? 'label' : 'relation',
                name: currentItem.name,
                value: currentItem.value || currentItem.target || '',
                isInheritable: currentItem.inheritable || false
            });
        }

        return attributes;
    }

    /**
     * Extract quoted value from YAML line
     */
    private extractQuotedValue(line: string): string {
        const match = line.match(/:\s*"([^"]+)"/);
        return match ? match[1].replace(/\\"/g, '"') : '';
    }

    /**
     * Get language identifier from MIME type
     */
    private getLanguageFromMime(mime: string): string {
        const mimeToLang: Record<string, string> = {
            'application/javascript': 'javascript',
            'text/javascript': 'javascript',
            'application/typescript': 'typescript',
            'text/typescript': 'typescript',
            'application/json': 'json',
            'text/css': 'css',
            'text/html': 'html',
            'application/xml': 'xml',
            'text/xml': 'xml',
            'text/x-python': 'python',
            'text/x-java': 'java',
            'text/x-csharp': 'csharp',
            'text/x-sql': 'sql',
            'text/x-sh': 'bash',
            'text/x-yaml': 'yaml'
        };

        return mimeToLang[mime] || 'text';
    }

    /**
     * Get note type and MIME type from file extension
     */
    private getTypeAndMimeFromExtension(extension: string): { type: NoteType; mime: string } {
        const extToType: Record<string, { type: NoteType; mime: string }> = {
            '.txt': { type: 'text', mime: 'text/plain' },
            '.md': { type: 'text', mime: 'text/markdown' },
            '.html': { type: 'text', mime: 'text/html' },
            '.htm': { type: 'text', mime: 'text/html' },
            '.js': { type: 'code', mime: 'application/javascript' },
            '.ts': { type: 'code', mime: 'application/typescript' },
            '.json': { type: 'code', mime: 'application/json' },
            '.css': { type: 'code', mime: 'text/css' },
            '.xml': { type: 'code', mime: 'application/xml' },
            '.py': { type: 'code', mime: 'text/x-python' },
            '.java': { type: 'code', mime: 'text/x-java' },
            '.cs': { type: 'code', mime: 'text/x-csharp' },
            '.sql': { type: 'code', mime: 'text/x-sql' },
            '.sh': { type: 'code', mime: 'text/x-sh' },
            '.yaml': { type: 'code', mime: 'text/x-yaml' },
            '.yml': { type: 'code', mime: 'text/x-yaml' },
            '.png': { type: 'image', mime: 'image/png' },
            '.jpg': { type: 'image', mime: 'image/jpeg' },
            '.jpeg': { type: 'image', mime: 'image/jpeg' },
            '.gif': { type: 'image', mime: 'image/gif' },
            '.svg': { type: 'image', mime: 'image/svg+xml' }
        };

        return extToType[extension] || { type: 'file', mime: 'application/octet-stream' };
    }

    /**
     * Validate if a file type is supported for sync
     */
    isSupportedFileType(filePath: string): boolean {
        const extension = path.extname(filePath).toLowerCase();
        const textExtensions = ['.txt', '.md', '.html', '.htm', '.js', '.ts', '.json', '.css', '.xml', '.py', '.java', '.cs', '.sql', '.sh', '.yaml', '.yml'];
        const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf'];

        return textExtensions.includes(extension) || binaryExtensions.includes(extension);
    }

    /**
     * Check if file should be treated as binary
     */
    isBinaryFile(filePath: string): boolean {
        const extension = path.extname(filePath).toLowerCase();
        const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf', '.doc', '.docx', '.zip', '.tar', '.gz'];

        return binaryExtensions.includes(extension);
    }
}

// Create singleton instance
const fileSystemContentConverter = new FileSystemContentConverter();

export default fileSystemContentConverter;
