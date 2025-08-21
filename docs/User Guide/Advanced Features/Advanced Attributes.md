# Advanced Attributes

Master complex attribute features including inheritance, templates, computed values, and system attributes.

## Prerequisites

- Understanding of basic labels and relations
- Familiarity with note hierarchy
- Knowledge of promoted attributes

## Attribute Inheritance

### Inheritance Mechanism

Attributes marked as inheritable propagate down the note tree to all descendants.

#### Basic Inheritance
```javascript
// Parent note
#workspace #inheritable

// All child notes automatically receive
#workspace (inherited)
```

#### Inheritance Chain
```
Root Note
├── #theme=dark #inheritable
│   └── Child A (inherits #theme=dark)
│       └── Child B (inherits #theme=dark)
│           └── #theme=light (overrides inherited value)
```

### Controlling Inheritance

#### Enable Inheritance
Mark attribute as inheritable:
```javascript
note.setLabel('category', 'project', true); // true = inheritable
```

#### Block Inheritance
Stop inheritance at specific level:
```javascript
// Parent has #inheritable attribute
#workspace #inheritable

// Child blocks inheritance
#workspace #noInherit
```

#### Inheritance Templates
Define inheritable attribute sets:
```javascript
// Template note
#template
#label:status=text #inheritable
#label:priority=number #inheritable
#relation:assignee #inheritable
```

### Advanced Inheritance Patterns

#### Conditional Inheritance
```javascript
// Only inherit if condition met
if (note.hasLabel('acceptInheritance')) {
  note.inheritAttributesFrom(parent);
}
```

#### Selective Inheritance
```javascript
// Inherit only specific attributes
const inheritableAttrs = parent.getAttributes()
  .filter(attr => attr.isInheritable && attr.name.startsWith('project'));
  
inheritableAttrs.forEach(attr => {
  note.setAttribute(attr.type, attr.name, attr.value);
});
```

## Computed Attributes

### Dynamic Attribute Values

Attributes whose values are calculated based on other data.

#### Formula Attributes
```javascript
// Define computed attribute
#formula=noteCount
#formulaCode=`
  const children = note.getChildNotes();
  return children.length;
`
```

#### Aggregation Attributes
```javascript
// Sum values from children
#aggregate=totalHours
#aggregateCode=`
  const children = note.getChildNotes();
  return children
    .map(child => parseInt(child.getLabelValue('hours') || 0))
    .reduce((sum, hours) => sum + hours, 0);
`
```

### Reactive Attributes

Update automatically when dependencies change:

```javascript
// Watch for changes
api.onAttributeChange((note, attr) => {
  if (attr.name === 'status') {
    // Update computed attributes
    updateComputedProgress(note);
  }
});

function updateComputedProgress(note) {
  const children = note.getChildNotes();
  const completed = children.filter(c => c.getLabelValue('status') === 'done').length;
  const total = children.length;
  
  note.setLabel('progress', `${completed}/${total}`);
  note.setLabel('progressPercent', Math.round((completed/total) * 100));
}
```

## System Attributes

### Core System Attributes

#### Note Configuration
- `#disableVersioning` - Disable revision tracking
- `#readOnly` - Make note read-only
- `#hideFromTree` - Hide note in tree view
- `#excludeFromSearch` - Exclude from search results
- `#excludeFromExport` - Skip during export

#### Display Attributes
- `#iconClass` - Custom icon (e.g., `bx bx-star`)
- `#cssClass` - CSS class for styling
- `#color` - Note color in tree
- `#sorted` - Keep children sorted

#### Behavior Attributes
- `#runOnNoteCreation` - Execute script on creation
- `#runOnNoteTitleChange` - Execute on title change
- `#runOnNoteChange` - Execute on any change
- `#runOnChildNoteCreation` - Execute when child created

### Widget Attributes

Control widget behavior and display:

```javascript
// Configure widget visibility
#widget=attributeList
#widgetMode=view // view|edit|both
#widgetPosition=right // left|right|center

// Custom widget configuration
#customWidget=myWidget
#widgetOptions={"columns": 3, "sortBy": "date"}
```

### Script Attributes

Define script execution contexts:

```javascript
// Backend script
#run=backend
#runAtHour=2 // Run at 2 AM daily

// Frontend script
#run=frontend
#runOnEvent=activeNoteChanged

// API endpoint
#customRequestHandler=/api/custom
```

## Attribute Templates

### Defining Templates

Create reusable attribute definitions:

```javascript
// Attribute definition note
#label:status=text
#label:priority=single,low,medium,high,critical
#label:dueDate=date
#relation:assignee=person
#relation:project
```

### Template Application

#### Manual Application
```javascript
const template = api.getNoteWithLabel('attributeTemplate');
const definitions = template.getAttributeDefinitions();

targetNote.applyTemplate(definitions);
```

#### Automatic Application
```javascript
// On note creation
#runOnChildNoteCreation=`
  const template = api.getNoteWithLabel('taskTemplate');
  child.applyTemplate(template);
`
```

### Complex Templates

#### Hierarchical Templates
```javascript
// Project template
{
  attributes: [
    {name: 'projectStatus', type: 'label', value: 'active'},
    {name: 'projectManager', type: 'relation'}
  ],
  childTemplates: {
    'tasks': 'taskTemplate',
    'docs': 'documentTemplate',
    'meetings': 'meetingTemplate'
  }
}
```

#### Conditional Templates
```javascript
function applyConditionalTemplate(note) {
  const noteType = note.type;
  const templates = {
    'text': 'textNoteTemplate',
    'code': 'codeNoteTemplate',
    'task': 'taskNoteTemplate'
  };
  
  const templateId = templates[noteType];
  if (templateId) {
    note.applyTemplate(api.getNote(templateId));
  }
}
```

