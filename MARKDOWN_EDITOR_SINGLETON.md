# Markdown Editor Singleton Architecture

## Overview
This document describes the refactoring of the Markdown editor to use a singleton pattern for the Toast UI Editor instance, improving performance and resource management.

## Architecture Changes

### Before (Instance-per-Widget)
- Each `MarkdownTypeWidget` created its own `Editor` instance
- Editor was destroyed and recreated when switching between notes
- High memory usage and initialization overhead
- Potential for memory leaks

### After (Singleton Pattern)
- Single global `Editor` instance managed by `MarkdownEditorManager`
- Editor instance is reused across all markdown notes
- Only content and container attachment changes when switching notes
- Improved performance and reduced memory usage

## Key Components

### 1. MarkdownEditorManager (Singleton)
```typescript
class MarkdownEditorManager {
    private static instance: MarkdownEditorManager;
    private editor: Editor | null = null;
    private isInitialized = false;
    private currentContainer: HTMLElement | null = null;
    private currentWidget: MarkdownTypeWidget | null = null;
}
```

**Responsibilities:**
- Initialize Toast UI Editor once during application startup
- Manage editor attachment/detachment to different containers
- Handle content updates and event binding
- Provide unified API for editor operations

**Key Methods:**
- `initializeEditor()` - Initialize the editor instance once
- `attachToContainer()` - Move editor to a new container
- `detachFromContainer()` - Detach editor from current container
- `setContent()` / `getContent()` - Content management
- `updateReadOnlyMode()` - Handle read-only state

### 2. MarkdownTypeWidget (Refactored)
```typescript
export default class MarkdownTypeWidget extends TypeWidget {
    private editorManager = MarkdownEditorManager.getInstance();
    public isEditorReady = false;
    private isFallbackMode = false;
}
```

**Changes:**
- Removed local `editor` instance
- Uses `editorManager` for all editor operations
- Simplified initialization logic
- No longer destroys editor on cleanup

## Initialization Flow

### Application Startup
```typescript
import { initializeMarkdownEditor } from './widgets/type_widgets/markdown.js';

// During client initialization
await initializeMarkdownEditor();
```

### Note Switching
1. `doRefresh()` called with new note
2. `initializeEditorAsync()` ensures global editor is ready
3. `editorManager.attachToContainer()` moves editor to current widget
4. `editorManager.setContent()` updates content
5. Event handlers rebound to current widget

### Widget Cleanup
1. `cleanup()` called when widget is destroyed
2. `editorManager.detachFromContainer()` removes editor from container
3. Editor instance remains alive for reuse

## Benefits

### Performance Improvements
- **Faster Note Switching**: No editor recreation overhead
- **Reduced Memory Usage**: Single editor instance vs multiple instances
- **Improved Startup Time**: Editor initialized once during app startup
- **Better Resource Management**: No repeated DOM manipulation

### User Experience
- **Seamless Transitions**: Instant switching between markdown notes
- **Consistent State**: Editor settings preserved across notes
- **Reduced Loading Time**: No initialization delay when opening notes

### Development Benefits
- **Simplified Logic**: Centralized editor management
- **Better Error Handling**: Single point of failure management
- **Easier Maintenance**: Unified editor configuration
- **Memory Leak Prevention**: Proper resource lifecycle management

## Fallback Mechanism
The fallback to simple textarea editor remains unchanged:
- If Toast UI Editor fails to initialize, fallback is used
- Each widget can independently use fallback mode
- No impact on singleton architecture

## API Changes

### Global Functions
```typescript
// Initialize editor during app startup
export const initializeMarkdownEditor = async (): Promise<void>

// Cleanup editor during app shutdown
export const destroyMarkdownEditor = (): void
```

### Widget Methods (Unchanged)
- `getData()` - Get current content
- `focus()` - Focus editor
- `scrollToEnd()` - Scroll to end
- `exportMarkdown()` / `exportHtml()` - Export functions

## Migration Notes

### For Application Integration
1. Call `initializeMarkdownEditor()` during client startup
2. Call `destroyMarkdownEditor()` during app shutdown
3. No changes needed for existing widget usage

### For Widget Development
- Editor operations now go through `editorManager`
- No direct access to `Editor` instance in widgets
- Simplified error handling and state management

## Future Enhancements

### Possible Improvements
- **Editor Pool**: Multiple editor instances for different themes
- **Lazy Loading**: Initialize editor only when first markdown note is opened
- **State Persistence**: Remember editor preferences across sessions
- **Plugin System**: Extensible editor functionality

### Monitoring
- Track editor initialization success/failure rates
- Monitor memory usage improvements
- Measure note switching performance gains

This singleton architecture provides a solid foundation for efficient markdown editing while maintaining backward compatibility and robust fallback mechanisms.