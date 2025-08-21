# Collections Advanced Features

Master advanced collection features including dynamic queries, custom views, and complex data visualization.

## Prerequisites

- Understanding of search queries
- Familiarity with basic collection types
- Knowledge of note attributes

## Dynamic Collections

### Query-Based Collections

Collections that automatically update based on search queries:

```javascript
// Create dynamic task collection
const taskCollection = api.createNote({
  parentNoteId: 'projects',
  title: 'Active Tasks',
  type: 'search',
  content: JSON.stringify({
    searchString: '#task #status!=completed',
    orderBy: 'priority DESC, dueDate ASC',
    limit: 50
  })
});

// Add collection configuration
taskCollection.setLabel('searchString', '#task #status!=completed');
taskCollection.setLabel('refreshInterval', '300'); // Refresh every 5 minutes
taskCollection.setLabel('viewType', 'board'); // Display as board
```

### Auto-Updating Collections

Configure collections to refresh automatically:

```javascript
class DynamicCollection {
  constructor(noteId, query, refreshInterval = 60000) {
    this.noteId = noteId;
    this.query = query;
    this.refreshInterval = refreshInterval;
    this.cache = new Map();
    
    this.startAutoRefresh();
  }
  
  startAutoRefresh() {
    this.refresh();
    setInterval(() => this.refresh(), this.refreshInterval);
  }
  
  async refresh() {
    const results = await api.searchForNotes(this.query);
    const note = api.getNote(this.noteId);
    
    // Update collection content
    note.setContent(JSON.stringify({
      query: this.query,
      results: results.map(r => r.noteId),
      lastUpdated: new Date().toISOString(),
      count: results.length
    }));
    
    // Trigger UI update
    api.refreshCollectionWidget(this.noteId);
  }
  
  // Advanced filtering
  applyFilters(filters) {
    let filteredQuery = this.query;
    
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        filteredQuery += ` #${key}=${value}`;
      }
    }
    
    return api.searchForNotes(filteredQuery);
  }
}
```

### Computed Collections

Collections with calculated membership:

```javascript
// Collection that groups notes by calculated criteria
class ComputedCollection {
  constructor(computeFn) {
    this.computeFn = computeFn;
    this.groups = new Map();
  }
  
  async compute() {
    const allNotes = await api.getAllNotes();
    this.groups.clear();
    
    for (const note of allNotes) {
      const groupKey = await this.computeFn(note);
      
      if (groupKey) {
        if (!this.groups.has(groupKey)) {
          this.groups.set(groupKey, []);
        }
        this.groups.get(groupKey).push(note);
      }
    }
    
    return this.groups;
  }
  
  async createCollectionNotes(parentNoteId) {
    const groups = await this.compute();
    
    for (const [groupName, notes] of groups) {
      const collectionNote = await api.createNote({
        parentNoteId,
        title: groupName,
        type: 'render',
        content: this.renderGroup(groupName, notes)
      });
      
      // Link to members
      for (const note of notes) {
        collectionNote.addRelation('includes', note.noteId);
      }
    }
  }
  
  renderGroup(name, notes) {
    return `
      <h2>${name}</h2>
      <div class="collection-grid">
        ${notes.map(n => `
          <div class="collection-item">
            <a href="#${n.noteId}">${n.title}</a>
            <span class="meta">${n.dateCreated}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
}

// Usage: Group by month created
const monthlyCollection = new ComputedCollection(note => {
  const date = new Date(note.dateCreated);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
});
```

## Board View Customization

### Advanced Board Configuration

Create sophisticated Kanban boards:

```javascript
class KanbanBoard {
  constructor(noteId, config) {
    this.noteId = noteId;
    this.config = {
      columns: [],
      swimlanes: null,
      cardTemplate: null,
      filters: {},
      sorting: 'position',
      ...config
    };
  }
  
