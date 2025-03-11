import sql from '../sql.js';
import sanitizeHtml from 'sanitize-html';
import becca from '../../becca/becca.js';

/**
 * Utility class for extracting context from notes to provide to AI models
 * Enhanced with advanced capabilities for handling large notes and specialized content
 */
export class ContextExtractor {
    /**
     * Get the content of a note
     */
    async getNoteContent(noteId: string): Promise<string | null> {
        // Use Becca API to get note data
        const note = becca.getNote(noteId);

        if (!note) {
            return null;
        }

        try {
            // Get content using Becca API
            const content = String(await note.getContent() || "");

            return this.formatNoteContent(
                content,
                note.type,
                note.mime,
                note.title
            );
        } catch (error) {
            console.error(`Error getting content for note ${noteId}:`, error);
            return null;
        }
    }

    /**
     * Split a large note into smaller, semantically meaningful chunks
     * This is useful for handling large notes that exceed the context window of LLMs
     *
     * @param noteId - The ID of the note to chunk
     * @param maxChunkSize - Maximum size of each chunk in characters
     * @returns Array of content chunks, or empty array if note not found
     */
    async getChunkedNoteContent(noteId: string, maxChunkSize = 2000): Promise<string[]> {
        const content = await this.getNoteContent(noteId);
        if (!content) return [];

        // Split into semantic chunks (paragraphs, sections, etc.)
        return this.splitContentIntoChunks(content, maxChunkSize);
    }

    /**
     * Split text content into semantically meaningful chunks based on natural boundaries
     * like paragraphs, headings, and code blocks
     *
     * @param content - The text content to split
     * @param maxChunkSize - Maximum size of each chunk in characters
     * @returns Array of content chunks
     */
    private splitContentIntoChunks(content: string, maxChunkSize: number): string[] {
        // Look for semantic boundaries (headings, blank lines, etc.)
        const headingPattern = /^(#+)\s+(.+)$/gm;
        const codeBlockPattern = /```[\s\S]+?```/gm;

        // Replace code blocks with placeholders to avoid splitting inside them
        const codeBlocks: string[] = [];
        let contentWithPlaceholders = content.replace(codeBlockPattern, (match) => {
            const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
            codeBlocks.push(match);
            return placeholder;
        });

        // Split content at headings and paragraphs
        const sections: string[] = [];
        let currentSection = '';

        // First split by headings
        const lines = contentWithPlaceholders.split('\n');
        for (const line of lines) {
            const isHeading = headingPattern.test(line);
            headingPattern.lastIndex = 0; // Reset regex

            // If this is a heading and we already have content, start a new section
            if (isHeading && currentSection.trim().length > 0) {
                sections.push(currentSection.trim());
                currentSection = line;
            } else {
                currentSection += (currentSection ? '\n' : '') + line;
            }
        }

        // Add the last section if there's any content
        if (currentSection.trim().length > 0) {
            sections.push(currentSection.trim());
        }

        // Now combine smaller sections to respect maxChunkSize
        const chunks: string[] = [];
        let currentChunk = '';

        for (const section of sections) {
            // If adding this section exceeds maxChunkSize and we already have content,
            // finalize the current chunk and start a new one
            if ((currentChunk + section).length > maxChunkSize && currentChunk.length > 0) {
                chunks.push(currentChunk);
                currentChunk = section;
            } else {
                currentChunk += (currentChunk ? '\n\n' : '') + section;
            }
        }

        // Add the last chunk if there's any content
        if (currentChunk.length > 0) {
            chunks.push(currentChunk);
        }

        // Restore code blocks in all chunks
        return chunks.map(chunk => {
            return chunk.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => {
                return codeBlocks[parseInt(index)];
            });
        });
    }

