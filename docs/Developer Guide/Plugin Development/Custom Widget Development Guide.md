# Custom Widget Development Guide

This guide provides comprehensive instructions for creating custom widgets in Trilium Notes. Widgets are fundamental UI components that enable you to extend Trilium's functionality with custom interfaces and behaviors.

## Prerequisites

Before developing custom widgets, ensure you have:
- Basic knowledge of TypeScript/JavaScript
- Understanding of jQuery and DOM manipulation
- Familiarity with Trilium's note structure
- A development environment with Trilium running locally

## Understanding Widget Architecture

### Widget Hierarchy

Trilium's widget system follows a hierarchical structure:

```
Component (base class)
    └── BasicWidget
        ├── NoteContextAwareWidget
        │   ├── TypeWidget (for note type widgets)
        │   └── RightPanelWidget
        └── Custom widgets (buttons, containers, etc.)
```

### Core Widget Classes

#### BasicWidget
The foundation class for all widgets. Provides basic rendering, positioning, and visibility management.

```typescript
import BasicWidget from "../widgets/basic_widget.js";

class MyCustomWidget extends BasicWidget {
    doRender() {
        this.$widget = $('<div class="my-widget">Hello Widget</div>');
    }
}
```

#### NoteContextAwareWidget
Extends BasicWidget to respond to note changes. Use this when your widget needs to update based on the active note.

```typescript
import NoteContextAwareWidget from "../widgets/note_context_aware_widget.js";

class NoteInfoWidget extends NoteContextAwareWidget {
    async refreshWithNote(note) {
        if (!note) return;
        
        this.$widget.find('.note-title').text(note.title);
        this.$widget.find('.note-type').text(note.type);
    }
    
    doRender() {
        this.$widget = $(`
            <div class="note-info-widget">
                <div class="note-title"></div>
                <div class="note-type"></div>
            </div>
        `);
    }
}
```

#### RightPanelWidget
Specialized widget for rendering panels in the right sidebar with a consistent card layout.

```typescript
import RightPanelWidget from "../widgets/right_panel_widget.js";

class StatisticsWidget extends RightPanelWidget {
    get widgetTitle() { 
        return "Note Statistics"; 
    }
    
    async doRenderBody() {
        this.$body.html(`
            <div class="stats-container">
                <div class="word-count">Words: <span>0</span></div>
                <div class="char-count">Characters: <span>0</span></div>
            </div>
        `);
    }
    
    async refreshWithNote(note) {
        const content = await note.getContent();
        const wordCount = content.split(/\s+/).length;
        const charCount = content.length;
        
        this.$body.find('.word-count span').text(wordCount);
        this.$body.find('.char-count span').text(charCount);
    }
}
```

## Widget Lifecycle

### Initialization Phase
1. **Constructor**: Set up initial state and child widgets
2. **render()**: Called to create the widget's DOM structure
3. **doRender()**: Override this to create your widget's HTML

### Update Phase
1. **refresh()**: Called when widget needs updating
2. **refreshWithNote()**: Called for NoteContextAwareWidget when note changes
3. **Event handlers**: Respond to various Trilium events

### Cleanup Phase
1. **cleanup()**: Override to clean up resources, event listeners, etc.
2. **remove()**: Removes widget from DOM

## Event Handling

### Subscribing to Events

Widgets can listen to Trilium's event system:

```typescript
class EventAwareWidget extends NoteContextAwareWidget {
    constructor() {
        super();
        // Events are automatically subscribed based on method names
    }
    
    // Called when entities are reloaded
    async entitiesReloadedEvent({ loadResults }) {
        console.log('Entities reloaded');
        await this.refresh();
    }
    
    // Called when note content changes
    async noteContentChangedEvent({ noteId }) {
        if (this.noteId === noteId) {
            await this.refresh();
        }
    }
    
    // Called when active context changes
    async activeContextChangedEvent({ noteContext }) {
        this.noteContext = noteContext;
        await this.refresh();
    }
}
```

### Common Events

- `noteSwitched`: Active note changed
- `activeContextChanged`: Active tab/context changed
- `entitiesReloaded`: Notes, branches, or attributes reloaded
- `noteContentChanged`: Note content modified
- `noteTypeMimeChanged`: Note type or MIME changed
- `frocaReloaded`: Frontend cache reloaded