  async setupBoard() {
    const note = api.getNote(this.noteId);
    
    // Define columns
    note.setLabel('boardColumns', JSON.stringify([
      { id: 'todo', title: 'To Do', query: '#status=todo', limit: 10 },
      { id: 'progress', title: 'In Progress', query: '#status=progress', limit: 5 },
      { id: 'review', title: 'Review', query: '#status=review', limit: 5 },
      { id: 'done', title: 'Done', query: '#status=done', limit: 20 }
    ]));
    
    // Configure card display
    note.setLabel('cardTemplate', `
      <div class="kanban-card">
        <h4>{title}</h4>
        <div class="priority-{priority}">{priority}</div>
        <div class="assignee">{assignee}</div>
        <div class="due-date">{dueDate}</div>
        <div class="tags">{tags}</div>
      </div>
    `);
    
    // Add WIP limits
    note.setLabel('wipLimits', JSON.stringify({
      'progress': 5,
      'review': 3
    }));
    
    // Enable drag-drop
    note.setLabel('enableDragDrop', 'true');
    note.setLabel('onCardMove', 'updateCardStatus');
  }
  
  async moveCard(cardId, fromColumn, toColumn) {
    const card = api.getNote(cardId);
    
    // Update status
    card.setLabel('status', toColumn);
    
    // Log transition
    card.addLabel('transition', `${fromColumn}->${toColumn}`, false);
    card.setLabel('lastMoved', new Date().toISOString());
    
    // Check WIP limits
    const wipLimits = JSON.parse(api.getNote(this.noteId).getLabelValue('wipLimits'));
    if (wipLimits[toColumn]) {
      const columnCards = await api.searchForNotes(`#status=${toColumn}`);
      if (columnCards.length > wipLimits[toColumn]) {
        throw new Error(`WIP limit exceeded for ${toColumn}`);
      }
    }
    
    // Trigger automations
    await this.triggerColumnAutomations(cardId, toColumn);
  }
  
  async triggerColumnAutomations(cardId, column) {
    const automations = {
      'done': async (card) => {
        card.setLabel('completedDate', new Date().toISOString());
        card.setLabel('archived', 'false');
      },
      'review': async (card) => {
        // Notify reviewers
        const reviewers = card.getRelationTargets('reviewer');
        for (const reviewer of reviewers) {
          await this.notifyReviewer(reviewer, card);
        }
      }
    };
    
    if (automations[column]) {
      await automations[column](api.getNote(cardId));
    }
  }
}
```

### Swimlanes Implementation

Add horizontal grouping to boards:

```javascript
class SwimlaneBoard {
  constructor(boardNoteId) {
    this.boardNoteId = boardNoteId;
  }
  
  async configureSwimlanes(groupBy) {
    const note = api.getNote(this.boardNoteId);
    
    // Configure swimlane grouping
    note.setLabel('swimlaneGroupBy', groupBy);
    
    // Define swimlane queries
    const swimlanes = await this.generateSwimlanes(groupBy);
    note.setLabel('swimlanes', JSON.stringify(swimlanes));
  }
  
  async generateSwimlanes(groupBy) {
    switch (groupBy) {
      case 'priority':
        return [
          { id: 'critical', title: 'Critical', query: '#priority=critical' },
          { id: 'high', title: 'High', query: '#priority=high' },
          { id: 'medium', title: 'Medium', query: '#priority=medium' },
          { id: 'low', title: 'Low', query: '#priority=low' }
        ];
        
      case 'assignee':
        const assignees = await this.getUniqueAssignees();
        return assignees.map(assignee => ({
          id: assignee,
          title: assignee,
          query: `#assignee=${assignee}`
        }));
        
      case 'project':
        const projects = await api.searchForNotes('#type=project');
        return projects.map(project => ({
          id: project.noteId,
          title: project.title,
          query: `~project.noteId=${project.noteId}`
        }));
        
      default:
        return [];
    }
  }
  
