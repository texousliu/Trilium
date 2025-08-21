# Advanced AI Configuration

This guide covers advanced configuration options for optimizing AI performance, customizing behavior, and managing resources effectively.

## Custom Prompts and Templates

### System Prompt Customization

The system prompt defines the AI's base behavior and personality. Customize it in Settings → AI/LLM → System Prompt.

#### Default System Prompt
```markdown
You are an AI assistant integrated into Trilium Notes. Your primary goal is to help users 
find information in their notes, answer questions based on their knowledge base, and 
provide assistance with using Trilium Notes features.
```

#### Specialized Prompts

**For Technical Documentation**
```markdown
You are a technical documentation assistant for a software development team. 
Focus on:
- Code examples and implementation details
- API references and specifications  
- Technical accuracy and precision
- Consistent terminology usage
Always cite specific documentation notes and version numbers.
```

**For Research and Academia**
```markdown
You are an academic research assistant. When responding:
- Cite sources with proper attribution
- Maintain academic tone and rigor
- Identify gaps in research
- Suggest connections between concepts
- Use formal language and proper citations
Reference note titles as you would academic papers.
```

**For Creative Writing**
```markdown
You are a creative writing assistant integrated with a writer's notebook.
- Maintain consistency in story elements
- Track character development across notes
- Suggest plot connections
- Preserve the author's voice and style
- Reference world-building notes for consistency
```

**For Personal Knowledge Management**
```markdown
You are a personal knowledge management assistant. Focus on:
- Connecting ideas across different domains
- Identifying patterns in thoughts and notes
- Suggesting organizational improvements
- Maintaining privacy and discretion
- Building on personal insights and reflections
```

### Dynamic Prompt Templates

Create note templates that modify AI behavior contextually:

```javascript
// In a code note with #customPrompt label
module.exports = {
    getPrompt: function(context) {
        const noteType = context.note.type;
        const labels = context.note.labels;
        
        if (labels.includes('meeting')) {
            return "Focus on action items and decisions. Be concise.";
        } else if (noteType === 'code') {
            return "Provide technical analysis and suggest improvements.";
        } else {
            return "Standard assistance mode.";
        }
    }
};
```

## Provider-Specific Settings

### OpenAI Advanced Options

#### Model Parameters
```json
{
    "model": "gpt-4-turbo-preview",
    "temperature": 0.7,
    "max_tokens": 4000,
    "top_p": 0.9,
    "frequency_penalty": 0.3,
    "presence_penalty": 0.3,
    "logit_bias": {
        "50256": -100  // Prevent specific tokens
    }
}
```

#### Function Calling Configuration
```javascript
{
    "tools": [{
        "type": "function",
        "function": {
            "name": "search_notes",
            "strict": true,  // Enforce schema validation
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "limit": {"type": "number", "default": 10}
                }
            }
        }
    }],
    "tool_choice": "auto"  // or "none", "required", or specific tool
}
```

#### Custom Base URLs

For Azure OpenAI or compatible endpoints:
```
Base URL: https://your-resource.openai.azure.com/
API Version: 2024-02-15-preview
Deployment Name: your-deployment-name
```

### Anthropic Advanced Options

#### Model Configuration
```json
{
    "model": "claude-3-opus-20240229",
    "max_tokens": 4096,
    "temperature": 0.7,
    "top_p": 0.9,
    "top_k": 40,
    "stop_sequences": ["\\n\\nUser:", "\\n\\nAssistant:"]
}
```

#### Beta Features
```javascript
{
    "anthropic-beta": "tools-2024-04-04",
    "anthropic-version": "2023-06-01",
    "metadata": {
        "user_id": "trilium-user",
        "session_id": "chat-session-123"
    }
}
```

### Ollama Advanced Options

#### Model Quantization

Choose models based on available resources:

| Quantization | Model Size | Quality | Speed |
|--------------|------------|---------|-------|
| Q8_0 | 100% | Highest | Slowest |
| Q6_K | 75% | Very Good | Good |
| Q5_K_M | 60% | Good | Better |
| Q4_K_M | 50% | Acceptable | Fast |
| Q3_K_M | 35% | Lower | Fastest |

```bash
# Download specific quantization
ollama pull llama3:8b-instruct-q4_0
ollama pull mistral:7b-instruct-q5_K_M
```

#### Custom Model Configuration

Create a Modelfile for customized behavior:
```dockerfile
# Modelfile
FROM llama3:8b

# Set parameters
PARAMETER temperature 0.7
PARAMETER top_k 40
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.1
PARAMETER num_ctx 4096

# Set custom system prompt
SYSTEM """You are integrated with Trilium Notes. 
Focus on note organization and knowledge management."""

# Create the custom model
```

Build and use:
```bash
ollama create trilium-assistant -f Modelfile
```

#### GPU Acceleration

