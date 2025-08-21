# AI Features and Usage

This guide provides comprehensive documentation of Trilium's AI features and how to use them effectively.

## Overview

Trilium's AI integration consists of three main components:

1. **Chat Interface** - Natural language conversations with your knowledge base
2. **Embedding System** - Semantic search and content understanding
3. **Tool System** - Automated actions and information retrieval

## Chat Interface

### Accessing the Chat

1. **Launch Bar Method**
   - Click the **"Chat with Notes"** button in the launch bar
   - If not visible, add it from Settings → Launch Bar

2. **Keyboard Shortcut**
   - Use `Ctrl+Shift+A` (default) to open chat dialog

3. **Context Menu**
   - Right-click on any note and select "Chat about this note"

### Chat Features

#### Basic Conversation
```
You: What are my notes about project management?
AI: I found several notes about project management in your knowledge base:

1. "Agile Methodology" - Discusses sprint planning and team coordination
2. "Project Planning Template" - Contains a framework for project initiation
3. "Meeting Notes: PM Discussion" - Recent conversations about project challenges

Would you like me to summarize any specific note or help you with a particular aspect?
```

#### Context-Aware Responses
The AI automatically includes relevant notes as context:
- Searches your knowledge base for related content
- Provides citations with note titles
- Maintains conversation history

#### Streaming Responses
- Real-time response generation
- See answers as they're being written
- Cancel long responses if needed

#### Tool Integration
The AI can automatically use tools during conversation:
```
You: Create a note about today's meeting with John
AI: I'll create a note about your meeting with John.

[Tool: create_note]
Creating note "Meeting with John - [Today's Date]"...

I've created a new note titled "Meeting with John - 2024-01-15" under your "Meetings" folder. 
Would you like me to add any specific content or agenda items to it?
```

## Embedding System

### What are Embeddings?

Embeddings are mathematical representations of your note content that enable:
- Semantic similarity matching
- Content-based search
- Intelligent context retrieval
- Related note discovery

### How Embeddings Work

1. **Generation**
   - Each note's content is processed by an embedding model
   - Creates a high-dimensional vector representation
   - Stored locally in your Trilium database

2. **Usage**
   - Search queries are converted to embeddings
   - Mathematical similarity calculations find relevant notes
   - Results ranked by semantic relevance

### Embedding Management

#### Viewing Statistics
Monitor embedding progress in Settings → AI/LLM:
```
Embedding Statistics:
Total Notes: 1,247
Notes with Embeddings: 1,240
Pending: 7
Last Update: 2024-01-15 14:30:00
```

#### Regenerating Embeddings
When to regenerate:
- Changing embedding providers or models
- After importing large amounts of content
- If search results seem inaccurate

Steps:
1. Go to Settings → AI/LLM
2. Scroll to bottom
3. Click "Recreate All Embeddings"
4. Monitor progress in statistics

#### Embedding Exclusion
Exclude notes from embedding generation:
- Add attribute `#aiExclude` to notes
- Useful for:
  - Temporary notes
  - Private information
  - System/template notes

## Tool System

### Available Tools

#### 1. Search Tools

##### `search_notes` - Semantic Search
**Purpose**: Find notes using semantic similarity
**Usage**: Automatic when asking questions about your notes

```
You: Find notes about machine learning algorithms
AI: [Uses search_notes tool]
```

**Parameters**:
- `query` (required): Search terms
- `parentNoteId` (optional): Limit to specific note branch
- `maxResults` (optional): Number of results (default: 5)
- `summarize` (optional): Include content summaries

##### `keyword_search` - Text-based Search
**Purpose**: Find notes containing specific keywords
**Usage**: When you need exact text matches

```
You: Find notes containing "API documentation"
AI: [Uses keyword_search tool]
```

##### `attribute_search` - Attribute-based Search
**Purpose**: Search by note attributes (tags, relations)
**Usage**: Finding notes with specific metadata

```
You: Show me all notes tagged with #important
AI: [Uses attribute_search tool]
```

#### 2. Note Management Tools

##### `read_note` - Read Note Content
**Purpose**: Access specific note content
**Usage**: Automatic when you reference specific notes

```
You: What's in my "Project Plan" note?
AI: [Uses read_note tool to access content]
```

##### `create_note` - Create New Notes
**Purpose**: Create notes with content and attributes
**Usage**: When you ask AI to create documentation

```
You: Create a note about today's brainstorming session
AI: [Uses create_note tool]
```

**Parameters**:
- `title` (required): Note title
- `content` (optional): Note content
- `type` (optional): Note type (text, code, etc.)
- `parentNoteId` (optional): Parent location
- `attributes` (optional): Tags, relations, etc.

**Example Creation**:
```json
{
  "title": "Meeting Notes - Q1 Planning",
  "content": "# Q1 Planning Meeting\n\n## Attendees\n- John Doe\n- Jane Smith\n\n## Agenda\n1. Budget review\n2. Project timeline\n3. Resource allocation",
  "type": "text",
  "attributes": [
    {"name": "#meeting"},
    {"name": "#q1-2024"},
    {"name": "priority", "value": "high"}
  ]
}
```

##### `note_update` - Update Existing Notes
**Purpose**: Modify note content, title, or attributes
**Usage**: When you want to update existing information

```
You: Update my "Todo List" note to add "Review quarterly report"
AI: [Uses note_update tool]
```