## State Management

### Local State
Store widget-specific state in instance properties:

```typescript
class StatefulWidget extends BasicWidget {
    constructor() {
        super();
        this.isExpanded = false;
        this.cachedData = null;
    }
    
    toggleExpanded() {
        this.isExpanded = !this.isExpanded;
        this.$widget.toggleClass('expanded', this.isExpanded);
    }
}
```

### Persistent State
Use options or attributes for persistent state:

```typescript
class PersistentWidget extends NoteContextAwareWidget {
    async saveState(state) {
        await server.put('options', {
            name: 'widgetState',
            value: JSON.stringify(state)
        });
    }
    
    async loadState() {
        const option = await server.get('options/widgetState');
        return option ? JSON.parse(option.value) : {};
    }
}
```

## Accessing Trilium APIs

### Frontend Services

```typescript
import froca from "../services/froca.js";
import server from "../services/server.js";
import linkService from "../services/link.js";
import toastService from "../services/toast.js";
import dialogService from "../services/dialog.js";

class ApiWidget extends NoteContextAwareWidget {
    async doRenderBody() {
        // Access notes
        const note = await froca.getNote(this.noteId);
        
        // Get attributes
        const attributes = note.getAttributes();
        
        // Create links
        const $link = await linkService.createLink(note.noteId);
        
        // Show notifications
        toastService.showMessage("Widget loaded");
        
        // Open dialogs
        const result = await dialogService.confirm("Continue?");
    }
}
```

### Server Communication

```typescript
class ServerWidget extends BasicWidget {
    async loadData() {
        // GET request
        const data = await server.get('custom-api/data');
        
        // POST request
        const result = await server.post('custom-api/process', {
            noteId: this.noteId,
            action: 'analyze'
        });
        
        // PUT request
        await server.put(`notes/${this.noteId}`, {
            title: 'Updated Title'
        });
    }
}
```

## Styling Widgets

### Inline Styles
```typescript
class StyledWidget extends BasicWidget {
    doRender() {
        this.$widget = $('<div>');
        this.css('padding', '10px')
            .css('background-color', '#f0f0f0')
            .css('border-radius', '4px');
    }
}
```

### CSS Classes
```typescript
class ClassedWidget extends BasicWidget {
    doRender() {
        this.$widget = $('<div>');
        this.class('custom-widget')
            .class('bordered');
    }
}
```

### CSS Blocks
```typescript
class CSSBlockWidget extends BasicWidget {
    doRender() {
        this.$widget = $('<div class="my-widget">Content</div>');
        
        this.cssBlock(`
            .my-widget {
                padding: 15px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 8px;
            }
            
            .my-widget:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
        `);
    }
}
```

## Performance Optimization

### Lazy Loading
```typescript
class LazyWidget extends NoteContextAwareWidget {
    constructor() {
        super();
        this.dataLoaded = false;
    }
    
    async refreshWithNote(note) {
        if (!this.isVisible()) {
            return; // Don't load if not visible
        }
        
        if (!this.dataLoaded) {
            await this.loadExpensiveData();
            this.dataLoaded = true;
        }
        
        this.updateDisplay();
    }
}
```

### Debouncing Updates
```typescript
import SpacedUpdate from "../services/spaced_update.js";

class DebouncedWidget extends NoteContextAwareWidget {
    constructor() {
        super();
        this.spacedUpdate = new SpacedUpdate(async () => {
            await this.performUpdate();
        }, 500); // 500ms delay
    }
    
    async handleInput(value) {
        await this.spacedUpdate.scheduleUpdate();
    }
}
```

### Caching
```typescript
class CachedWidget extends NoteContextAwareWidget {
    constructor() {
        super();
        this.cache = new Map();
    }
    
    async getProcessedData(noteId) {
        if (!this.cache.has(noteId)) {
            const data = await this.processExpensiveOperation(noteId);
            this.cache.set(noteId, data);
        }
        return this.cache.get(noteId);
    }
    
    cleanup() {
        this.cache.clear();
    }
}
```

## Debugging Widgets

### Console Logging
```typescript
class DebugWidget extends BasicWidget {
    doRender() {
        console.log('Widget rendering', this.componentId);
        console.time('render');
        
        this.$widget = $('<div>');
        
        console.timeEnd('render');
    }
}
```