```bash
# Check GPU support
ollama list

# Set GPU layers (NVIDIA)
export OLLAMA_NUM_GPU_LAYERS=35

# Limit GPU memory usage
export OLLAMA_GPU_MEMORY=8GB

# Use specific GPU
export CUDA_VISIBLE_DEVICES=0
```

## Performance Optimization

### Embedding Optimization

#### Batch Processing
```javascript
// In Trilium settings or via API
{
    "embedding": {
        "batch_size": 100,        // Process 100 notes at once
        "parallel_requests": 3,    // Concurrent API calls
        "retry_attempts": 3,       // Retry failed embeddings
        "retry_delay": 1000,       // Wait 1 second between retries
        "cache_ttl": 86400000     // Cache for 24 hours
    }
}
```

#### Selective Embedding
```javascript
// Configure which notes to embed
{
    "embedding_rules": {
        "include_types": ["text", "code", "book"],
        "exclude_labels": ["#private", "#temp", "#excludeFromAI"],
        "min_content_length": 100,  // Skip very short notes
        "max_content_length": 50000 // Truncate very long notes
    }
}
```

#### Embedding Model Selection

| Use Case | Recommended Model | Dimensions | Speed |
|----------|------------------|------------|-------|
| General | text-embedding-3-small | 1536 | Fast |
| High Accuracy | text-embedding-3-large | 3072 | Slower |
| Local/Private | mxbai-embed-large | 1024 | Medium |
| Multilingual | multilingual-e5-large | 1024 | Slow |

### Context Window Management

#### Smart Context Selection
```javascript
{
    "context": {
        "max_notes": 10,           // Maximum notes to include
        "max_tokens": 8000,        // Total context size
        "relevance_threshold": 0.7, // Minimum similarity score
        "include_hierarchy": true,  // Include parent/child notes
        "include_related": true,    // Include linked notes
        "time_weight": 0.2         // Prefer recent notes
    }
}
```

#### Context Strategies

**Hierarchical Context**
```javascript
// Include note hierarchy in context
function getHierarchicalContext(noteId) {
    return {
        strategy: "hierarchical",
        depth: 2,              // Include 2 levels up/down
        include_siblings: true,
        max_siblings: 3
    };
}
```

**Temporal Context**
```javascript
// Prioritize recent notes
function getTemporalContext(noteId) {
    return {
        strategy: "temporal",
        time_window: 7 * 24 * 60 * 60 * 1000, // 7 days
        decay_factor: 0.9     // Reduce relevance over time
    };
}
```

**Semantic Context**
```javascript
// Use embeddings for similarity
function getSemanticContext(query) {
    return {
        strategy: "semantic",
        top_k: 10,
        min_similarity: 0.75,
        diversity_factor: 0.3  // Balance relevance with variety
    };
}
```

### Caching Strategies

#### Response Caching
```javascript
{
    "cache": {
        "enabled": true,
        "ttl": 3600000,           // 1 hour
        "max_size": 1000,         // Maximum cached responses
        "key_strategy": "hash",    // Hash of prompt + context
        "invalidate_on": ["note_update", "note_delete"]
    }
}
```

#### Embedding Cache
```javascript
{
    "embedding_cache": {
        "type": "persistent",      // Store on disk
        "location": "./cache/embeddings",
        "compression": true,       // Compress cached embeddings
        "validation": "checksum"   // Verify integrity
    }
}
```

## Batch Processing

### Bulk Operations

#### Batch Note Analysis
```javascript
async function analyzeAllNotes(category) {
    const config = {
        batch_size: 50,
        parallel: 3,
        rate_limit: 10,  // requests per second
        progress_callback: (current, total) => {
            console.log(`Processing ${current}/${total}`);
        }
    };
    
    return await ai.batchProcess(notes, 'analyze', config);
}
```

#### Scheduled Processing
```javascript
// Process embeddings during off-hours
{
    "scheduled_tasks": [{
        "name": "embedding_update",
        "schedule": "0 2 * * *",  // 2 AM daily
        "task": "update_embeddings",
        "config": {
            "incremental": true,
            "max_duration": 3600000  // Stop after 1 hour
        }
    }]
}
```

## API Usage Monitoring

### Usage Tracking

```javascript
{
    "monitoring": {
        "track_usage": true,
        "metrics": [
            "tokens_used",
            "api_calls",
            "cache_hits",
            "response_time",
            "error_rate"
        ],
        "alert_thresholds": {
            "daily_tokens": 1000000,
            "hourly_requests": 1000,
            "error_rate": 0.05
        }
    }
}
```

### Cost Management

#### Budget Controls
```javascript
{
    "budget": {
        "monthly_limit": 50.00,
        "daily_limit": 2.00,
        "per_request_limit": 0.10,
        "warning_threshold": 0.8,
        "hard_stop": true,
        "fallback_model": "gpt-3.5-turbo"  // Use cheaper model when near limit
    }
}
```

