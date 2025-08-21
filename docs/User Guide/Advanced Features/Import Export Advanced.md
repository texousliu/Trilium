# Import/Export Advanced Features

Master advanced import and export capabilities including format-specific options, metadata preservation, and large-scale data operations.

## Prerequisites

- Understanding of basic import/export operations
- Familiarity with different note types
- Knowledge of Trilium's data structure

## Export Advanced Features

### Format-Specific Options

#### HTML Export

Advanced HTML export with customization:

```javascript
// Export configuration
const exportOptions = {
  format: 'html',
  skipHtmlTemplate: false,  // Include full HTML structure
  includeStyles: true,       // Embed CSS
  inlineImages: true,        // Embed images as base64
  preserveLinks: true,       // Maintain internal links
  customRewriteLinks: (originalFn, getTargetUrl) => {
    return (content, noteMeta) => {
      // Custom link transformation
      content = originalFn(content, noteMeta);
      
      // Additional processing
      content = content.replace(/\[\[([^\]]+)\]\]/g, (match, noteId) => {
        const url = getTargetUrl(noteId, noteMeta);
        return url ? `<a href="${url}">${noteId}</a>` : match;
      });
      
      return content;
    };
  }
};
```

#### Markdown Export

Enhanced Markdown export:

```javascript
// Configure Markdown export
const markdownOptions = {
  format: 'markdown',
  frontmatter: true,          // Include YAML frontmatter
  preserveFormatting: true,   // Keep rich text formatting
  imageHandling: 'reference', // inline|reference|external
  codeBlockLanguages: true,   // Include language hints
  tableOfContents: true,      // Generate TOC
  footnotesStyle: 'github'    // github|pandoc|multimarkdown
};

// Custom Markdown processor
function processMarkdownExport(content, metadata) {
  // Add frontmatter
  const frontmatter = `---
title: ${metadata.title}
created: ${metadata.dateCreated}
modified: ${metadata.dateModified}
tags: ${metadata.labels.join(', ')}
---\n\n`;
  
  // Process content
  content = frontmatter + content;
  
  // Convert Trilium-specific syntax
  content = content.replace(/#([a-zA-Z0-9_]+)/g, '`$1`');
  
  return content;
}
```

#### ZIP Export

Advanced ZIP archive export:

```javascript
async function advancedZipExport(branch, options = {}) {
  const exportConfig = {
    compression: 9,              // Maximum compression
    includeMetadata: true,       // Export attributes
    includeRevisions: false,     // Include revision history
    includeAttachments: true,    // Include file attachments
    preserveHierarchy: true,     // Maintain folder structure
    fileNaming: 'title-id',      // title|id|title-id
    maxFileNameLength: 100,      // Truncate long names
    sanitizeFileNames: true      // Remove special characters
  };
  
  // Custom file naming
  function getFileName(note, existingNames) {
    let name = note.title;
    
    // Sanitize
    name = name.replace(/[<>:"/\\|?*]/g, '_');
    
    // Handle duplicates
    if (existingNames.has(name)) {
      name = `${name}_${note.noteId.substr(0, 8)}`;
    }
    
    // Add extension
    const extension = getExtensionForMime(note.mime);
    return `${name}.${extension}`;
  }
  
  return await exportToZip(branch, exportConfig);
}
```

### Metadata Preservation

#### Complete Metadata Export

Export notes with full metadata:

```javascript
class MetadataExporter {
  exportWithMetadata(noteId) {
    const note = api.getNote(noteId);
    
    return {
      note: {
        noteId: note.noteId,
        title: note.title,
        type: note.type,
        mime: note.mime,
        content: note.getContent(),
        dateCreated: note.dateCreated,
        dateModified: note.dateModified,
        utcDateCreated: note.utcDateCreated,
        utcDateModified: note.utcDateModified
      },
      attributes: this.exportAttributes(note),
      relations: this.exportRelations(note),
      attachments: this.exportAttachments(note),
      revisions: this.exportRevisions(note),
      branches: this.exportBranches(note)
    };
  }
  
  exportAttributes(note) {
    return note.getAttributes().map(attr => ({
      type: attr.type,
      name: attr.name,
      value: attr.value,
      position: attr.position,
      isInheritable: attr.isInheritable
    }));
  }
  
  exportRelations(note) {
    return note.getRelations().map(rel => ({
      name: rel.name,
      targetNoteId: rel.value,
      position: rel.position,
      isInheritable: rel.isInheritable
    }));
  }
  
  exportAttachments(note) {
    return note.getAttachments().map(att => ({
      attachmentId: att.attachmentId,
      title: att.title,
      mime: att.mime,
      content: att.getContent(),
      position: att.position
    }));
  }
  
  exportRevisions(note) {
    return note.getRevisions().map(rev => ({
      revisionId: rev.revisionId,
      title: rev.title,
      content: rev.getContent(),
      dateLastEdited: rev.dateLastEdited
    }));
  }
  
  exportBranches(note) {
    return note.getBranches().map(branch => ({
      branchId: branch.branchId,
      parentNoteId: branch.parentNoteId,
      notePosition: branch.notePosition,
      prefix: branch.prefix,
      isExpanded: branch.isExpanded
    }));
  }
}
```