    /**
     * Generate a summary of a note's content
     * Useful for providing a condensed version of very large notes
     *
     * @param noteId - The ID of the note to summarize
     * @param maxLength - Cut-off length to trigger summarization
     * @returns Summary of the note or the original content if small enough
     */
    async getNoteSummary(noteId: string, maxLength = 5000): Promise<string> {
        const content = await this.getNoteContent(noteId);
        if (!content || content.length < maxLength) return content || '';

        // For larger content, generate a summary
        return this.summarizeContent(content);
    }

    /**
     * Summarize content by extracting key information
     * This uses a heuristic approach to find important sentences and paragraphs
     *
     * @param content - The content to summarize
     * @returns A summarized version of the content
     */
    private summarizeContent(content: string): string {
        // Extract title/heading if present
        const titleMatch = content.match(/^# (.+)$/m);
        const title = titleMatch ? titleMatch[1] : 'Untitled Note';

        // Extract all headings for an outline
        const headings: string[] = [];
        const headingMatches = content.matchAll(/^(#+)\s+(.+)$/gm);
        for (const match of headingMatches) {
            const level = match[1].length;
            const text = match[2];
            headings.push(`${'  '.repeat(level-1)}- ${text}`);
        }

        // Extract first sentence of each paragraph for a summary
        const paragraphs = content.split(/\n\s*\n/);
        const firstSentences = paragraphs
            .filter(p => p.trim().length > 0 && !p.trim().startsWith('#') && !p.trim().startsWith('```'))
            .map(p => {
                const sentenceMatch = p.match(/^[^.!?]+[.!?]/);
                return sentenceMatch ? sentenceMatch[0].trim() : p.substring(0, Math.min(150, p.length)).trim() + '...';
            })
            .slice(0, 5); // Limit to 5 sentences

        // Create the summary
        let summary = `# Summary of: ${title}\n\n`;

        if (headings.length > 0) {
            summary += `## Document Outline\n${headings.join('\n')}\n\n`;
        }

        if (firstSentences.length > 0) {
            summary += `## Key Points\n${firstSentences.map(s => `- ${s}`).join('\n')}\n\n`;
        }

        summary += `(Note: This is an automatically generated summary of a larger document with ${content.length} characters)`;

        return summary;
    }

    /**
     * Get a set of parent notes to provide hierarchical context
     */
    async getParentContext(noteId: string, maxDepth = 3): Promise<string> {
        // Note: getParentNotes has already been updated to use Becca
        const parents = await this.getParentNotes(noteId, maxDepth);
        if (!parents.length) return '';

        let context = 'Here is the hierarchical context for the current note:\n\n';

        // Create a hierarchical view of the parents using indentation
        // to show the proper parent-child relationship
        let indentLevel = 0;
        for (let i = 0; i < parents.length; i++) {
            const parent = parents[i];
            const indent = '  '.repeat(indentLevel);
            context += `${indent}- ${parent.title}\n`;
            indentLevel++;
        }

        // Now add the current note with proper indentation
        const note = becca.getNote(noteId);
        if (note) {
            const indent = '  '.repeat(indentLevel);
            context += `${indent}- ${note.title} (current note)\n`;
        }

        return context + '\n';
    }

    /**
     * Get child notes to provide additional context
     */
    async getChildContext(noteId: string, maxChildren = 5): Promise<string> {
        const note = becca.getNote(noteId);

        if (!note) {
            return '';
        }

        // Use Becca API to get child notes
        const childNotes = note.getChildNotes();

        if (!childNotes || childNotes.length === 0) {
            return '';
        }

        let context = 'The current note has these child notes:\n\n';

        // Limit to maxChildren
        const childrenToShow = childNotes.slice(0, maxChildren);

        for (const child of childrenToShow) {
            context += `- ${child.title}\n`;
        }

        // If there are more children than we're showing, indicate that
        if (childNotes.length > maxChildren) {
            context += `\n(+ ${childNotes.length - maxChildren} more child notes)\n`;
        }

        return context + '\n';
    }

    /**
     * Get notes linked to this note
     */
    async getLinkedNotesContext(noteId: string, maxLinks = 5): Promise<string> {
        const note = becca.getNote(noteId);

        if (!note) {
            return '';
        }

        // Use Becca API to get relations
        const relations = note.getRelations();

        if (!relations || relations.length === 0) {
            return '';
        }

        // Get the target notes from relations
        const linkedNotes = relations
            .map(relation => relation.targetNote)
            .filter(note => note !== null && note !== undefined);

        if (linkedNotes.length === 0) {
            return '';
        }

        let context = 'This note has relationships with these notes:\n\n';

        // Limit to maxLinks
        const notesToShow = linkedNotes.slice(0, maxLinks);

        for (const linked of notesToShow) {
            context += `- ${linked.title}\n`;
        }

        // If there are more linked notes than we're showing, indicate that
        if (linkedNotes.length > maxLinks) {
            context += `\n(+ ${linkedNotes.length - maxLinks} more linked notes)\n`;
        }

        return context + '\n';
    }

    /**
     * Format the content of a note based on its type
     * Enhanced with better handling for large and specialized content types
     */
    private formatNoteContent(content: string, type: string, mime: string, title: string): string {
        let formattedContent = `# ${title}\n\n`;

        switch (type) {
            case 'text':
                // Remove HTML formatting for text notes
                formattedContent += this.sanitizeHtml(content);
                break;

            case 'code':
                // Improved code handling with language detection
                const codeLanguage = this.detectCodeLanguage(content, mime);

                // For large code files, extract structure rather than full content
                if (content.length > 8000) {
                    formattedContent += this.extractCodeStructure(content, codeLanguage);
                } else {
                    formattedContent += `\`\`\`${codeLanguage}\n${content}\n\`\`\``;
                }
                break;

            case 'canvas':
                if (mime === 'application/json') {
                    try {
                        // Parse JSON content
                        const jsonContent = JSON.parse(content);

                        // Extract text elements from canvas
                        if (jsonContent.elements && Array.isArray(jsonContent.elements)) {
                            const texts = jsonContent.elements
                                .filter((element: any) => element.type === 'text' && element.text)
                                .map((element: any) => element.text);

                            formattedContent += 'Canvas content:\n' + texts.join('\n');
                        } else {
                            formattedContent += '[Empty canvas]';
                        }
                    }
                    catch (e: any) {
                        formattedContent += `[Error parsing canvas content: ${e.message}]`;
                    }
                } else {
                    formattedContent += '[Canvas content]';
                }
                break;

            case 'mindMap':
                if (mime === 'application/json') {
                    try {
                        // Parse JSON content
                        const jsonContent = JSON.parse(content);

                        // Extract node text from mind map
                        const extractMindMapNodes = (node: any): string[] => {
                            let texts: string[] = [];
                            if (node.text) {
                                texts.push(node.text);
                            }
                            if (node.children && Array.isArray(node.children)) {
                                for (const child of node.children) {
                                    texts = texts.concat(extractMindMapNodes(child));
                                }
                            }
                            return texts;
                        };

                        if (jsonContent.root) {
                            formattedContent += 'Mind map content:\n' + extractMindMapNodes(jsonContent.root).join('\n');
                        } else {
                            formattedContent += '[Empty mind map]';
                        }
                    }
                    catch (e: any) {
                        formattedContent += `[Error parsing mind map content: ${e.message}]`;
                    }
                } else {
                    formattedContent += '[Mind map content]';
                }
                break;

            case 'relationMap':
                if (mime === 'application/json') {
                    try {
                        // Parse JSON content
                        const jsonContent = JSON.parse(content);

                        // Extract relation map entities and connections
                        let result = 'Relation map content:\n';

                        if (jsonContent.notes && Array.isArray(jsonContent.notes)) {
                            result += 'Notes: ' + jsonContent.notes
                                .map((note: any) => note.title || note.name)
                                .filter(Boolean)
                                .join(', ') + '\n';
                        }

                        if (jsonContent.relations && Array.isArray(jsonContent.relations)) {
                            result += 'Relations: ' + jsonContent.relations
                                .map((rel: any) => {
                                    const sourceNote = jsonContent.notes.find((n: any) => n.noteId === rel.sourceNoteId);
                                    const targetNote = jsonContent.notes.find((n: any) => n.noteId === rel.targetNoteId);
                                    const source = sourceNote ? (sourceNote.title || sourceNote.name) : 'unknown';
                                    const target = targetNote ? (targetNote.title || targetNote.name) : 'unknown';
                                    return `${source} → ${rel.name || ''} → ${target}`;
                                })
                                .join('; ');
                        }

                        formattedContent += result;
                    }
                    catch (e: any) {
                        formattedContent += `[Error parsing relation map content: ${e.message}]`;
                    }
                } else {
                    formattedContent += '[Relation map content]';
                }
                break;

            case 'geoMap':
                if (mime === 'application/json') {
                    try {
                        // Parse JSON content
                        const jsonContent = JSON.parse(content);

                        let result = 'Geographic map content:\n';

                        if (jsonContent.markers && Array.isArray(jsonContent.markers)) {
                            if (jsonContent.markers.length > 0) {
                                result += jsonContent.markers
                                    .map((marker: any) => {
                                        return `Location: ${marker.title || ''} (${marker.lat}, ${marker.lng})${marker.description ? ' - ' + marker.description : ''}`;
                                    })
                                    .join('\n');
                            } else {
                                result += 'Empty geographic map';
                            }
                        } else {
                            result += 'Empty geographic map';
                        }

                        formattedContent += result;
                    }
                    catch (e: any) {
                        formattedContent += `[Error parsing geographic map content: ${e.message}]`;
                    }
                } else {
                    formattedContent += '[Geographic map content]';
                }
                break;

            case 'mermaid':
                // Format mermaid diagrams as code blocks
                formattedContent += '```mermaid\n' + content + '\n```';
                break;

            case 'image':
            case 'file':
                formattedContent += `[${type} attachment]`;
                break;

            default:
                // For other notes, just use the content as is
                formattedContent += this.sanitizeHtml(content);
        }

        return formattedContent;
    }

    /**
     * Detect the programming language of code content
     *
     * @param content - The code content to analyze
     * @param mime - MIME type (if available)
     * @returns The detected language or empty string
     */
    private detectCodeLanguage(content: string, mime: string): string {
        // First check if mime type provides a hint
        if (mime) {
            const mimeMap: Record<string, string> = {
                'text/x-python': 'python',
                'text/javascript': 'javascript',
                'application/javascript': 'javascript',
                'text/typescript': 'typescript',
                'application/typescript': 'typescript',
                'text/x-java': 'java',
                'text/html': 'html',
                'text/css': 'css',
                'text/x-c': 'c',
                'text/x-c++': 'cpp',
                'text/x-csharp': 'csharp',
                'text/x-go': 'go',
                'text/x-ruby': 'ruby',
                'text/x-php': 'php',
                'text/x-swift': 'swift',
                'text/x-rust': 'rust',
                'text/markdown': 'markdown',
                'text/x-sql': 'sql',
                'text/x-yaml': 'yaml',
                'application/json': 'json',
                'text/x-shell': 'bash'
            };

            for (const [mimePattern, language] of Object.entries(mimeMap)) {
                if (mime.includes(mimePattern)) {
                    return language;
                }
            }
        }

        // Check for common language patterns in the content
        const firstLines = content.split('\n', 20).join('\n');

        const languagePatterns: Record<string, RegExp> = {
            'python': /^(import\s+|from\s+\w+\s+import|def\s+\w+\s*\(|class\s+\w+\s*:)/m,
            'javascript': /^(const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|function\s+\w+\s*\(|import\s+.*from\s+)/m,
            'typescript': /^(interface\s+\w+|type\s+\w+\s*=|class\s+\w+\s*{)/m,
            'html': /^<!DOCTYPE html>|<html>|<head>|<body>/m,
            'css': /^(\.\w+\s*{|\#\w+\s*{|@media|@import)/m,
            'java': /^(public\s+class|import\s+java|package\s+)/m,
            'cpp': /^(#include\s+<\w+>|namespace\s+\w+|void\s+\w+\s*\()/m,
            'csharp': /^(using\s+System|namespace\s+\w+|public\s+class)/m,
            'go': /^(package\s+\w+|import\s+\(|func\s+\w+\s*\()/m,
            'ruby': /^(require\s+|class\s+\w+\s*<|def\s+\w+)/m,
            'php': /^(<\?php|namespace\s+\w+|use\s+\w+)/m,
            'sql': /^(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE)/im,
            'bash': /^(#!\/bin\/sh|#!\/bin\/bash|function\s+\w+\s*\(\))/m,
            'markdown': /^(#\s+|##\s+|###\s+|\*\s+|-\s+|>\s+)/m,
            'json': /^({[\s\n]*"|[\s\n]*\[)/m,
            'yaml': /^(---|\w+:\s+)/m
        };

        for (const [language, pattern] of Object.entries(languagePatterns)) {
            if (pattern.test(firstLines)) {
                return language;
            }
        }

        // Default to empty string if we can't detect the language
        return '';
    }

    /**
     * Extract the structure of a code file rather than its full content
     * Useful for providing high-level understanding of large code files
     *
     * @param content - The full code content
     * @param language - The programming language
     * @returns A structured representation of the code
     */
    private extractCodeStructure(content: string, language: string): string {
        const lines = content.split('\n');
        const maxLines = 8000;

        // If it's not that much over the limit, just include the whole thing
        if (lines.length <= maxLines * 1.2) {
            return `\`\`\`${language}\n${content}\n\`\`\``;
        }

        // For large files, extract important structural elements based on language
        let extractedStructure = '';
        let importSection = '';
        let classDefinitions = [];
        let functionDefinitions = [];
        let otherImportantLines = [];

        // Extract imports/includes, class/function definitions based on language
        if (['javascript', 'typescript', 'python', 'java', 'csharp'].includes(language)) {
            // Find imports
            for (let i = 0; i < Math.min(100, lines.length); i++) {
                if (lines[i].match(/^(import|from|using|require|#include|package)\s+/)) {
                    importSection += lines[i] + '\n';
                }
            }

            // Find class definitions
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].match(/^(class|interface|type)\s+\w+/)) {
                    const endBracketLine = this.findMatchingEnd(lines, i, language);
                    if (endBracketLine > i && endBracketLine <= i + 10) {
                        // Include small class definitions entirely
                        classDefinitions.push(lines.slice(i, endBracketLine + 1).join('\n'));
                        i = endBracketLine;
                    } else {
                        // For larger classes, just show the definition and methods
                        let className = lines[i];
                        classDefinitions.push(className);

                        // Look for methods in this class
                        for (let j = i + 1; j < Math.min(endBracketLine, lines.length); j++) {
                            if (lines[j].match(/^\s+(function|def|public|private|protected)\s+\w+/)) {
                                classDefinitions.push('  ' + lines[j].trim());
                            }
                        }

                        if (endBracketLine > 0 && endBracketLine < lines.length) {
                            i = endBracketLine;
                        }
                    }
                }
            }

            // Find function definitions not inside classes
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].match(/^(function|def|const\s+\w+\s*=\s*\(|let\s+\w+\s*=\s*\(|var\s+\w+\s*=\s*\()/)) {
                    functionDefinitions.push(lines[i]);
                }
            }
        }

        // Build the extracted structure
        extractedStructure += `# Code Structure (${lines.length} lines total)\n\n`;

        if (importSection) {
            extractedStructure += "## Imports/Dependencies\n```" + language + "\n" + importSection + "```\n\n";
        }

        if (classDefinitions.length > 0) {
            extractedStructure += "## Classes/Interfaces\n```" + language + "\n" + classDefinitions.join('\n\n') + "\n```\n\n";
        }

        if (functionDefinitions.length > 0) {
            extractedStructure += "## Functions\n```" + language + "\n" + functionDefinitions.join('\n\n') + "\n```\n\n";
        }

        // Add beginning and end of the file for context
        extractedStructure += "## Beginning of File\n```" + language + "\n" +
            lines.slice(0, Math.min(50, lines.length)).join('\n') + "\n```\n\n";

        if (lines.length > 100) {
            extractedStructure += "## End of File\n```" + language + "\n" +
                lines.slice(Math.max(0, lines.length - 50)).join('\n') + "\n```\n\n";
        }

        return extractedStructure;
    }

    /**
     * Find the line number of the matching ending bracket/block
     *
     * @param lines - Array of code lines
     * @param startLine - Starting line number
     * @param language - Programming language
     * @returns The line number of the matching end, or -1 if not found
     */
    private findMatchingEnd(lines: string[], startLine: number, language: string): number {
        let depth = 0;
        let inClass = false;

        // Different languages have different ways to define blocks
        if (['javascript', 'typescript', 'java', 'csharp', 'cpp'].includes(language)) {
            // Curly brace languages
            for (let i = startLine; i < lines.length; i++) {
                const line = lines[i];
                // Count opening braces
                for (const char of line) {
                    if (char === '{') depth++;
                    if (char === '}') {
                        depth--;
                        if (depth === 0 && inClass) return i;
                    }
                }

                // Check if this line contains the class declaration
                if (i === startLine && line.includes('{')) {
                    inClass = true;
                } else if (i === startLine) {
                    // If the first line doesn't have an opening brace, look at the next few lines
                    if (i + 1 < lines.length && lines[i + 1].includes('{')) {
                        inClass = true;
                    }
                }
            }
        } else if (language === 'python') {
            // Indentation-based language
            const baseIndentation = lines[startLine].match(/^\s*/)?.[0].length || 0;

            for (let i = startLine + 1; i < lines.length; i++) {
                // Skip empty lines
                if (lines[i].trim() === '') continue;

                const currentIndentation = lines[i].match(/^\s*/)?.[0].length || 0;

                // If we're back to the same or lower indentation level, we've reached the end
                if (currentIndentation <= baseIndentation) {
                    return i - 1;
                }
            }
        }

        return -1;
    }

    /**
     * Sanitize HTML content to plain text
     */
    private sanitizeHtml(html: string): string {
        if (!html) return '';

        // Use sanitizeHtml to remove all HTML tags
        let content = sanitizeHtml(html, {
            allowedTags: [],
            allowedAttributes: {},
            textFilter: (text) => {
                // Replace multiple newlines with a single one
                return text.replace(/\n\s*\n/g, '\n\n');
            }
        });

        // Additional cleanup for any remaining HTML entities
        content = content
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");

        return content;
    }

    /**
     * Get parent notes in the hierarchy
     */
    private async getParentNotes(noteId: string, maxDepth: number): Promise<{noteId: string, title: string}[]> {
        const parentNotes: {noteId: string, title: string}[] = [];
        const startNote = becca.getNote(noteId);

        if (!startNote) {
            return parentNotes;
        }

        // Use non-null assertion as we checked above
        let currentNote: any = startNote;

        for (let i = 0; i < maxDepth; i++) {
            // Get parent branches (should be just one in most cases)
            if (!currentNote) break;

            const parentBranches: any[] = currentNote.getParentBranches();

            if (!parentBranches || parentBranches.length === 0) {
                break;
            }

            // Use the first parent branch
            const branch: any = parentBranches[0];
            if (!branch) break;

            const parentNote: any = branch.getParentNote();

            if (!parentNote || parentNote.noteId === 'root') {
                break;
            }

            parentNotes.unshift({
                noteId: parentNote.noteId,
                title: parentNote.title
            });

            currentNote = parentNote;
        }

        return parentNotes;
    }

    /**
     * Get the full context for a note, including parent hierarchy, content, and children
     */
    async getFullContext(noteId: string): Promise<string> {
        const noteContent = await this.getNoteContent(noteId);
        if (!noteContent) {
            return 'Note not found';
        }

        const parentContext = await this.getParentContext(noteId);
        const childContext = await this.getChildContext(noteId);
        const linkedContext = await this.getLinkedNotesContext(noteId);

        return [
            parentContext,
            noteContent,
            childContext,
            linkedContext
        ].filter(Boolean).join('\n\n');
    }

    /**
     * Get semantically ranked context based on semantic similarity to a query
     * This method delegates to the semantic context service for the actual ranking
     *
     * @param noteId - The ID of the current note
     * @param query - The user's query to compare against
     * @param maxResults - Maximum number of related notes to include
     * @returns Context with the most semantically relevant related notes
     */
    async getSemanticContext(noteId: string, query: string, maxResults = 5): Promise<string> {
        try {
            // This requires the semantic context service to be available
            // We're using a dynamic import to avoid circular dependencies
            const { default: aiServiceManager } = await import('./ai_service_manager.js');
            const semanticContext = aiServiceManager.getInstance().getSemanticContextService();

            if (!semanticContext) {
                return this.getFullContext(noteId);
            }

            return await semanticContext.getSemanticContext(noteId, query, maxResults);
        } catch (error) {
            // Fall back to regular context if semantic ranking fails
            console.error('Error in semantic context ranking:', error);
            return this.getFullContext(noteId);
        }
    }

    /**
     * Get progressively loaded context based on depth level
     * This provides different levels of context detail depending on the depth parameter
     *
     * @param noteId - The ID of the note to get context for
     * @param depth - Depth level (1-4) determining how much context to include
     * @returns Context appropriate for the requested depth
     */
    async getProgressiveContext(noteId: string, depth = 1): Promise<string> {
        try {
            // This requires the semantic context service to be available
            // We're using a dynamic import to avoid circular dependencies
            const { default: aiServiceManager } = await import('./ai_service_manager.js');
            const semanticContext = aiServiceManager.getInstance().getSemanticContextService();

            if (!semanticContext) {
                return this.getFullContext(noteId);
            }

            return await semanticContext.getProgressiveContext(noteId, depth);
        } catch (error) {
            // Fall back to regular context if progressive loading fails
            console.error('Error in progressive context loading:', error);
            return this.getFullContext(noteId);
        }
    }

    /**
     * Get smart context based on the query complexity
     * This automatically selects the appropriate context depth and relevance
     *
     * @param noteId - The ID of the note to get context for
     * @param query - The user's query for semantic relevance matching
     * @returns The optimal context for answering the query
     */
    async getSmartContext(noteId: string, query: string): Promise<string> {
        try {
            // This requires the semantic context service to be available
            // We're using a dynamic import to avoid circular dependencies
            const { default: aiServiceManager } = await import('./ai_service_manager.js');
            const semanticContext = aiServiceManager.getInstance().getSemanticContextService();

            if (!semanticContext) {
                return this.getFullContext(noteId);
            }

            return await semanticContext.getSmartContext(noteId, query);
        } catch (error) {
            // Fall back to regular context if smart context fails
            console.error('Error in smart context selection:', error);
            return this.getFullContext(noteId);
        }
    }
}

// Singleton instance
const contextExtractor = new ContextExtractor();
export default contextExtractor;