  async getUniqueAssignees() {
    const notes = await api.searchForNotes('#assignee');
    const assignees = new Set();
    
    for (const note of notes) {
      const assignee = note.getLabelValue('assignee');
      if (assignee) assignees.add(assignee);
    }
    
    return Array.from(assignees);
  }
}
```

## Calendar Integration

### Advanced Calendar Features

Create sophisticated calendar views:

```javascript
class AdvancedCalendar {
  constructor(noteId, config = {}) {
    this.noteId = noteId;
    this.config = {
      view: 'month', // month|week|day|year
      showWeekends: true,
      firstDay: 1, // Monday
      eventSources: [],
      colorScheme: 'category',
      ...config
    };
  }
  
  async setupCalendar() {
    const note = api.getNote(this.noteId);
    
    // Configure calendar
    note.setLabel('calendarConfig', JSON.stringify(this.config));
    
    // Add event sources
    note.setLabel('eventSources', JSON.stringify([
      { query: '#task #dueDate', color: 'blue', type: 'task' },
      { query: '#meeting #date', color: 'green', type: 'meeting' },
      { query: '#deadline', color: 'red', type: 'deadline' },
      { query: '#milestone', color: 'purple', type: 'milestone' }
    ]));
    
    // Configure event display
    note.setLabel('eventTemplate', `
      <div class="calendar-event {type}">
        <span class="time">{time}</span>
        <span class="title">{title}</span>
        <span class="location">{location}</span>
      </div>
    `);
  }
  
  async getEvents(startDate, endDate) {
    const sources = JSON.parse(
      api.getNote(this.noteId).getLabelValue('eventSources')
    );
    
    const events = [];
    
    for (const source of sources) {
      const notes = await api.searchForNotes(source.query);
      
      for (const note of notes) {
        const event = this.noteToEvent(note, source);
        
        if (event && this.isInRange(event, startDate, endDate)) {
          events.push(event);
        }
      }
    }
    
    return this.sortEvents(events);
  }
  
  noteToEvent(note, source) {
    const dateAttr = this.findDateAttribute(note);
    if (!dateAttr) return null;
    
    return {
      id: note.noteId,
      title: note.title,
      start: dateAttr.value,
      end: note.getLabelValue('endDate') || dateAttr.value,
      allDay: !note.hasLabel('time'),
      color: source.color,
      type: source.type,
      url: `#${note.noteId}`,
      extendedProps: {
        description: note.getContentPreview(100),
        location: note.getLabelValue('location'),
        attendees: note.getRelationTargets('attendee')
      }
    };
  }
  
  findDateAttribute(note) {
    const dateAttrs = ['dueDate', 'date', 'eventDate', 'startDate'];
    
    for (const attrName of dateAttrs) {
      const value = note.getLabelValue(attrName);
      if (value) {
        return { name: attrName, value };
      }
    }
    
    return null;
  }
  
  async createRecurringEvents(pattern, template) {
    const recurrence = new RecurrencePattern(pattern);
    const dates = recurrence.generate(new Date(), 365); // Next year
    
    for (const date of dates) {
      const event = await api.createNote({
        ...template,
        title: `${template.title} - ${date.toLocaleDateString()}`
      });
      
      event.setLabel('date', date.toISOString());
      event.setLabel('recurring', 'true');
      event.setLabel('recurrencePattern', pattern);
    }
  }
}
```

## Geo Map Configuration

### Advanced Map Features

Create location-based collections:

```javascript
class GeoMapCollection {
  constructor(noteId) {
    this.noteId = noteId;
  }
  
