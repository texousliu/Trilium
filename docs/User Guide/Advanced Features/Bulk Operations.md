# Bulk Operations

Execute actions on multiple notes simultaneously, saving time and ensuring consistency across your note collection.

## Prerequisites

- Understanding of Trilium's note hierarchy
- Familiarity with search functionality
- Basic knowledge of attributes (labels and relations)

## Overview

Bulk operations allow you to perform batch actions on multiple notes at once. This powerful feature enables efficient management of large note collections, systematic reorganization, and mass updates to note metadata.

## Available Bulk Actions

### Note Operations

#### Move Notes
Relocate multiple notes to a new parent location in the hierarchy.

```javascript
{
  "name": "moveNote",
  "targetParentNoteId": "target_note_id"
}
```

**Behavior:**
- Notes with single parent: moved to target location
- Notes with multiple parents: cloned to target location (preserving existing relationships)

#### Delete Notes
Remove multiple notes from the database.

```javascript
{
  "name": "deleteNote"
}
```

**Important:** This operation is permanent. Deleted notes can only be recovered from backups.

#### Rename Notes
Update titles of multiple notes using dynamic patterns.

```javascript
{
  "name": "renameNote",
  "newTitle": "Prefix: ${note.title}"
}
```

**Available variables:**
- `${note.title}` - Current note title
- `${note.noteId}` - Note identifier
- `${note.dateCreated}` - Creation date

#### Delete Revisions
Remove all revision history for selected notes.

```javascript
{
  "name": "deleteRevisions"
}
```

**Use cases:**
- Reduce database size
- Remove sensitive historical data
- Clean up after major content updates

### Attribute Operations

#### Add Label
Attach a new label to multiple notes.

```javascript
{
  "name": "addLabel",
  "labelName": "status",
  "labelValue": "reviewed"
}
```

#### Update Label Value
Modify existing label values across multiple notes.

```javascript
{
  "name": "updateLabelValue",
  "labelName": "priority",
  "labelValue": "high"
}
```

#### Rename Label
Change label names while preserving values.

```javascript
{
  "name": "renameLabel",
  "oldLabelName": "tag",
  "newLabelName": "category"
}
```

#### Delete Label
Remove specific labels from multiple notes.

```javascript
{
  "name": "deleteLabel",
  "labelName": "deprecated"
}
```

### Relation Operations

#### Add Relation
Create relationships between notes and a target.

```javascript
{
  "name": "addRelation",
  "relationName": "references",
  "targetNoteId": "target_note_id"
}
```

#### Update Relation Target
Redirect existing relations to a new target note.

```javascript
{
  "name": "updateRelationTarget",
  "relationName": "template",
  "targetNoteId": "new_template_id"
}
```

#### Rename Relation
Change relation names while maintaining connections.

```javascript
{
  "name": "renameRelation",
  "oldRelationName": "parent",
  "newRelationName": "category"
}
```

#### Delete Relation
Remove specific relations from multiple notes.

```javascript
{
  "name": "deleteRelation",
  "relationName": "obsolete"
}
```

### Custom Script Execution

Execute JavaScript code against each selected note.

```javascript
{
  "name": "executeScript",
  "script": "note.setLabel('processed', new Date().toISOString());"
}
```

**Available context:**
- `note` - Current note object with full API access

## Using Bulk Operations

### Via Search Results

1. Execute a search query to find target notes
2. Select "Bulk Actions" from the search results menu
3. Choose desired action and configure parameters
4. Review affected note count
5. Execute the operation

### Via Script API

```javascript
const api = require('trilium');

// Find all notes with specific label
const targetNotes = api.searchForNotes('#needsUpdate');

// Define actions
const actions = [
  {
    name: 'updateLabelValue',
    labelName: 'status',
    labelValue: 'updated'
  },
  {
    name: 'addLabel',
    labelName: 'lastProcessed',
    labelValue: new Date().toISOString()
  }
];

// Execute bulk operation
api.executeBulkActions(targetNotes, actions, false);
```

### Including Descendants

