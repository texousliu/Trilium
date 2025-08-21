# Note Revisions

Track and restore previous versions of your notes with Trilium's comprehensive revision system.

## Prerequisites

- Basic understanding of note types and content
- Familiarity with note protection (for encrypted revisions)
- Understanding of database storage implications

## Overview

The revision system automatically creates snapshots of note content at specific intervals, enabling version history tracking, content recovery, and change auditing. Each revision captures the complete state of a note including content, title, and metadata at a specific point in time.

## How Revisions Work

### Automatic Revision Creation

Revisions are created automatically when:

1. **Content Changes:** Significant modifications to note content
2. **Time Intervals:** Periodic snapshots based on configured intervals
3. **Manual Triggers:** Explicit revision creation via API or UI

### Revision Components

Each revision stores:
- **Content:** Complete note content at revision time
- **Title:** Note title when revision was created
- **Metadata:** Type, MIME type, protection status
- **Timestamps:** Creation and last edit dates
- **Blob Reference:** Efficient storage of binary content

### Storage Architecture

```sql
-- Revision structure
CREATE TABLE revisions (
    revisionId TEXT PRIMARY KEY,
    noteId TEXT NOT NULL,
    type TEXT NOT NULL,
    mime TEXT NOT NULL,
    title TEXT NOT NULL,
    blobId TEXT,
    dateLastEdited TEXT NOT NULL,
    utcDateLastEdited TEXT NOT NULL,
    utcDateCreated TEXT NOT NULL,
    utcDateModified TEXT NOT NULL,
    isProtected INTEGER NOT NULL DEFAULT 0
);
```

## Revision Policies

### Creation Triggers

#### Automatic Snapshots
Default policy creates revisions:
- After 5 minutes of editing
- When switching to different note
- Before major operations (delete, move)

#### Content-Based Triggers
Revisions created when:
- Content size changes > 20%
- Structural changes in formatted text
- File attachments modified

### Retention Policies

#### Default Retention
- **Recent revisions (< 1 day):** Keep all
- **Daily revisions (1-7 days):** Keep one per day
- **Weekly revisions (7-30 days):** Keep one per week
- **Monthly revisions (> 30 days):** Keep one per month

#### Custom Policies
Configure via attributes:
```javascript
// Keep all revisions
#revisionRetention=all

// Keep revisions for 90 days
#revisionRetention=90d

// Disable revisions
#disableRevisions
```

## Working with Revisions

### Viewing Revision History

Access revision history through:
1. Note menu → "Revisions"
2. Keyboard shortcut: `Alt+R`
3. API: `note.getRevisions()`

### Comparing Revisions

View differences between versions:
```javascript
const revisions = note.getRevisions();
const current = note.getContent();
const previous = revisions[0].getContent();

// Generate diff
const diff = api.createDiff(previous, current);
```

### Restoring Revisions

#### Manual Restoration
1. Open revision history
2. Select target revision
3. Click "Restore this version"
4. Confirm replacement

#### API Restoration
```javascript
// Get specific revision
const revision = api.getRevision('revision_id');

// Restore content
note.setContent(revision.getContent());
note.title = revision.title;
note.save();

// Create restoration record
note.setLabel('restoredFrom', revision.revisionId);
note.setLabel('restorationDate', new Date().toISOString());
```

### Creating Manual Snapshots

Force revision creation:
```javascript
// Create immediate snapshot
api.createRevision(note.noteId, {
  title: note.title,
  content: note.getContent(),
  reason: 'Manual snapshot before major edit'
});
```

## Protected Revisions

### Encryption Handling

Protected notes have encrypted revisions:
- Title encrypted separately from content
- Blob content encrypted with note's key
- Requires active protected session to access

### Protection Synchronization

When note protection changes:
```javascript
// Protect all revisions when note becomes protected
if (note.isProtected) {
  for (const revision of note.getRevisions()) {
    revision.protect();
  }
}
```

## Performance Considerations

### Storage Impact

#### Size Calculations
- **Text notes:** ~2KB per revision (compressed)
- **Code notes:** ~5KB per revision (syntax metadata)
- **File notes:** Full file size per revision
- **Image notes:** Deduplicated via blob storage

#### Database Growth
Monitor revision storage:
```sql
-- Check revision storage size
SELECT 
  COUNT(*) as revision_count,
  SUM(LENGTH(content)) / 1048576 as size_mb
FROM revisions;

-- Find notes with most revisions
SELECT 
  noteId, 
  COUNT(*) as revision_count
FROM revisions
GROUP BY noteId
ORDER BY revision_count DESC
LIMIT 10;
```