## Bulk Attribute Operations

### Mass Attribute Updates

#### Add Attributes to Multiple Notes
```javascript
const notes = api.searchForNotes('#needsUpdate');
notes.forEach(note => {
  note.setLabel('lastUpdated', new Date().toISOString());
  note.setLabel('updatedBy', 'bulkOperation');
});
```

#### Remove Attributes in Bulk
```javascript
const notes = api.searchForNotes('#deprecated');
notes.forEach(note => {
  note.removeLabel('deprecated');
  note.removeLabel('oldVersion');
});
```

### Attribute Migration

#### Rename Attributes
```javascript
function migrateAttributes(oldName, newName) {
  const notes = api.searchForNotes(`#${oldName}`);
  
  notes.forEach(note => {
    const value = note.getLabelValue(oldName);
    note.removeLabel(oldName);
    note.setLabel(newName, value);
  });
}
```

#### Transform Attribute Values
```javascript
function transformAttributeValues(attrName, transformer) {
  const notes = api.searchForNotes(`#${attrName}`);
  
  notes.forEach(note => {
    const oldValue = note.getLabelValue(attrName);
    const newValue = transformer(oldValue);
    note.setLabel(attrName, newValue);
  });
}

// Example: Convert dates to ISO format
transformAttributeValues('date', (value) => {
  return new Date(value).toISOString();
});
```

## Advanced Attribute Patterns

### Attribute Chains

Link attributes across notes:

```javascript
// Follow relation chain
function getRelationChain(startNote, relationName, maxDepth = 10) {
  const chain = [];
  let current = startNote;
  let depth = 0;
  
  while (current && depth < maxDepth) {
    const target = current.getRelationTarget(relationName);
    if (!target) break;
    
    chain.push(target);
    current = target;
    depth++;
  }
  
  return chain;
}
```

### Attribute Validation

Ensure attribute integrity:

```javascript
class AttributeValidator {
  constructor(rules) {
    this.rules = rules;
  }
  
  validate(note, attrName, value) {
    const rule = this.rules[attrName];
    if (!rule) return true;
    
    if (rule.type === 'number') {
      return !isNaN(value);
    }
    
    if (rule.pattern) {
      return new RegExp(rule.pattern).test(value);
    }
    
    if (rule.enum) {
      return rule.enum.includes(value);
    }
    
    return true;
  }
}

// Usage
const validator = new AttributeValidator({
  email: {pattern: '^[^@]+@[^@]+\\.[^@]+$'},
  priority: {enum: ['low', 'medium', 'high']},
  score: {type: 'number'}
});
```

### Attribute Indexing

Optimize attribute queries:

```javascript
// Build attribute index
class AttributeIndex {
  constructor() {
    this.index = new Map();
  }
  
  buildIndex(attributeName) {
    const notes = api.searchForNotes(`#${attributeName}`);
    const valueMap = new Map();
    
    notes.forEach(note => {
      const value = note.getLabelValue(attributeName);
      if (!valueMap.has(value)) {
        valueMap.set(value, []);
      }
      valueMap.get(value).push(note.noteId);
    });
    
    this.index.set(attributeName, valueMap);
  }
  
  findByAttributeValue(attributeName, value) {
    const valueMap = this.index.get(attributeName);
    return valueMap ? valueMap.get(value) || [] : [];
  }
}
```

## Performance Optimization

### Efficient Attribute Queries

```javascript
// Batch attribute operations
api.runAsTransaction(() => {
  notes.forEach(note => {
    // Multiple attribute changes in single transaction
    note.setLabel('status', 'processed');
    note.setLabel('processedDate', Date.now());
    note.save();
  });
});
```

### Attribute Caching

```javascript
// Cache frequently accessed attributes
const attributeCache = new Map();

function getCachedAttribute(noteId, attrName) {
  const key = `${noteId}:${attrName}`;
  
  if (!attributeCache.has(key)) {
    const note = api.getNote(noteId);
    const value = note.getLabelValue(attrName);
    attributeCache.set(key, value);
  }
  
  return attributeCache.get(key);
}
```

## Troubleshooting

### Inheritance Not Working
**Symptom:** Child notes not receiving inheritable attributes.

**Solutions:**
- Verify attribute is marked as inheritable
- Check for #noInherit blockers
- Ensure note hierarchy is correct
- Clear attribute cache

### Computed Attributes Not Updating
**Symptom:** Formula attributes showing stale values.

**Solutions:**
- Check formula syntax for errors
- Verify dependencies are tracked
- Manually trigger recalculation
- Review event handlers

### Attribute Conflicts
**Symptom:** Multiple inheritance sources causing conflicts.

**Solutions:**
- Define clear inheritance priorities
- Use explicit overrides
- Implement conflict resolution logic
- Document inheritance hierarchy

## Best Practices

1. **Design Inheritance Hierarchy**
   - Plan attribute inheritance paths
   - Use templates for consistency
   - Document inheritance rules

2. **Optimize Attribute Access**
   - Cache frequently used attributes
   - Batch attribute operations
   - Use indexes for large datasets

3. **Validate Attribute Data**
   - Implement validation rules
   - Use type checking
   - Handle edge cases

4. **Monitor Performance**
   - Profile attribute queries
   - Track inheritance depth
   - Optimize complex formulas

5. **Maintain Documentation**
   - Document custom attributes
   - Record validation rules
   - Track attribute dependencies

## Related Topics

- [Basic Attributes](../Attributes/Labels-and-Relations.md)
- [Promoted Attributes](../Attributes/Promoted-Attributes.md)
- [Template System](../Templates.md)
- [Script API](../../Script-API/Attributes.md)