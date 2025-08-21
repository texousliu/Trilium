# Setup and Configuration

This guide provides step-by-step instructions for setting up AI features in Trilium Notes with each supported provider.

## Prerequisites

Before configuring AI features, ensure you have:
- Trilium Notes installed and running
- An active internet connection (for cloud providers)
- API keys for your chosen provider (OpenAI or Anthropic)
- Ollama installed locally (for local AI option)

## Initial Setup

### Step 1: Access AI Settings

1. Open Trilium Notes
2. Navigate to the main menu
3. Select **Options** 
4. Scroll down to find **AI/LLM** section
5. Click to expand the AI/LLM settings panel

### Step 2: Enable AI Features

1. In the AI/LLM settings panel, locate the "Enable AI Features" checkbox
2. Check the box to enable AI functionality
3. You should see a confirmation message: "AI features enabled"

## Provider-Specific Setup

## OpenAI Configuration

### Obtaining an API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key immediately (it won't be shown again)
6. Store the key securely

### Configuration Steps

1. In Trilium's AI/LLM settings, select **OpenAI** from the provider dropdown
2. Enter your configuration:
   ```
   API Key: sk-...your-key-here...
   Base URL: https://api.openai.com/v1 (default)
   Default Model: gpt-4-turbo-preview (recommended)
   ```
3. Click **Test Connection** to verify setup
4. For embeddings, select:
   ```
   Embedding Model: text-embedding-3-small (cost-effective)
   or
   Embedding Model: text-embedding-3-large (higher quality)
   ```

### Model Selection Guide

| Model | Best For | Context Window | Cost |
|-------|----------|----------------|------|
| gpt-4-turbo-preview | Complex reasoning, analysis | 128K tokens | Higher |
| gpt-4 | High-quality responses | 8K tokens | Highest |
| gpt-3.5-turbo | Quick responses, general use | 16K tokens | Lower |

### Cost Considerations

- **Chat**: Approximately $0.01-0.03 per 1K tokens for GPT-4
- **Embeddings**: ~$0.0001 per 1K tokens for ada-002
- **Monthly estimate**: Light use ~$5-10, Heavy use ~$20-50

## Anthropic Configuration

### Obtaining an API Key

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to **API Keys**
4. Generate a new API key
5. Copy and store securely

### Configuration Steps

1. Select **Anthropic** from the provider dropdown
2. Enter your configuration:
   ```
   API Key: sk-ant-...your-key-here...
   Base URL: https://api.anthropic.com (default)
   Default Model: claude-3-sonnet-20240229 (balanced)
   ```
3. Test the connection to ensure it works

### Model Selection Guide

| Model | Best For | Context Window | Speed |
|-------|----------|----------------|-------|
| claude-3-opus | Most capable, complex tasks | 200K tokens | Slower |
| claude-3-sonnet | Balanced performance | 200K tokens | Medium |
| claude-3-haiku | Fast responses, simple tasks | 200K tokens | Fastest |

### Cost Considerations

- **Opus**: ~$15 per million input tokens
- **Sonnet**: ~$3 per million input tokens  
- **Haiku**: ~$0.25 per million input tokens
- **Monthly estimate**: Similar to OpenAI depending on usage

## Ollama Configuration (Local AI)

### Installing Ollama

