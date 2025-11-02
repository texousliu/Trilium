# Trilium Scripting System

> **Related:** [ARCHITECTURE.md](ARCHITECTURE.md) | [Script API Documentation](Script%20API/)

## Overview

Trilium features a **powerful scripting system** that allows users to extend and customize the application without modifying source code. Scripts are written in JavaScript and can execute both in the **frontend (browser)** and **backend (Node.js)** contexts.

## Script Types

### Frontend Scripts

**Location:** Attached to notes with `#run=frontendStartup` attribute

**Execution Context:** Browser environment

**Access:**
- Trilium Frontend API
- Browser APIs (DOM, localStorage, etc.)
- Froca (frontend cache)
- UI widgets
- No direct file system access

**Lifecycle:**
- `frontendStartup` - Run once when Trilium loads
- `frontendReload` - Run on every note context change

**Example:**
```javascript
// Attach to note with #run=frontendStartup
const api = window.api

// Add custom button to toolbar
api.addButtonToToolbar({
    title: 'My Button',
    icon: 'star',
    action: () => {
        api.showMessage('Hello from frontend!')
    }
})
```

### Backend Scripts

**Location:** Attached to notes with `#run=backendStartup` attribute

**Execution Context:** Node.js server environment

**Access:**
- Trilium Backend API
- Node.js APIs (fs, http, etc.)
- Becca (backend cache)
- Database (SQL)
- External libraries (via require)

**Lifecycle:**
- `backendStartup` - Run once when server starts
- Event handlers (custom events)

**Example:**
```javascript
// Attach to note with #run=backendStartup
const api = require('@triliumnext/api')

// Listen for note creation
api.dayjs // Example: access dayjs library

api.onNoteCreated((note) => {
    if (note.title.includes('TODO')) {
        note.setLabel('priority', 'high')
    }
})
```

### Render Scripts

**Location:** Attached to notes with `#customWidget` or similar attributes

**Purpose:** Custom note rendering/widgets

**Example:**
```javascript
// Custom widget for a note
class MyWidget extends api.NoteContextAwareWidget {
    doRender() {
        this.$widget = $('<div>')
            .text('Custom widget content')
        return this.$widget
    }
}

module.exports = MyWidget
```

## Script API

### Frontend API

**Location:** `apps/client/src/services/frontend_script_api.ts`

**Global Access:** `window.api`

**Key Methods:**

```typescript
// Note Operations
api.getNote(noteId)                    // Get note object
api.getBranch(branchId)                // Get branch object
api.getActiveNote()                    // Currently displayed note
api.openNote(noteId, activateNote)     // Open note in UI

// UI Operations
api.showMessage(message)               // Show toast notification
api.showDialog()                       // Show modal dialog
api.confirm(message)                   // Show confirmation dialog
api.prompt(message, defaultValue)      // Show input prompt

// Tree Operations
api.getTree()                          // Get note tree structure
api.expandTree(noteId)                 // Expand tree branch
api.collapseTree(noteId)               // Collapse tree branch

// Search
api.searchForNotes(searchQuery)        // Search notes
api.searchForNote(searchQuery)         // Get single note

// Navigation
api.openTabWithNote(noteId)            // Open note in new tab
api.closeActiveTab()                   // Close current tab
api.activateNote(noteId)               // Switch to note

// Attributes
api.getAttribute(noteId, type, name)   // Get attribute
api.getAttributes(noteId, type, name)  // Get all matching attributes

// Custom Widgets
api.addButtonToToolbar(def)            // Add toolbar button
api.addCustomWidget(def)               // Add custom widget

// Events
api.runOnNoteOpened(callback)          // Note opened event
api.runOnNoteContentChange(callback)   // Content changed event

// Utilities
api.dayjs                              // Date/time library
api.formatDate(date)                   // Format date
api.log(message)                       // Console log
```

### Backend API

**Location:** `apps/server/src/services/backend_script_api.ts`

**Access:** `require('@triliumnext/api')` or global `api`

**Key Methods:**