Set `includeDescendants` to `true` to apply operations to entire subtrees:

```javascript
api.executeBulkActions(noteIds, actions, true);
```

## Performance Considerations

### Database Impact

- **Small operations (< 100 notes):** Minimal impact, execute immediately
- **Medium operations (100-1000 notes):** May cause brief UI lag
- **Large operations (> 1000 notes):** Consider running during low-activity periods

### Optimization Strategies

1. **Batch Processing**
   - Break large operations into smaller chunks
   - Process in sequential batches to prevent timeouts

2. **Index Utilization**
   - Ensure search queries use indexed attributes
   - Avoid complex nested searches for bulk operations

3. **Memory Management**
   - Operations load all target notes into memory
   - Monitor system resources for very large operations

## Use Case Examples

### Project Archival
Archive completed project notes with metadata:

```javascript
const projectNotes = api.searchForNotes('#project #status=completed');
const archiveActions = [
  { name: 'moveNote', targetParentNoteId: 'archive_folder_id' },
  { name: 'addLabel', labelName: 'archivedDate', labelValue: new Date().toISOString() },
  { name: 'deleteLabel', labelName: 'active' }
];
api.executeBulkActions(projectNotes, archiveActions, true);
```

### Content Migration
Migrate notes from old structure to new taxonomy:

```javascript
const oldCategoryNotes = api.searchForNotes('#category=old-system');
const migrationActions = [
  { name: 'renameLabel', oldLabelName: 'category', newLabelName: 'legacy-category' },
  { name: 'addRelation', relationName: 'migrated-to', targetNoteId: 'new_system_root' }
];
api.executeBulkActions(oldCategoryNotes, migrationActions, false);
```

### Bulk Metadata Update
Add timestamps and processing flags:

```javascript
const unprocessedNotes = api.searchForNotes('!#processed');
const metadataActions = [
  { 
    name: 'executeScript', 
    script: `
      note.setLabel('processed', 'true');
      note.setLabel('processedBy', 'bulk-operation');
      note.setLabel('processedDate', new Date().toISOString());
    `
  }
];
api.executeBulkActions(unprocessedNotes, metadataActions, false);
```

## Troubleshooting

### Operation Fails Silently
**Symptom:** Bulk operation completes but changes aren't visible.

**Solutions:**
- Verify note IDs exist and are accessible
- Check for protected notes requiring unlocked session
- Review browser console for JavaScript errors
- Ensure sufficient permissions for target operations

### Performance Degradation
**Symptom:** System becomes unresponsive during large operations.

**Solutions:**
- Reduce batch size to under 500 notes
- Disable real-time sync during operation
- Clear browser cache before large operations
- Consider server-side script execution for massive updates

### Inconsistent Results
**Symptom:** Some notes updated while others unchanged.

**Solutions:**
- Check for note-specific validation errors
- Verify attribute name consistency (case-sensitive)
- Ensure target notes aren't deleted or archived
- Review operation logs for specific failures

### Memory Errors
**Symptom:** "Out of memory" errors for large operations.

**Solutions:**
- Increase Node.js heap size: `NODE_OPTIONS="--max-old-space-size=4096"`
- Process notes in smaller batches
- Use streaming operations for file attachments
- Restart Trilium server before massive operations

## Best Practices

1. **Always Test First**
   - Run operations on small test set
   - Verify expected behavior before full execution

2. **Create Backups**
   - Backup database before irreversible operations
   - Export affected notes as additional precaution

3. **Document Operations**
   - Log bulk operations with timestamp and purpose
   - Maintain audit trail for compliance requirements

4. **Use Transactions**
   - Group related actions in single operation
   - Ensures atomic updates (all or nothing)

5. **Monitor Progress**
   - Watch server logs during execution
   - Set up alerts for long-running operations

## Related Topics

- [Search Documentation](../Search/Search-Documentation.md)
- [Attribute System](../Attributes/Attribute-System.md)
- [Script API Reference](../../Script-API/Reference.md)
- [Database Maintenance](../Maintenance/Database.md)