#### 3. Organization Tools

##### `manage_attributes` - Attribute Management
**Purpose**: Add, remove, or modify note attributes
**Usage**: Organizing and tagging notes

**Operations**:
- Add tags: `#project`, `#important`
- Add relations: `relates-to`, `depends-on`
- Set values: `priority=high`, `status=completed`

##### `manage_relationships` - Relationship Management
**Purpose**: Create connections between notes
**Usage**: Building knowledge networks

**Relationship Types**:
- `relates-to`: General relationship
- `depends-on`: Dependency relationship
- `part-of`: Hierarchical relationship
- Custom: Define your own relationships

#### 4. Analysis Tools

##### `extract_content` - Content Extraction
**Purpose**: Extract specific information from notes
**Usage**: Analyzing note content for specific data

```
You: Extract all action items from my meeting notes
AI: [Uses extract_content tool]
```

##### `note_summarization` - Note Summarization
**Purpose**: Generate summaries of note content
**Usage**: Getting overviews of long notes

```
You: Summarize my "Annual Report 2023" note
AI: [Uses note_summarization tool]
```

#### 5. Calendar Integration

##### `calendar_integration` - Date and Calendar Operations
**Purpose**: Work with date-based notes and calendar functionality
**Usage**: Managing daily notes and date-related content

**Operations**:
- Find date notes: "Show me yesterday's notes"
- Create date notes: "Create a note for tomorrow"
- Get daily note: "What's in today's daily note?"

### Tool Execution Examples

#### Example 1: Research and Note Creation
```
You: Research project management methodologies and create a comprehensive note

AI: I'll research project management methodologies in your notes and create a comprehensive summary.

[Tool: search_notes]
Searching for: "project management methodologies"

Found relevant notes:
- "Agile vs Waterfall Comparison"
- "Scrum Implementation Guide"
- "Kanban Workflow Setup"

[Tool: read_note] (executed for each note)

[Tool: create_note]
Creating: "Project Management Methodologies - Comprehensive Guide"

I've created a comprehensive note that consolidates information from your existing notes about:
- Agile methodology and principles
- Waterfall approach and use cases
- Scrum framework implementation
- Kanban workflow management
- Comparative analysis and recommendations

The note includes references to your original sources and practical implementation guidance.
```

#### Example 2: Note Organization
```
You: Find all my notes about Python programming and organize them with proper tags

AI: I'll find your Python programming notes and organize them with appropriate tags.

[Tool: search_notes]
Searching for: "Python programming"

[Tool: keyword_search]
Searching for: "Python", "Python code", "Python script"

Found 15 notes related to Python programming.

[Tool: manage_attributes] (for each note)
Adding tags: #python, #programming, #development

Organized notes with tags:
- Added #python to all Python-related notes
- Added #tutorial to learning materials
- Added #reference to documentation notes
- Added #project to implementation examples

Your Python notes are now properly tagged and easier to find!
```

## Best Practices

### Chat Optimization

#### Effective Prompting
- **Be specific**: "Find notes about React performance optimization" vs "Find React notes"
- **Provide context**: "In my web development notes, find information about..."
- **Ask follow-up questions**: Build on previous responses

#### Managing Context
- Start new conversations for unrelated topics
- Reference specific notes when needed
- Use the "Clear conversation" option for fresh starts

### Search Optimization

#### Query Techniques
- **Semantic queries**: "Notes about improving team productivity"
- **Keyword queries**: "notes containing 'API documentation'"
- **Attribute queries**: "notes tagged with #urgent"

#### Result Refinement
- Use `parentNoteId` to limit scope
- Adjust `maxResults` for broader/narrower searches
- Enable summarization for content previews

### Content Organization

#### Note Structure
- Use clear, descriptive titles
- Include relevant keywords in content
- Add appropriate attributes and tags

#### Embedding Quality
- Write substantive content (avoid very short notes)
- Use consistent terminology
- Include context and explanations

### Tool Usage

#### Automatic vs Manual
- Let AI choose tools automatically for most tasks
- Specify tools when you need precise control
- Combine multiple tools for complex operations

#### Error Handling
- Check tool results before proceeding
- Verify note IDs when referencing specific notes
- Use search tools to find notes before updating them

## Privacy and Data Handling

### Local Processing
- Embeddings stored locally in Trilium database
- No sensitive content leaves your instance (with Ollama)
- Full control over data processing

### Cloud Provider Considerations
- OpenAI and Anthropic process content on their servers
- Review their privacy policies
- Consider using `#aiExclude` for sensitive notes

### Content Filtering
- Exclude private notes from AI processing
- Use separate Trilium instances for sensitive data
- Regular review of AI-processed content

## Performance Considerations

### Response Times
- Local models (Ollama): Slower but private
- Cloud models: Faster but require internet
- Embedding generation: One-time cost per note

### Resource Usage
- Embeddings require storage space
- Local models need CPU/GPU resources
- Monitor system performance with large knowledge bases

### Optimization Tips
- Use appropriate models for your use case
- Regular embedding maintenance
- Efficient note organization
- Strategic use of exclusion attributes

## Next Steps

- [Advanced Configuration](Advanced-Configuration.md) - Customize prompts and settings
- [Troubleshooting and Best Practices](Troubleshooting-and-Best-Practices.md) - Optimize performance
- [Security and Privacy](Security-and-Privacy.md) - Data protection guidelines