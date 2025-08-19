/**
 * Quick Search specific result renderer
 * 
 * This module provides HTML rendering functionality specifically for the Quick Search widget.
 * The Jump To dialog (note_autocomplete) intentionally has its own inline rendering logic
 * with different styling and layout requirements.
 * 
 * SECURITY NOTE: HTML Snippet Handling
 * The highlighted snippet fields (highlightedContentSnippet, highlightedAttributeSnippet) contain
 * pre-sanitized HTML from the server. The server-side processing:
 * 1. Escapes all HTML using the escape-html library
 * 2. Adds safe HTML tags for display: <b> for search term highlighting, <br> for line breaks
 * 3. See apps/server/src/services/search/services/search.ts for implementation
 * 
 * This means the HTML snippets can be safely inserted without additional escaping on the client side.
 */

import type { Suggestion } from "./note_autocomplete.js";

/**
 * Creates HTML for a Quick Search result item
 * 
 * @param result - The search result item to render
 * @returns HTML string formatted for Quick Search widget display
 */
export function createSearchResultHtml(result: Suggestion): string {
    // Handle command action
    if (result.action === "command") {
        let html = `<div class="command-suggestion">`;
        html += `<span class="command-icon ${result.icon || "bx bx-terminal"}"></span>`;
        html += `<div class="command-content">`;
        html += `<div class="command-name">${result.highlightedNotePathTitle || ''}</div>`;
        if (result.commandDescription) {
            html += `<div class="command-description">${result.commandDescription}</div>`;
        }
        html += `</div>`;
        if (result.commandShortcut) {
            html += `<kbd class="command-shortcut">${result.commandShortcut}</kbd>`;
        }
        html += '</div>';
        return html;
    }

    // Default: render as note result with snippets
    // Wrap everything in a flex column container
    let itemHtml = `<div style="display: flex; flex-direction: column; gap: 2px;">`;
    
    // Title row with icon
    itemHtml += `<div style="display: flex; align-items: center; gap: 6px;">`;
    itemHtml += `<span class="${result.icon || 'bx bx-note'}" style="flex-shrink: 0;"></span>`;
    itemHtml += `<span class="search-result-title" style="flex: 1;">${result.highlightedNotePathTitle || result.notePathTitle || ''}</span>`;
    itemHtml += `</div>`;
    
    // Add attribute snippet if available
    if (result.highlightedAttributeSnippet && result.highlightedAttributeSnippet.trim()) {
        itemHtml += `<div class="search-result-attributes" style="margin-left: 20px;">${result.highlightedAttributeSnippet}</div>`;
    }
    
    // Add content snippet if available
    if (result.highlightedContentSnippet && result.highlightedContentSnippet.trim()) {
        itemHtml += `<div class="search-result-content" style="margin-left: 20px;">${result.highlightedContentSnippet}</div>`;
    }
    
    itemHtml += `</div>`;
    
    return itemHtml;
}