```typescript
// Note Operations
api.getNote(noteId)                    // Get note from Becca
api.getNoteWithContent(noteId)         // Get note with content
api.createNote(parentNoteId, title)    // Create new note
api.deleteNote(noteId)                 // Delete note

// Branch Operations
api.getBranch(branchId)                // Get branch
api.createBranch(noteId, parentNoteId) // Create branch (clone)

// Attribute Operations
api.getAttribute(noteId, type, name)   // Get attribute
api.createAttribute(noteId, type, name, value) // Create attribute

// Database Access
api.sql.getRow(query, params)          // Execute SQL query (single row)
api.sql.getRows(query, params)         // Execute SQL query (multiple rows)
api.sql.execute(query, params)         // Execute SQL statement

// Events
api.onNoteCreated(callback)            // Note created event
api.onNoteUpdated(callback)            // Note updated event
api.onNoteDeleted(callback)            // Note deleted event
api.onAttributeCreated(callback)       // Attribute created event

// Search
api.searchForNotes(searchQuery)        // Search notes

// Date/Time
api.dayjs                              // Date/time library
api.now()                              // Current date/time

// Logging
api.log(message)                       // Log message
api.error(message)                     // Log error

// External Communication
api.axios                              // HTTP client library

// Utilities
api.backup.backupNow()                 // Trigger backup
api.export.exportSubtree(noteId)       // Export notes
```

## Script Attributes

### Execute Attributes

- `#run=frontendStartup` - Execute on frontend startup
- `#run=backendStartup` - Execute on backend startup
- `#run=hourly` - Execute every hour
- `#run=daily` - Execute daily

### Widget Attributes

- `#customWidget` - Custom note widget
- `#widget` - Standard widget integration

### Other Attributes

- `#disableVersioning` - Disable automatic versioning for this note
- `#hideChildrenOverview` - Hide children in overview
- `#iconClass` - Custom icon for note

## Entity Classes

### Frontend Entities

**FNote** (`apps/client/src/entities/fnote.ts`)

```typescript
class FNote {
    noteId: string
    title: string
    type: string
    mime: string
    
    // Relationships
    getParentNotes(): FNote[]
    getChildNotes(): FNote[]
    getBranches(): FBranch[]
    
    // Attributes
    getAttribute(type, name): FAttribute
    getAttributes(type?, name?): FAttribute[]
    hasLabel(name): boolean
    getLabelValue(name): string
    
    // Content
    getContent(): Promise<string>
    
    // Navigation
    open(): void
}
```

**FBranch**

```typescript
class FBranch {
    branchId: string
    noteId: string
    parentNoteId: string
    prefix: string
    notePosition: number
    
    getNote(): FNote
    getParentNote(): FNote
}
```

**FAttribute**

```typescript
class FAttribute {
    attributeId: string
    noteId: string
    type: 'label' | 'relation'
    name: string
    value: string
    
    getNote(): FNote
    getTargetNote(): FNote  // For relations
}
```

### Backend Entities

**BNote** (`apps/server/src/becca/entities/bnote.ts`)

```typescript
class BNote {
    noteId: string
    title: string
    type: string
    mime: string
    isProtected: boolean
    
    // Content
    getContent(): string | Buffer
    setContent(content: string | Buffer): void
    
    // Relationships
    getParentNotes(): BNote[]
    getChildNotes(): BNote[]
    getBranches(): BBranch[]
    
    // Attributes
    getAttribute(type, name): BAttribute
    getAttributes(type?, name?): BAttribute[]
    setLabel(name, value): BAttribute
    setRelation(name, targetNoteId): BAttribute
    hasLabel(name): boolean
    getLabelValue(name): string
    
    // Operations
    save(): void
    markAsDeleted(): void
}
```

**BBranch**

```typescript
class BBranch {
    branchId: string
    noteId: string
    parentNoteId: string
    prefix: string
    notePosition: number
    
    getNote(): BNote
    getParentNote(): BNote
    save(): void
}
```

**BAttribute**

```typescript
class BAttribute {
    attributeId: string
    noteId: string
    type: 'label' | 'relation'
    name: string
    value: string
    
    getNote(): BNote
    getTargetNote(): BNote  // For relations
    save(): void
}
```