### Performance Optimization

#### Cleanup Strategies

1. **Automatic Cleanup**
```javascript
// Configure in options
api.setOption('revisionCleanupDays', 90);
api.setOption('revisionCleanupEnabled', true);
```

2. **Manual Cleanup**
```javascript
// Delete old revisions
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - 90);

for (const note of api.getAllNotes()) {
  const revisions = note.getRevisions();
  for (const revision of revisions) {
    if (revision.dateCreated < cutoffDate) {
      revision.delete();
    }
  }
}
```

3. **Selective Retention**
```javascript
// Keep only milestone revisions
note.getRevisions().forEach((revision, index) => {
  // Keep every 10th revision
  if (index % 10 !== 0) {
    revision.delete();
  }
});
```

## Advanced Features

### Revision Comparison

Generate detailed comparisons:
```javascript
function compareRevisions(revisionA, revisionB) {
  return {
    titleChanged: revisionA.title !== revisionB.title,
    contentDiff: api.diffContent(
      revisionA.getContent(), 
      revisionB.getContent()
    ),
    sizeChange: revisionB.contentLength - revisionA.contentLength,
    timeElapsed: revisionB.utcDateCreated - revisionA.utcDateCreated
  };
}
```

### Revision Analytics

Track editing patterns:
```javascript
function analyzeRevisionHistory(noteId) {
  const revisions = api.getNote(noteId).getRevisions();
  
  return {
    totalRevisions: revisions.length,
    averageSize: revisions.reduce((sum, r) => sum + r.contentLength, 0) / revisions.length,
    editFrequency: calculateEditFrequency(revisions),
    majorChanges: findMajorChanges(revisions)
  };
}
```

### Batch Operations

Process multiple revisions:
```javascript
// Export all revisions for backup
async function exportRevisionHistory(noteId, outputDir) {
  const note = api.getNote(noteId);
  const revisions = note.getRevisions();
  
  for (const revision of revisions) {
    const filename = `${noteId}_${revision.revisionId}_${revision.dateCreated}.json`;
    const data = {
      revisionId: revision.revisionId,
      title: revision.title,
      content: revision.getContent(),
      metadata: revision.getMetadata()
    };
    await fs.writeFile(`${outputDir}/${filename}`, JSON.stringify(data));
  }
}
```

## Troubleshooting

### Revisions Not Created
**Symptom:** No revisions appearing for edited notes.

**Solutions:**
- Check if `#disableRevisions` attribute is set
- Verify revision creation interval in options
- Ensure sufficient disk space for storage
- Check database write permissions

### Cannot Access Revision Content
**Symptom:** Revision list visible but content unavailable.

**Solutions:**
- For protected notes, unlock protected session
- Verify blob storage integrity
- Check database consistency
- Rebuild revision index if corrupted

### Excessive Storage Usage
**Symptom:** Database size growing rapidly due to revisions.

**Solutions:**
- Implement aggressive cleanup policy
- Exclude binary notes from revision tracking
- Use compression for text content
- Archive old revisions externally

### Revision Restoration Fails
**Symptom:** Cannot restore previous version of note.

**Solutions:**
- Verify note isn't read-only
- Check for conflicting sync operations
- Ensure revision content isn't corrupted
- Try restoration via direct database update

## Best Practices

1. **Configure Appropriate Policies**
   - Set retention based on note importance
   - Disable revisions for temporary notes
   - Use manual snapshots for milestones

2. **Monitor Storage Usage**
   - Regular cleanup of old revisions
   - Archive important revisions externally
   - Monitor database growth trends

3. **Leverage for Workflows**
   - Create snapshots before major edits
   - Use revisions for collaborative editing
   - Track changes for audit purposes

4. **Optimize Performance**
   - Limit revision creation frequency
   - Exclude large binary files
   - Implement tiered retention policies

5. **Backup Considerations**
   - Include revisions in backup strategy
   - Export critical revision history
   - Test restoration procedures

## Related Topics

- [Note Protection](../Security/Note-Protection.md)
- [Database Maintenance](../Maintenance/Database.md)
- [Sync and Conflicts](../Sync/Conflict-Resolution.md)
- [Storage Management](../Maintenance/Storage.md)