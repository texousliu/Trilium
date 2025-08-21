# Special Notes

Understanding Trilium's system notes and their specialized purposes in the application architecture.

## Prerequisites

- Basic understanding of Trilium's note hierarchy
- Familiarity with hidden notes concept
- Knowledge of basic note operations

## Overview

Special notes are system-managed notes that provide core functionality to Trilium. These notes have specific IDs, behaviors, and purposes that extend beyond regular user notes. They form the backbone of various features including configuration, templates, scripting, and UI customization.

## System Note Categories

### Core System Notes

#### Root Note
- **ID:** `root`
- **Purpose:** Top-level container for entire note tree
- **Characteristics:**
  - Cannot be deleted or moved
  - Always visible in tree
  - Parent of all top-level notes

#### Hidden Root
- **ID:** `_hidden`
- **Purpose:** Container for system and auxiliary notes
- **Characteristics:**
  - Not visible in main tree
  - Contains system configuration notes
  - Stores temporary and utility notes

### Configuration Notes

#### Global Options
- **ID:** `_options`
- **Purpose:** Store application-wide settings
- **Structure:**
```javascript
{
  theme: "dark",
  language: "en",
  syncServerHost: "",
  revisionCleanupDays: 90
}
```

#### Workspace Configuration
- **ID:** `_workspace`
- **Purpose:** Store workspace-specific settings
- **Access:** Via hoisted note system
- **Contains:**
  - Layout preferences
  - Active widgets
  - View configurations

### Utility Notes

#### SQL Console
- **ID Pattern:** `_sqlConsole`
- **Purpose:** Execute SQL queries against database
- **Features:**
  - Syntax highlighting
  - Query history
  - Result formatting

**Creation:**
```javascript
const sqlConsole = api.createSqlConsole();
sqlConsole.setContent(`
  SELECT noteId, title, type 
  FROM notes 
  WHERE isDeleted = 0
  LIMIT 10
`);
```

#### Search Notes
- **ID Pattern:** `_search`
- **Purpose:** Store and execute saved searches
- **Attributes:**
  - `#searchString`: Query definition
  - `#ancestor`: Scope limitation

**Creation:**
```javascript
const searchNote = api.createSearchNote(
  '#task #priority=high', 
  'project_root_id'
);
```

#### Bulk Action Note
- **ID:** `_bulkAction`
- **Purpose:** Define reusable bulk operations
- **Structure:**
```javascript
// Stored as #action labels
{
  "name": "archiveCompleted",
  "actions": [
    {"name": "moveNote", "targetParentNoteId": "archive"},
    {"name": "addLabel", "labelName": "archived", "labelValue": "true"}
  ]
}
```

### Template System Notes

#### Note Templates
- **ID Pattern:** `_template_*`
- **Purpose:** Define reusable note structures
- **Usage:**
  - New note creation
  - Bulk note generation
  - Consistent formatting

#### Widget Templates
- **Location:** Under `_hidden`
- **Types:**
  - `_lbtplNoteLauncher`: Note launcher template
  - `_lbtplScript`: Script launcher template
  - `_lbtplCustomWidget`: Custom widget template
  - `_lbtplSpacer`: Spacer template

### Launcher Bar System

#### Launcher Root
- **ID:** `_lbRoot`
- **Purpose:** Desktop launcher bar configuration
- **Structure:**
```
_lbRoot
├── _lbVisibleLaunchers
│   ├── launcher1
│   └── launcher2
└── _lbAvailableLaunchers
    ├── availableLauncher1
    └── availableLauncher2
```

#### Mobile Launcher Root
- **ID:** `_lbMobileRoot`
- **Purpose:** Mobile launcher bar configuration
- **Differences:**
  - Simplified layout
  - Touch-optimized launchers
  - Reduced feature set

### Script Management

#### Global Scripts
- **ID:** `_global`
- **Purpose:** Container for application-wide scripts
- **Script Types:**
  - Backend startup scripts
  - Frontend initialization
  - Event handlers

**Structure:**
```
_global
├── backendStartup.js
├── frontendStartup.js
└── eventHandlers/
    ├── noteCreated.js
    └── noteDeleted.js
```

#### API Scripts
- **Location:** `_hidden/api/`
- **Purpose:** Custom REST endpoints
- **Example:**
```javascript
// _hidden/api/customEndpoint.js
module.exports = (req, res) => {
  const result = processRequest(req.body);
  res.json(result);
};
```

## Working with Special Notes

### Accessing System Notes