### Error Handling
```typescript
class SafeWidget extends NoteContextAwareWidget {
    async refreshWithNote(note) {
        try {
            await this.riskyOperation();
        } catch (error) {
            console.error('Widget error:', error);
            this.logRenderingError(error);
            this.$widget.html('<div class="error">Failed to load</div>');
        }
    }
}
```

### Development Tools
```typescript
class DevWidget extends BasicWidget {
    doRender() {
        this.$widget = $('<div>');
        
        // Add debug information in development
        if (window.glob.isDev) {
            this.$widget.attr('data-debug', 'true');
            this.$widget.append(`
                <div class="debug-info">
                    Component ID: ${this.componentId}
                    Position: ${this.position}
                </div>
            `);
        }
    }
}
```

## Complete Example: Note Statistics Widget

Here's a complete example implementing a custom note statistics widget:

```typescript
import RightPanelWidget from "../widgets/right_panel_widget.js";
import server from "../services/server.js";
import froca from "../services/froca.js";
import toastService from "../services/toast.js";
import SpacedUpdate from "../services/spaced_update.js";

class NoteStatisticsWidget extends RightPanelWidget {
    constructor() {
        super();
        
        // Initialize state
        this.statistics = {
            words: 0,
            characters: 0,
            paragraphs: 0,
            readingTime: 0,
            links: 0,
            images: 0
        };
        
        // Debounce updates for performance
        this.spacedUpdate = new SpacedUpdate(async () => {
            await this.calculateStatistics();
        }, 300);
    }
    
    get widgetTitle() {
        return "Note Statistics";
    }
    
    get help() {
        return {
            title: "Note Statistics",
            text: "Displays various statistics about the current note including word count, reading time, and more."
        };
    }
    
    async doRenderBody() {
        this.$body.html(`
            <div class="note-statistics">
                <div class="stat-group">
                    <h5>Content</h5>
                    <div class="stat-item">
                        <span class="stat-label">Words:</span>
                        <span class="stat-value" data-stat="words">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Characters:</span>
                        <span class="stat-value" data-stat="characters">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Paragraphs:</span>
                        <span class="stat-value" data-stat="paragraphs">0</span>
                    </div>
                </div>
                
                <div class="stat-group">
                    <h5>Reading</h5>
                    <div class="stat-item">
                        <span class="stat-label">Reading time:</span>
                        <span class="stat-value" data-stat="readingTime">0 min</span>
                    </div>
                </div>
                
                <div class="stat-group">
                    <h5>Elements</h5>
                    <div class="stat-item">
                        <span class="stat-label">Links:</span>
                        <span class="stat-value" data-stat="links">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Images:</span>
                        <span class="stat-value" data-stat="images">0</span>
                    </div>
                </div>
                
                <div class="stat-actions">
                    <button class="btn btn-sm refresh-stats">Refresh</button>
                    <button class="btn btn-sm export-stats">Export</button>
                </div>
            </div>
        `);
        
        this.cssBlock(`
            .note-statistics {
                padding: 10px;
            }
            
            .stat-group {
                margin-bottom: 15px;
                padding-bottom: 15px;
                border-bottom: 1px solid var(--main-border-color);
            }
            
            .stat-group:last-child {
                border-bottom: none;
            }
            
            .stat-group h5 {
                margin: 0 0 10px 0;
                color: var(--muted-text-color);
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .stat-item {
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
            }
            
            .stat-label {
                color: var(--main-text-color);
            }
            
            .stat-value {
                font-weight: 600;
                color: var(--primary-color);
            }
            
            .stat-actions {
                margin-top: 15px;
                display: flex;
                gap: 10px;
            }
            
            .stat-actions .btn {
                flex: 1;
            }
        `);
        
        // Bind events
        this.$body.on('click', '.refresh-stats', () => this.handleRefresh());
        this.$body.on('click', '.export-stats', () => this.handleExport());
    }
    
    async refreshWithNote(note) {
        if (!note) {
            this.clearStatistics();
            return;
        }
        
        // Schedule statistics calculation
        await this.spacedUpdate.scheduleUpdate();
    }
    
    async calculateStatistics() {
        try {
            const note = this.note;
            if (!note) return;
            
            const content = await note.getContent();
            
            if (note.type === 'text') {
                // Parse HTML content
                const $content = $('<div>').html(content);
                const textContent = $content.text();
                
                // Calculate statistics
                this.statistics.words = this.countWords(textContent);
                this.statistics.characters = textContent.length;
                this.statistics.paragraphs = $content.find('p').length;
                this.statistics.readingTime = Math.ceil(this.statistics.words / 200);
                this.statistics.links = $content.find('a').length;
                this.statistics.images = $content.find('img').length;
            } else if (note.type === 'code') {
                // For code notes, count lines and characters
                const lines = content.split('\n');
                this.statistics.words = lines.length; // Show lines instead of words
                this.statistics.characters = content.length;
                this.statistics.paragraphs = 0;
                this.statistics.readingTime = 0;
                this.statistics.links = 0;
                this.statistics.images = 0;
            }
            
            this.updateDisplay();
            
        } catch (error) {
            console.error('Failed to calculate statistics:', error);
            toastService.showError("Failed to calculate statistics");
        }
    }
    
    countWords(text) {
        const words = text.match(/\b\w+\b/g);
        return words ? words.length : 0;
    }
    
    clearStatistics() {
        this.statistics = {
            words: 0,
            characters: 0,
            paragraphs: 0,
            readingTime: 0,
            links: 0,
            images: 0
        };
        this.updateDisplay();
    }
    
    updateDisplay() {
        this.$body.find('[data-stat="words"]').text(this.statistics.words);
        this.$body.find('[data-stat="characters"]').text(this.statistics.characters);
        this.$body.find('[data-stat="paragraphs"]').text(this.statistics.paragraphs);
        this.$body.find('[data-stat="readingTime"]').text(`${this.statistics.readingTime} min`);
        this.$body.find('[data-stat="links"]').text(this.statistics.links);
        this.$body.find('[data-stat="images"]').text(this.statistics.images);
    }
    
    async handleRefresh() {
        await this.calculateStatistics();
        toastService.showMessage("Statistics refreshed");
    }
    
    async handleExport() {
        const note = this.note;
        if (!note) return;
        
        const exportData = {
            noteId: note.noteId,
            title: note.title,
            statistics: this.statistics,
            timestamp: new Date().toISOString()
        };
        
        // Create a CSV
        const csv = [
            'Metric,Value',
            `Words,${this.statistics.words}`,
            `Characters,${this.statistics.characters}`,
            `Paragraphs,${this.statistics.paragraphs}`,
            `Reading Time,${this.statistics.readingTime} minutes`,
            `Links,${this.statistics.links}`,
            `Images,${this.statistics.images}`
        ].join('\n');
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `statistics-${note.noteId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        toastService.showMessage("Statistics exported");
    }
    
    async noteContentChangedEvent({ noteId }) {
        if (this.noteId === noteId) {
            await this.spacedUpdate.scheduleUpdate();
        }
    }
    
    cleanup() {
        this.$body.off('click');
        this.spacedUpdate = null;
    }
}