#### Windows
1. Download from [ollama.com](https://ollama.com/download)
2. Run the installer
3. Open terminal and verify: `ollama --version`

#### macOS
```bash
# Using Homebrew
brew install ollama

# Or download from website
curl -fsSL https://ollama.com/install.sh | sh
```

#### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Downloading Models

#### Chat Models
```bash
# Recommended models for chat
ollama pull llama3        # 8B parameters, balanced
ollama pull mistral      # 7B parameters, fast
ollama pull phi3         # 3.8B parameters, lightweight
ollama pull qwen2:7b     # 7B parameters, multilingual
```

#### Embedding Models
```bash
# Recommended for embeddings
ollama pull mxbai-embed-large    # Best quality
ollama pull nomic-embed-text     # Good balance
ollama pull all-minilm           # Lightweight
```

### Configuration Steps

1. Ensure Ollama is running:
   ```bash
   ollama serve  # Usually starts automatically
   ```

2. In Trilium, select **Ollama** from the provider dropdown

3. Enter configuration:
   ```
   Base URL: http://localhost:11434
   ```

4. Click **Refresh Models** button to load available models

5. Select your models:
   ```
   Chat Model: llama3 (or your preferred model)
   Embedding Model: mxbai-embed-large
   ```

### Performance Optimization

#### System Requirements
- **Minimum**: 8GB RAM for 7B models
- **Recommended**: 16GB RAM for smooth operation
- **GPU**: NVIDIA GPU with 6GB+ VRAM significantly improves speed

#### Model Selection by Hardware

| RAM | Recommended Models |
|-----|-------------------|
| 8GB | phi3, tinyllama |
| 16GB | mistral, llama3:7b |
| 32GB+ | llama3:13b, mixtral |

## Embedding Configuration

### What are Embeddings?

Embeddings are numerical representations of your notes that enable:
- Semantic search (finding conceptually similar content)
- Intelligent context selection for AI conversations
- Discovering relationships between notes

### Setting Up Embeddings

1. **Choose an Embedding Provider**
   - Use the same provider as your chat model for simplicity
   - Or mix providers (e.g., Ollama for embeddings, OpenAI for chat)

2. **Select Embedding Model**
   - OpenAI: `text-embedding-3-small` (cost-effective)
   - Ollama: `mxbai-embed-large` (high quality, local)

3. **Generate Initial Embeddings**
   - Click **Recreate All Embeddings** button
   - This process runs in the background
   - Progress shown in embedding statistics

### Monitoring Embedding Generation

The embedding statistics show:
```
Embeddings Status:
- Total Notes: 1,234
- Embedded: 1,200
- Pending: 34
- Failed: 0
```

Embeddings are automatically updated when notes are:
- Created
- Modified  
- Deleted

## Model Parameters

### Temperature
Controls randomness in responses:
- `0.0`: Deterministic, focused
- `0.7`: Balanced (default)
- `1.0`: Creative, varied

### Max Tokens
Maximum response length:
- Default: 4000 tokens (~3000 words)
- Increase for longer responses
- Decrease to control costs

### System Prompt
Customize AI behavior:
```
You are a helpful assistant integrated with my personal knowledge base.
Focus on accuracy and cite specific notes when providing information.
```

## Advanced Settings

### API Configuration

#### Custom Endpoints
For OpenAI-compatible services:
```
Base URL: https://your-custom-endpoint.com/v1
API Key: your-api-key
```

#### Proxy Configuration
If behind a corporate proxy:
1. Set system environment variables
2. Or configure in Trilium's network settings

### Rate Limiting

Configure to avoid API limits:
```
Requests per minute: 60
Tokens per minute: 90000
Concurrent requests: 3
```

### Timeout Settings
```
Connection timeout: 30 seconds
Request timeout: 120 seconds
```

## Testing Your Configuration

### Connection Test

1. Click **Test Connection** button
2. Expected response: "Connection successful"
3. If failed, check:
   - API key validity
   - Network connectivity
   - Firewall settings

### Feature Test

1. Open "Chat with Notes"
2. Type: "Hello, can you see my notes?"
3. The AI should respond and attempt to access your notes
4. Verify embeddings are being used for context

## Troubleshooting Setup Issues

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| "Invalid API Key" | Double-check key, ensure no extra spaces |
| "Connection timeout" | Check firewall, proxy settings |
| "Model not found" | Verify model name, pull model for Ollama |
| "Embeddings not generating" | Check provider settings, recreate embeddings |
| "Out of memory" (Ollama) | Use smaller model, close other applications |

### Logs and Diagnostics

Check logs for detailed error information:
- Location: `[Trilium Data]/logs/`
- Look for entries with `[AI]` or `[LLM]` tags

## Migration Between Providers

To switch providers:

1. **Export Important Chats** (if needed)
2. **Change Provider** in settings
3. **Update API Keys** and configuration
4. **Recreate Embeddings** with new provider
5. **Test Connection** before use

Note: Embedding recreation is necessary when switching embedding providers to maintain search quality.

## Next Steps

After successful setup:
1. Review [Features and Usage](03-features-usage.md) to learn how to use AI features
2. Explore [Advanced Configuration](04-advanced-configuration.md) for optimization
3. Read [Security and Privacy](06-security-privacy.md) for best practices