### Large Export Handling

#### Streaming Export

Handle large exports efficiently:

```javascript
class StreamingExporter {
  async exportLargeTree(rootNoteId, outputStream) {
    const processedNotes = new Set();
    const queue = [rootNoteId];
    
    // Write header
    outputStream.write('<?xml version="1.0" encoding="UTF-8"?>\n');
    outputStream.write('<trilium-export version="1.0">\n');
    
    while (queue.length > 0) {
      const noteId = queue.shift();
      
      if (processedNotes.has(noteId)) continue;
      processedNotes.add(noteId);
      
      // Process note
      const note = await this.loadNoteChunk(noteId);
      await this.writeNoteXml(outputStream, note);
      
      // Add children to queue
      const children = await this.getChildNoteIds(noteId);
      queue.push(...children);
      
      // Yield control periodically
      if (processedNotes.size % 100 === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    outputStream.write('</trilium-export>\n');
    outputStream.end();
  }
  
  async loadNoteChunk(noteId) {
    // Load note data in chunks to avoid memory issues
    const note = api.getNote(noteId);
    const content = await this.loadContentChunked(note);
    
    return {
      ...note.getPojo(),
      content
    };
  }
  
  async loadContentChunked(note, chunkSize = 1024 * 1024) {
    if (note.hasStringContent()) {
      return note.getContent();
    }
    
    // For binary content, stream in chunks
    const chunks = [];
    const stream = note.getContentStream();
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  }
}
```

## Import Advanced Features

### Format Detection

Automatically detect and handle import formats:

```javascript
class FormatDetector {
  detectFormat(file) {
    const extension = path.extname(file.name).toLowerCase();
    const mimeType = file.type;
    const header = this.readFileHeader(file);
    
    // Extension-based detection
    const extensionMap = {
      '.enex': 'evernote',
      '.opml': 'opml',
      '.mm': 'freemind',
      '.md': 'markdown',
      '.html': 'html',
      '.zip': this.detectZipFormat(file)
    };
    
    if (extensionMap[extension]) {
      return extensionMap[extension];
    }
    
    // Content-based detection
    if (header.includes('<?xml')) {
      if (header.includes('<en-export')) return 'evernote';
      if (header.includes('<opml')) return 'opml';
      if (header.includes('<map')) return 'freemind';
    }
    
    // MIME type fallback
    const mimeMap = {
      'application/x-evernote': 'evernote',
      'text/markdown': 'markdown',
      'text/html': 'html'
    };
    
    return mimeMap[mimeType] || 'unknown';
  }
  
  detectZipFormat(file) {
    // Examine ZIP contents to determine format
    const entries = this.getZipEntries(file);
    
    if (entries.some(e => e.endsWith('meta.json'))) {
      return 'trilium';
    }
    
    if (entries.some(e => e.endsWith('.enex'))) {
      return 'evernote-archive';
    }
    
    return 'generic-zip';
  }
}
```

### Transformation Patterns

#### Content Transformation

Transform content during import:

```javascript
class ContentTransformer {
  constructor(options = {}) {
    this.options = {
      convertMarkdown: true,
      sanitizeHtml: true,
      preserveFormatting: true,
      convertLinks: true,
      ...options
    };
  }
  
  async transformContent(content, sourceFormat, targetFormat) {
    let transformed = content;
    
    // Format conversion pipeline
    if (sourceFormat === 'markdown' && targetFormat === 'html') {
      transformed = await this.markdownToHtml(transformed);
    }
    
    if (this.options.sanitizeHtml) {
      transformed = this.sanitizeHtml(transformed);
    }
    
    if (this.options.convertLinks) {
      transformed = this.convertLinks(transformed);
    }
    
    // Custom transformations
    for (const transformer of this.options.customTransformers || []) {
      transformed = await transformer(transformed);
    }
    
    return transformed;
  }
  
  markdownToHtml(markdown) {
    // Convert with extensions
    const converter = new MarkdownConverter({
      tables: true,
      footnotes: true,
      syntaxHighlight: true,
      math: true
    });
    
    return converter.convert(markdown);
  }
  
  sanitizeHtml(html) {
    const allowedTags = [
      'p', 'br', 'strong', 'em', 'u', 's', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'td', 'th'
    ];
    
    return sanitizeHtml(html, {
      allowedTags,
      allowedAttributes: {
        'a': ['href', 'title'],
        'img': ['src', 'alt', 'width', 'height']
      }
    });
  }
  
  convertLinks(content) {
    // Convert various link formats to Trilium format
    
    // Wiki-style links
    content = content.replace(/\[\[([^\]]+)\]\]/g, (match, link) => {
      const noteId = this.resolveNoteId(link);
      return noteId ? `<a href="#${noteId}">${link}</a>` : match;
    });
    
    // Obsidian-style links
    content = content.replace(/!\[\[([^\]]+)\]\]/g, (match, link) => {
      const noteId = this.resolveNoteId(link);
      return noteId ? `<img src="api/images/${noteId}/download">` : match;
    });
    
    return content;
  }
}
```

### Migration Strategies

#### Incremental Migration

Import large datasets incrementally:

```javascript
class IncrementalImporter {
  constructor(sourceDir, options = {}) {
    this.sourceDir = sourceDir;
    this.options = {
      batchSize: 100,
      pauseBetweenBatches: 1000,
      preserveIds: false,
      mapFile: 'import-mapping.json',
      ...options
    };
    this.mapping = new Map();
    this.loadMapping();
  }
  
  async importAll(parentNoteId) {
    const files = await this.getSourceFiles();
    const batches = this.createBatches(files);
    
    for (const [index, batch] of batches.entries()) {
      console.log(`Processing batch ${index + 1}/${batches.length}`);
      
      await this.importBatch(batch, parentNoteId);
      
      // Save mapping after each batch
      this.saveMapping();
      
      // Pause between batches
      if (index < batches.length - 1) {
        await this.pause(this.options.pauseBetweenBatches);
      }
    }
    
    return {
      totalImported: this.mapping.size,
      mapping: Object.fromEntries(this.mapping)
    };
  }
  
  async importBatch(files, parentNoteId) {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await this.importFile(file, parentNoteId);
        results.push(result);
        
        // Update mapping
        this.mapping.set(file.id, result.noteId);
        
      } catch (error) {
        console.error(`Failed to import ${file.path}:`, error);
        this.mapping.set(file.id, { error: error.message });
      }
    }
    
    return results;
  }
  
  createBatches(items) {
    const batches = [];
    for (let i = 0; i < items.length; i += this.options.batchSize) {
      batches.push(items.slice(i, i + this.options.batchSize));
    }
    return batches;
  }
  
  loadMapping() {
    if (fs.existsSync(this.options.mapFile)) {
      const data = JSON.parse(fs.readFileSync(this.options.mapFile));
      this.mapping = new Map(Object.entries(data));
    }
  }
  
  saveMapping() {
    fs.writeFileSync(
      this.options.mapFile,
      JSON.stringify(Object.fromEntries(this.mapping), null, 2)
    );
  }
}
```

### Special Format Handlers

#### Evernote Import (ENEX)

Advanced ENEX import with full feature support:

```javascript
class EnexImporter {
  async importEnex(enexFile, parentNoteId) {
    const parser = new EnexParser();
    const notes = await parser.parse(enexFile);
    
    const importResults = [];
    
    for (const enNote of notes) {
      const triliumNote = await this.convertNote(enNote);
      const result = await this.createNote(triliumNote, parentNoteId);
      
      // Handle resources (attachments)
      for (const resource of enNote.resources || []) {
        await this.importResource(resource, result.noteId);
      }
      
      // Preserve tags
      for (const tag of enNote.tags || []) {
        await this.createTag(tag, result.noteId);
      }
      
      // Maintain dates
      if (enNote.created) {
        result.note.dateCreated = enNote.created;
      }
      
      importResults.push(result);
    }
    
    return importResults;
  }
  
  async convertNote(enNote) {
    return {
      title: enNote.title,
      content: await this.convertEnmlToHtml(enNote.content),
      type: 'text',
      mime: 'text/html',
      attributes: this.extractAttributes(enNote)
    };
  }
  
  async convertEnmlToHtml(enml) {
    let html = enml;
    
    // Convert ENML to HTML
    html = html.replace(/<en-note[^>]*>/g, '<div>');
    html = html.replace(/<\/en-note>/g, '</div>');
    
    // Handle media
    html = html.replace(/<en-media([^>]*)>/g, (match, attrs) => {
      const hash = this.extractHash(attrs);
      return `<img src="attachment:${hash}">`;
    });
    
    // Handle to-dos
    html = html.replace(/<en-todo([^>]*)\/>/g, (match, attrs) => {
      const checked = attrs.includes('checked="true"');
      return `<input type="checkbox" ${checked ? 'checked' : ''}>`;
    });
    
    return html;
  }
}
```