  async setupMap() {
    const note = api.getNote(this.noteId);
    
    // Configure map view
    note.setLabel('mapConfig', JSON.stringify({
      center: [40.7128, -74.0060], // New York
      zoom: 10,
      style: 'streets', // streets|satellite|hybrid|terrain
      clustering: true,
      heatmap: false
    }));
    
    // Configure data sources
    note.setLabel('geoDataSources', JSON.stringify([
      { query: '#location #type=office', icon: 'building', color: 'blue' },
      { query: '#location #type=customer', icon: 'user', color: 'green' },
      { query: '#location #type=event', icon: 'calendar', color: 'red' }
    ]));
    
    // Add layers
    note.setLabel('mapLayers', JSON.stringify([
      { type: 'markers', visible: true },
      { type: 'routes', visible: false },
      { type: 'regions', visible: false }
    ]));
  }
  
  async getGeoData() {
    const sources = JSON.parse(
      api.getNote(this.noteId).getLabelValue('geoDataSources')
    );
    
    const features = [];
    
    for (const source of sources) {
      const notes = await api.searchForNotes(source.query);
      
      for (const note of notes) {
        const geoData = this.extractGeoData(note);
        
        if (geoData) {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [geoData.lng, geoData.lat]
            },
            properties: {
              noteId: note.noteId,
              title: note.title,
              description: note.getContentPreview(200),
              icon: source.icon,
              color: source.color,
              ...this.extractProperties(note)
            }
          });
        }
      }
    }
    
    return {
      type: 'FeatureCollection',
      features
    };
  }
  
  extractGeoData(note) {
    // Try different location formats
    const location = note.getLabelValue('location');
    
    if (location) {
      // Coordinates format: "lat,lng"
      const coords = location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      if (coords) {
        return { lat: parseFloat(coords[1]), lng: parseFloat(coords[2]) };
      }
      
      // Address format - would need geocoding service
      return this.geocodeAddress(location);
    }
    
    // Check for separate lat/lng attributes
    const lat = note.getLabelValue('latitude');
    const lng = note.getLabelValue('longitude');
    
    if (lat && lng) {
      return { lat: parseFloat(lat), lng: parseFloat(lng) };
    }
    
    return null;
  }
  
  async createGeoFence(name, coordinates) {
    const fence = await api.createNote({
      parentNoteId: this.noteId,
      title: name,
      type: 'data',
      mime: 'application/json'
    });
    
    fence.setContent(JSON.stringify({
      type: 'Polygon',
      coordinates: [coordinates]
    }));
    
    fence.setLabel('geoFence', 'true');
    
    return fence;
  }
}
```

## Collection Query Optimization

### Query Performance

Optimize collection queries for large datasets:

```javascript
class OptimizedCollectionQuery {
  constructor() {
    this.cache = new Map();
    this.indexes = new Map();
  }
  
  async buildIndexes() {
    // Build attribute indexes
    const attributeIndex = new Map();
    
    const notes = await api.getAllNotes();
    for (const note of notes) {
      for (const attr of note.getAttributes()) {
        const key = `${attr.type}:${attr.name}:${attr.value}`;
        
        if (!attributeIndex.has(key)) {
          attributeIndex.set(key, new Set());
        }
        attributeIndex.get(key).add(note.noteId);
      }
    }
    
    this.indexes.set('attributes', attributeIndex);
  }
  