#### Usage Optimization
```javascript
{
    "optimization": {
        "auto_downgrade": true,    // Switch to cheaper models
        "cache_aggressive": true,  // Maximize cache usage
        "batch_requests": true,    // Combine multiple queries
        "compress_context": true,  // Minimize token usage
        "smart_truncation": true   // Intelligently trim context
    }
}
```

## Custom Tool Development

### Creating Custom Tools

```javascript
// custom_tool.js
class CustomSearchTool {
    constructor() {
        this.name = 'advanced_search';
        this.description = 'Advanced search with custom filters';
    }
    
    get definition() {
        return {
            type: 'function',
            function: {
                name: this.name,
                description: this.description,
                parameters: {
                    type: 'object',
                    properties: {
                        query: { type: 'string' },
                        filters: {
                            type: 'object',
                            properties: {
                                date_range: { type: 'string' },
                                note_type: { type: 'string' },
                                labels: { type: 'array' }
                            }
                        }
                    },
                    required: ['query']
                }
            }
        };
    }
    
    async execute(params) {
        // Implementation
        const results = await searchWithFilters(params);
        return {
            success: true,
            results: results
        };
    }
}

// Register the tool
toolRegistry.register(new CustomSearchTool());
```

### Tool Composition

```javascript
// Combine multiple tools for complex operations
class WorkflowTool {
    async execute(params) {
        // Step 1: Search for relevant notes
        const searchResults = await tools.search_notes.execute({
            query: params.topic
        });
        
        // Step 2: Read and analyze each note
        const analyses = await Promise.all(
            searchResults.map(note => 
                tools.analyze_content.execute({ noteId: note.id })
            )
        );
        
        // Step 3: Create summary
        const summary = await tools.create_note.execute({
            title: `${params.topic} Analysis`,
            content: formatAnalysis(analyses)
        });
        
        return summary;
    }
}
```

## Integration with External Services

### Webhook Integration

```javascript
{
    "webhooks": {
        "enabled": true,
        "endpoints": [{
            "url": "https://your-service.com/webhook",
            "events": ["chat_start", "chat_end", "tool_execution"],
            "headers": {
                "Authorization": "Bearer YOUR_TOKEN"
            }
        }]
    }
}
```

### External Tool Calling

```javascript
// Call external APIs from AI tools
class ExternalAPITool {
    async execute(params) {
        const response = await fetch('https://api.service.com/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.API_KEY}`
            },
            body: JSON.stringify(params)
        });
        
        return await response.json();
    }
}
```

## Debugging and Logging

### Verbose Logging

```javascript
{
    "logging": {
        "level": "debug",
        "categories": {
            "api_calls": true,
            "tool_execution": true,
            "context_building": true,
            "embedding_generation": true
        },
        "output": {
            "console": true,
            "file": "./logs/ai-debug.log",
            "max_size": "10MB",
            "rotation": "daily"
        }
    }
}
```

### Performance Profiling

```javascript
{
    "profiling": {
        "enabled": true,
        "metrics": {
            "response_time": true,
            "token_usage": true,
            "cache_performance": true,
            "tool_execution_time": true
        },
        "export": {
            "format": "json",
            "destination": "./metrics/ai-performance.json",
            "interval": 3600000  // Export hourly
        }
    }
}
```

## Security Configuration

### API Key Management

```javascript
{
    "security": {
        "api_keys": {
            "encryption": "aes-256-gcm",
            "storage": "secure_vault",
            "rotation": "monthly",
            "audit_access": true
        }
    }
}
```

### Rate Limiting

```javascript
{
    "rate_limits": {
        "per_user": {
            "requests_per_minute": 60,
            "tokens_per_hour": 100000
        },
        "per_session": {
            "max_messages": 100,
            "max_tokens": 50000
        },
        "global": {
            "concurrent_requests": 10,
            "queue_size": 100
        }
    }
}
```

## Migration and Backup

### Configuration Backup

```javascript
// Backup AI configuration
async function backupAIConfig() {
    const config = {
        providers: await getProviderSettings(),
        prompts: await getCustomPrompts(),
        tools: await getToolConfigurations(),
        embeddings: await getEmbeddingSettings()
    };
    
    await saveToFile('./backups/ai-config-backup.json', config);
}
```

### Migration Between Providers

```javascript
// Migrate embeddings from one provider to another
async function migrateEmbeddings(fromProvider, toProvider) {
    const notes = await getAllNotes();
    const batchSize = 100;
    
    for (let i = 0; i < notes.length; i += batchSize) {
        const batch = notes.slice(i, i + batchSize);
        const embeddings = await toProvider.generateEmbeddings(batch);
        await saveEmbeddings(embeddings);
        
        console.log(`Migrated ${i + batch.length}/${notes.length} notes`);
    }
}
```