## Script Examples

### Frontend Examples

**1. Custom Toolbar Button**

```javascript
// #run=frontendStartup
api.addButtonToToolbar({
    title: 'Export to PDF',
    icon: 'file-export',
    action: async () => {
        const note = api.getActiveNote()
        if (note) {
            await api.runOnBackend('exportToPdf', [note.noteId])
            api.showMessage('Export started')
        }
    }
})
```

**2. Auto-Save Reminder**

```javascript
// #run=frontendStartup
let saveTimer
api.runOnNoteContentChange(() => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
        api.showMessage('Remember to save your work!')
    }, 300000) // 5 minutes
})
```

**3. Note Statistics Widget**

```javascript
// #customWidget
class StatsWidget extends api.NoteContextAwareWidget {
    doRender() {
        this.$widget = $('<div class="stats-widget">')
        return this.$widget
    }
    
    async refreshWithNote(note) {
        const content = await note.getContent()
        const words = content.split(/\s+/).length
        const chars = content.length
        
        this.$widget.html(`
            <div>Words: ${words}</div>
            <div>Characters: ${chars}</div>
        `)
    }
}

module.exports = StatsWidget
```

### Backend Examples

**1. Auto-Tagging on Note Creation**

```javascript
// #run=backendStartup
api.onNoteCreated((note) => {
    // Auto-tag TODO notes
    if (note.title.includes('TODO')) {
        note.setLabel('type', 'todo')
        note.setLabel('priority', 'normal')
    }
    
    // Auto-tag meeting notes by date
    if (note.title.match(/Meeting \d{4}-\d{2}-\d{2}/)) {
        note.setLabel('type', 'meeting')
        const dateMatch = note.title.match(/(\d{4}-\d{2}-\d{2})/)
        if (dateMatch) {
            note.setLabel('date', dateMatch[1])
        }
    }
})
```

**2. Daily Backup Reminder**

```javascript
// #run=daily
const todayNote = api.getTodayNote()
todayNote.setLabel('backupDone', 'false')

// Create reminder note
api.createNote(todayNote.noteId, '🔔 Backup Reminder', {
    content: 'Remember to verify today\'s backup!',
    type: 'text'
})
```

**3. External API Integration**

```javascript
// #run=backendStartup
api.onNoteCreated(async (note) => {
    // Sync new notes to external service
    if (note.hasLabel('sync-external')) {
        try {
            await api.axios.post('https://external-api.com/sync', {
                noteId: note.noteId,
                title: note.title,
                content: note.getContent()
            })
            note.setLabel('lastSync', api.dayjs().format())
        } catch (error) {
            api.log('Sync failed: ' + error.message)
        }
    }
})
```

**4. Database Cleanup**

```javascript
// #run=weekly
// Clean up old revisions
const cutoffDate = api.dayjs().subtract(90, 'days').format()

const oldRevisions = api.sql.getRows(`
    SELECT revisionId FROM revisions 
    WHERE utcDateCreated < ?
`, [cutoffDate])

api.log(`Deleting ${oldRevisions.length} old revisions`)

for (const row of oldRevisions) {
    api.sql.execute('DELETE FROM revisions WHERE revisionId = ?', [row.revisionId])
}
```

## Script Storage

**Storage Location:** Scripts are stored as regular notes

**Identifying Scripts:**
- Have `#run` attribute or `#customWidget` attribute
- Type is typically `code` with MIME `application/javascript`

**Script Note Structure:**
```
📁 Scripts (folder note)
├── 📜 Frontend Scripts
│   ├── Custom Toolbar Button (#run=frontendStartup)
│   └── Statistics Widget (#customWidget)
└── 📜 Backend Scripts
    ├── Auto-Tagger (#run=backendStartup)
    └── Daily Backup (#run=daily)
```

## Script Execution

### Frontend Execution

**Timing:**
1. Trilium frontend loads
2. Froca cache initializes
3. Script notes with `#run=frontendStartup` are found
4. Scripts execute in dependency order

**Isolation:**
- Each script runs in separate context
- Shared `window.api` object
- Can access global window object