```javascript
// Direct access
const options = api.getNote('_options');
const hidden = api.getNote('_hidden');

// Via specialized methods
const inbox = api.getInboxNote();
const sqlConsole = api.getSqlConsole();
```

### Creating Special Notes

#### Inbox Note
```javascript
// Get or create inbox for current date
const inbox = api.getInboxNote(api.getDayNote());
inbox.setLabel('inbox');
inbox.setLabel('iconClass', 'bx bx-inbox');
```

#### Custom Launcher
```javascript
api.createLauncher({
  parentNoteId: '_lbVisibleLaunchers',
  launcherType: 'script',
  noteId: 'customLauncher'
});
```

### Special Note Paths

#### Path Resolution
```javascript
// Special paths are resolved automatically
const note = api.getNote('_hidden/scripts/myScript');

// Equivalent to
const hidden = api.getNote('_hidden');
const scripts = hidden.getChildNoteByTitle('scripts');
const myScript = scripts.getChildNoteByTitle('myScript');
```

## System Note Behaviors

### Protection Rules

1. **Undeletable Notes**
   - `root`, `_hidden`, `_options`
   - Core launcher notes
   - Active workspace notes

2. **Restricted Operations**
   - Cannot change type of system notes
   - Cannot modify system note IDs
   - Cannot clone certain system notes

### Inheritance Patterns

System notes follow special inheritance rules:
```javascript
// System attributes don't inherit by default
#systemNote=true  // Not inheritable
#widget=config    // Not inheritable

// Unless explicitly marked
#cssClass=theme-dark #inheritable
```

### Visibility Control

```javascript
// Hidden from search by default
#excludeFromSearch

// Hidden from tree
#hideInTree

// Hidden from export
#excludeFromExport
```

## Advanced System Notes

### Day Notes Configuration
- **Location:** `_hidden/dayNotes/`
- **Purpose:** Template and configuration for daily notes
- **Attributes:**
  - `#datePattern`: Format for date notes
  - `#template`: Template note reference

### Share Configuration
- **Location:** `_share`
- **Purpose:** Configure note sharing settings
- **Contains:**
  - Shared note references
  - Access permissions
  - Share aliases

### Sync Configuration
- **Location:** `_hidden/sync/`
- **Purpose:** Synchronization settings and state
- **Contains:**
  - Sync targets
  - Conflict resolution rules
  - Sync history

## Creating Custom System Notes

### Define System Note Type
```javascript
class CustomSystemNote {
  constructor(noteId, config) {
    this.noteId = noteId;
    this.config = config;
    this.initialize();
  }
  
  initialize() {
    const note = api.createNote({
      noteId: this.noteId,
      parentNoteId: '_hidden',
      title: this.config.title,
      type: 'code',
      mime: 'application/json'
    });
    
    note.setLabel('systemNote', 'true');
    note.setContent(JSON.stringify(this.config.defaultContent));
  }
}
```

### Register System Note
```javascript
// In backend startup script
api.registerSystemNote('_customSystem', {
  onCreate: (note) => {
    // Initialization logic
  },
  onAccess: (note) => {
    // Access control
  },
  onModify: (note, changes) => {
    // Validation logic
  }
});
```

## Troubleshooting

### System Note Missing
**Symptom:** Expected system note not found.

**Solutions:**
- Check if note was accidentally deleted
- Verify note ID is correct
- Recreate using initialization script
- Restore from backup if critical

### Cannot Modify System Note
**Symptom:** Changes to system note rejected.

**Solutions:**
- Check if note has write protection
- Verify user has admin privileges
- Use appropriate API methods
- Disable protection temporarily if needed

### System Note Corruption
**Symptom:** System features not working correctly.

**Solutions:**
- Run database consistency check
- Rebuild system note from template
- Clear cache and restart
- Restore from known good backup

## Best Practices

1. **Never Manually Delete System Notes**
   - Use appropriate APIs
   - Understand dependencies
   - Keep backups

2. **Document Custom System Notes**
   - Record purpose and structure
   - Document dependencies
   - Provide recovery procedures

3. **Use Appropriate Access Methods**
   - Use specialized APIs when available
   - Avoid direct database manipulation
   - Respect system constraints

4. **Monitor System Note Health**
   - Regular consistency checks
   - Monitor for unexpected changes
   - Track access patterns

5. **Version Control System Scripts**
   - Export system scripts regularly
   - Track changes in external VCS
   - Document modifications

## Related Topics

- [Hidden Notes](../Hidden-Notes.md)
- [Note Templates](../Templates.md)
- [Launcher Configuration](../UI/Launcher-Bar.md)
- [Database Structure](../../Developer/Database-Schema.md)