#### OPML Import

Import hierarchical OPML outlines:

```javascript
class OpmlImporter {
  async importOpml(opmlFile, parentNoteId) {
    const parser = new OpmlParser();
    const outline = await parser.parse(opmlFile);
    
    return this.importOutline(outline.body, parentNoteId);
  }
  
  async importOutline(outline, parentNoteId) {
    const note = await api.createNote({
      parentNoteId,
      title: outline.text || 'Untitled',
      content: outline.notes || '',
      type: 'text'
    });
    
    // Import attributes from OPML
    if (outline.attributes) {
      for (const [key, value] of Object.entries(outline.attributes)) {
        note.setLabel(key, value);
      }
    }
    
    // Import children recursively
    if (outline.children) {
      for (const child of outline.children) {
        await this.importOutline(child, note.noteId);
      }
    }
    
    return note;
  }
}
```

## Performance Optimization

### Batch Processing

Optimize large import/export operations:

```javascript
class BatchProcessor {
  async processBatch(items, processor, options = {}) {
    const {
      batchSize = 50,
      parallel = false,
      onProgress = () => {}
    } = options;
    
    let processed = 0;
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      let batchResults;
      if (parallel) {
        batchResults = await Promise.all(
          batch.map(item => processor(item))
        );
      } else {
        batchResults = [];
        for (const item of batch) {
          batchResults.push(await processor(item));
        }
      }
      
      results.push(...batchResults);
      processed += batch.length;
      
      onProgress({
        processed,
        total: items.length,
        percentage: (processed / items.length) * 100
      });
    }
    
    return results;
  }
}
```

### Memory Management

Handle large files without memory issues:

```javascript
class MemoryEfficientProcessor {
  async processLargeFile(filePath, processor) {
    const stream = fs.createReadStream(filePath, {
      highWaterMark: 16 * 1024 // 16KB chunks
    });
    
    const lineReader = readline.createInterface({
      input: stream,
      crlfDelay: Infinity
    });
    
    let buffer = [];
    const bufferSize = 100;
    
    for await (const line of lineReader) {
      buffer.push(line);
      
      if (buffer.length >= bufferSize) {
        await processor(buffer);
        buffer = [];
      }
    }
    
    // Process remaining items
    if (buffer.length > 0) {
      await processor(buffer);
    }
  }
}
```

## Troubleshooting

### Import Failures
**Symptom:** Import process fails or hangs.

**Solutions:**
- Check file format compatibility
- Verify file isn't corrupted
- Reduce batch size for large imports
- Check available disk space
- Review error logs for specific issues

### Data Loss During Export
**Symptom:** Some data missing in exported files.

**Solutions:**
- Verify export options include all data types
- Check for unsupported content types
- Ensure proper permissions for all notes
- Review export logs for skipped items

### Format Conversion Issues
**Symptom:** Content appears broken after import.

**Solutions:**
- Verify source format detection
- Check character encoding
- Review transformation rules
- Test with smaller sample first

## Best Practices

1. **Always Create Backups**
   - Backup before large imports
   - Test imports on copy first
   - Keep original files

2. **Validate Data Integrity**
   - Verify import completeness
   - Check content preservation
   - Validate relationships

3. **Optimize for Performance**
   - Use appropriate batch sizes
   - Enable compression for exports
   - Stream large files

4. **Document Migrations**
   - Keep import/export logs
   - Document mapping rules
   - Track transformation decisions

5. **Test Thoroughly**
   - Test with sample data first
   - Verify all content types
   - Check edge cases

## Related Topics

- [Basic Import/Export](../Import-Export.md)
- [Database Backup](../Maintenance/Backup.md)
- [Data Migration](../Migration.md)
- [File Attachments](../Attachments.md)