### Backend Execution

**Timing:**
1. Server starts
2. Becca cache loads
3. Script notes with `#run=backendStartup` are found
4. Scripts execute in dependency order

**Isolation:**
- Each script is a separate module
- Can require Node.js modules
- Shared `api` global

### Error Handling

**Frontend:**
```javascript
try {
    // Script code
} catch (error) {
    api.showError('Script error: ' + error.message)
    console.error(error)
}
```

**Backend:**
```javascript
try {
    // Script code
} catch (error) {
    api.log('Script error: ' + error.message)
    console.error(error)
}
```

## Security Considerations

### Frontend Scripts

**Risks:**
- Can access all notes via Froca
- Can manipulate DOM
- Can make API calls
- Limited by browser security model

**Mitigations:**
- User must trust scripts they add
- Scripts run with user privileges
- No access to file system

### Backend Scripts

**Risks:**
- Full Node.js access
- Can execute system commands
- Can access file system
- Can make network requests

**Mitigations:**
- Scripts are user-created (trusted)
- Single-user model (no privilege escalation)
- Review scripts before adding `#run` attribute

### Best Practices

1. **Review script code** before adding execution attributes
2. **Use specific attributes** rather than wildcard searches
3. **Avoid eval()** and dynamic code execution
4. **Validate inputs** in scripts
5. **Handle errors** gracefully
6. **Log important actions** for audit trail

## Performance Considerations

### Optimization Tips

**1. Cache Results:**
```javascript
// Bad: Re-query on every call
function getConfig() {
    return api.getNote('config').getContent()
}

// Good: Cache the result
let cachedConfig
function getConfig() {
    if (!cachedConfig) {
        cachedConfig = api.getNote('config').getContent()
    }
    return cachedConfig
}
```

**2. Use Efficient Queries:**
```javascript
// Bad: Load all notes and filter
const todos = api.searchForNotes('#type=todo')

// Good: Use specific search
const todos = api.searchForNotes('#type=todo #status=pending')
```

**3. Batch Operations:**
```javascript
// Bad: Save after each change
notes.forEach(note => {
    note.title = 'Updated'
    note.save()
})

// Good: Batch changes
notes.forEach(note => {
    note.title = 'Updated'
})
// Save happens in batch
```

**4. Debounce Event Handlers:**
```javascript
let timeout
api.runOnNoteContentChange(() => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
        // Process change
    }, 500)
})
```

## Debugging Scripts

### Frontend Debugging

**Browser DevTools:**
```javascript
console.log('Debug info:', data)
debugger  // Breakpoint
```

**Trilium Log:**
```javascript
api.log('Script executed')
```

### Backend Debugging

**Console Output:**
```javascript
console.log('Backend debug:', data)
api.log('Script log message')
```

**Inspect Becca:**
```javascript
api.log('Note count:', Object.keys(api.becca.notes).length)
```

## Advanced Topics

### Custom Note Types

Scripts can implement custom note type handlers:

```javascript
// Register custom type
api.registerNoteType({
    type: 'mytype',
    mime: 'application/x-mytype',
    renderNote: (note) => {
        // Custom rendering
    }
})
```

### External Libraries

**Frontend:**
```javascript
// Load external library
const myLib = await import('https://cdn.example.com/lib.js')
```

**Backend:**
```javascript
// Use Node.js require
const fs = require('fs')
const axios = require('axios')
```

### State Persistence

**Frontend:**
```javascript
// Use localStorage
localStorage.setItem('myScript:data', JSON.stringify(data))
const data = JSON.parse(localStorage.getItem('myScript:data'))
```

**Backend:**
```javascript
// Store in special note
const stateNote = api.getNote('script-state-note')
stateNote.setContent(JSON.stringify(data))

const data = JSON.parse(stateNote.getContent())
```

---

**See Also:**
- [Script API Documentation](Script%20API/) - Complete API reference
- [Advanced Showcases](https://triliumnext.github.io/Docs/Wiki/advanced-showcases) - Example scripts
- [ARCHITECTURE.md](ARCHITECTURE.md) - Overall architecture