  async query(searchString, options = {}) {
    const cacheKey = `${searchString}:${JSON.stringify(options)}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
        return cached.results;
      }
    }
    
    // Parse and optimize query
    const optimizedQuery = this.optimizeQuery(searchString);
    
    // Execute query
    const results = await this.executeOptimized(optimizedQuery, options);
    
    // Cache results
    this.cache.set(cacheKey, {
      results,
      timestamp: Date.now()
    });
    
    return results;
  }
  
  optimizeQuery(searchString) {
    // Parse query into AST
    const ast = this.parseQuery(searchString);
    
    // Reorder for optimal execution
    const optimized = this.reorderClauses(ast);
    
    // Identify index usage opportunities
    const indexed = this.identifyIndexes(optimized);
    
    return indexed;
  }
  
  async executeOptimized(query, options) {
    const { limit = 100, offset = 0, orderBy } = options;
    
    // Use indexes where possible
    let candidates = await this.getIndexedCandidates(query);
    
    // Apply additional filters
    candidates = this.applyFilters(candidates, query);
    
    // Sort results
    if (orderBy) {
      candidates = this.sortResults(candidates, orderBy);
    }
    
    // Apply pagination
    return candidates.slice(offset, offset + limit);
  }
}
```

### Incremental Updates

Update collections efficiently:

```javascript
class IncrementalCollectionUpdater {
  constructor(collectionNoteId) {
    this.collectionNoteId = collectionNoteId;
    this.lastUpdate = null;
    this.changeBuffer = [];
  }
  
  async trackChanges() {
    // Subscribe to entity changes
    api.onEntityChange((change) => {
      if (this.affectsCollection(change)) {
        this.changeBuffer.push(change);
        this.scheduleUpdate();
      }
    });
  }
  
  affectsCollection(change) {
    const collection = api.getNote(this.collectionNoteId);
    const query = collection.getLabelValue('searchString');
    
    // Simple check - could be more sophisticated
    return change.entityName === 'notes' || 
           change.entityName === 'attributes';
  }
  
  scheduleUpdate() {
    // Debounce updates
    clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(() => this.applyUpdates(), 500);
  }
  
  async applyUpdates() {
    if (this.changeBuffer.length === 0) return;
    
    const changes = [...this.changeBuffer];
    this.changeBuffer = [];
    
    const collection = api.getNote(this.collectionNoteId);
    const currentMembers = new Set(JSON.parse(collection.getContent()));
    
    for (const change of changes) {
      if (change.action === 'create' || change.action === 'update') {
        // Check if note should be in collection
        const shouldInclude = await this.evaluateMembership(change.entityId);
        
        if (shouldInclude && !currentMembers.has(change.entityId)) {
          currentMembers.add(change.entityId);
        } else if (!shouldInclude && currentMembers.has(change.entityId)) {
          currentMembers.delete(change.entityId);
        }
      } else if (change.action === 'delete') {
        currentMembers.delete(change.entityId);
      }
    }
    
    // Update collection
    collection.setContent(JSON.stringify(Array.from(currentMembers)));
    this.lastUpdate = Date.now();
  }
  
  async evaluateMembership(noteId) {
    const collection = api.getNote(this.collectionNoteId);
    const query = collection.getLabelValue('searchString');
    
    const results = await api.searchForNotes(`${query} #noteId=${noteId}`);
    return results.length > 0;
  }
}
```

## Troubleshooting

### Collection Not Updating
**Symptom:** Dynamic collection shows stale data.

**Solutions:**
- Check refresh interval setting
- Verify search query syntax
- Clear collection cache
- Check for query errors in logs

### Performance Issues
**Symptom:** Collection loads slowly or times out.

**Solutions:**
- Optimize search queries
- Implement pagination
- Use indexed attributes
- Enable query caching

### View Rendering Problems
**Symptom:** Collection view doesn't display correctly.

**Solutions:**
- Verify view configuration
- Check template syntax
- Review browser console for errors
- Test with simpler template

## Best Practices

1. **Optimize Queries**
   - Use indexed attributes
   - Limit result sets
   - Cache frequently used queries

2. **Design for Scale**
   - Implement pagination
   - Use incremental updates
   - Consider data aggregation

3. **Enhance User Experience**
   - Provide loading indicators
   - Implement progressive loading
   - Add filtering and sorting options

4. **Maintain Performance**
   - Monitor query execution time
   - Clean up old cache entries
   - Use appropriate refresh intervals

5. **Document Configuration**
   - Record query patterns
   - Document view customizations
   - Track performance optimizations

## Related Topics

- [Search Documentation](../Search/Search-Documentation.md)
- [Note Types](../Note-Types.md)
- [Widget Development](../../Developer/Widgets.md)
- [Performance Optimization](../../Developer/Performance.md)