export default NoteStatisticsWidget;
```

## Best Practices

### 1. Memory Management
- Clean up event listeners in `cleanup()`
- Clear caches and timers when widget is destroyed
- Avoid circular references

### 2. Performance
- Use debouncing for frequent updates
- Implement lazy loading for expensive operations
- Cache computed values when appropriate

### 3. Error Handling
- Always wrap async operations in try-catch
- Provide user feedback for errors
- Log errors for debugging

### 4. User Experience
- Show loading states for async operations
- Provide clear error messages
- Ensure widgets are responsive

### 5. Code Organization
- Keep widgets focused on a single responsibility
- Extract reusable logic into services
- Use composition over inheritance when possible

## Troubleshooting

### Widget Not Rendering
- Check `doRender()` creates `this.$widget`
- Verify widget is properly registered
- Check console for errors

### Events Not Firing
- Ensure event method name matches pattern: `${eventName}Event`
- Check event is being triggered
- Verify widget is active/visible

### State Not Persisting
- Use options or attributes for persistence
- Check save operations complete successfully
- Verify data serialization

### Performance Issues
- Profile with browser dev tools
- Implement caching and debouncing
- Optimize DOM operations

## Next Steps

- Explore existing widgets in `/apps/client/src/widgets/` for examples
- Review the Frontend Script API documentation
- Join the Trilium community for support and sharing widgets