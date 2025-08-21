# AI Integration Setup and Configuration

This guide provides step-by-step instructions for setting up AI providers in Trilium Notes.

## Prerequisites

- Trilium Notes version 0.90.0 or later
- Administrative access to your Trilium instance
- API keys for cloud providers (if using OpenAI or Anthropic)

## General Setup

### 1. Enable AI Features

1. Navigate to **Settings** → **AI/LLM**
2. Toggle **Enable AI Features** to activate the integration
3. The AI settings panel will become available

### 2. Configure Embedding Provider

Embeddings are essential for semantic search and context retrieval. Choose one provider:

1. In the **Embedding Provider** section, select your preferred provider
2. Configure the provider settings (see provider-specific sections below)
3. Select an appropriate embedding model
4. Click **Save** to apply settings

### 3. Configure Chat Provider

1. In the **Chat Provider** section, select your preferred provider
2. Configure the provider settings
3. Select a chat model
4. Click **Save** to apply settings

### 4. Initialize Embeddings

1. Scroll to the bottom of the AI settings
2. Click **Recreate All Embeddings** to generate embeddings for existing notes
3. Monitor progress in the **Embedding Statistics** section

## Provider-Specific Configuration

## OpenAI Setup

### Prerequisites
- OpenAI account with API access
- Valid API key with sufficient credits

### Configuration Steps

1. **Get API Key**
   - Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key securely

2. **Configure in Trilium**
   - In AI settings, select **OpenAI** tab
   - Enter your **API Key**
   - Set **Base URL** (leave default unless using a proxy)
   - Click **Refresh Models** to load available models

3. **Select Models**
   - **Chat Model**: `gpt-4o` (recommended) or `gpt-3.5-turbo`
   - **Embedding Model**: `text-embedding-3-large` (recommended) or `text-embedding-ada-002`

4. **Advanced Settings**
   - **Temperature**: 0.7 (default, range 0-2)
   - **Max Tokens**: Leave empty for model default
   - **Top P**: 1.0 (default)

### Cost Optimization
- Use `gpt-3.5-turbo` for basic tasks (lower cost)
- Use `text-embedding-3-small` for embeddings (lower cost)
- Monitor usage in OpenAI dashboard
- Set usage limits in OpenAI account

### Example Configuration
```
API Key: sk-...your-key-here...
Base URL: https://api.openai.com/v1
Chat Model: gpt-4o
Embedding Model: text-embedding-3-large
Temperature: 0.7
```

## Anthropic Setup

### Prerequisites
- Anthropic account with API access
- Valid API key with sufficient credits

### Configuration Steps

1. **Get API Key**
   - Visit [Anthropic Console](https://console.anthropic.com/)
   - Navigate to API Keys
   - Create a new API key
   - Copy the key securely

2. **Configure in Trilium**
   - In AI settings, select **Anthropic** tab
   - Enter your **API Key**
   - Set **Base URL** (leave default unless using a proxy)
   - Click **Refresh Models** to load available models

3. **Select Models**
   - **Chat Model**: `claude-3-5-sonnet-20241022` (recommended) or `claude-3-opus-20240229`
   - **Note**: Anthropic doesn't provide embedding models; use OpenAI or Ollama for embeddings

4. **Advanced Settings**
   - **Temperature**: 0.7 (default, range 0-1)
   - **Max Tokens**: 4096 (recommended)
   - **Top P**: 1.0 (default)

### Cost Optimization
- Use Claude 3.5 Sonnet for most tasks (good balance of performance and cost)
- Use Claude 3 Haiku for simple tasks (lower cost)
- Monitor usage in Anthropic console
- Set usage limits in Anthropic account

### Example Configuration
```
API Key: sk-ant-...your-key-here...
Base URL: https://api.anthropic.com
Chat Model: claude-3-5-sonnet-20241022
Temperature: 0.7
Max Tokens: 4096
```

## Ollama Setup (Local AI)

### Prerequisites
- Local machine with sufficient resources (8GB+ RAM recommended)
- Ollama installed locally

### Installation Steps

1. **Install Ollama**
   - Visit [Ollama.ai](https://ollama.ai/)
   - Download and install for your operating system
   - Start Ollama service

2. **Install Models**
   ```bash
   # Install a chat model
   ollama pull llama3.1:8b
   
   # Install an embedding model
   ollama pull mxbai-embed-large
   
   # List installed models
   ollama list
   ```

3. **Configure in Trilium**
   - In AI settings, select **Ollama** tab
   - Set **Base URL**: `http://localhost:11434`
   - Click **Refresh Models** to load available models

4. **Select Models**
   - **Chat Model**: `llama3.1:8b` or your preferred model
   - **Embedding Model**: `mxbai-embed-large` or `nomic-embed-text`

### Recommended Models

**Chat Models:**
- `llama3.1:8b` - Good balance of performance and resource usage
- `llama3.1:70b` - High performance (requires 40GB+ RAM)
- `mistral:7b` - Efficient alternative
- `codellama:7b` - Optimized for code

**Embedding Models:**
- `mxbai-embed-large` - High quality embeddings
- `nomic-embed-text` - Good performance, lower resource usage
- `all-minilm:l6-v2` - Lightweight option

### Performance Optimization
- Use quantized models (Q4_K_M) for better performance
- Increase `num_ctx` for larger context windows
- Use GPU acceleration if available
- Monitor resource usage

### Example Configuration
```
Base URL: http://localhost:11434
Chat Model: llama3.1:8b
Embedding Model: mxbai-embed-large
Context Window: 32768
```

## Voyage AI Setup (Embeddings Only)

### Prerequisites
- Voyage AI account with API access
- Valid API key

### Configuration Steps

1. **Get API Key**
   - Visit [Voyage AI](https://www.voyageai.com/)
   - Create account and get API key

2. **Configure in Trilium**
   - In AI settings, select **Voyage AI** tab
   - Enter your **API Key**
   - Select embedding model: `voyage-large-2` (recommended)

### Example Configuration
```
API Key: pa-...your-key-here...
Model: voyage-large-2
```

## Mixed Provider Configuration

You can use different providers for different purposes:

### Recommended Combinations

1. **Cost-Effective Setup**
   - Chat: Ollama (llama3.1:8b)
   - Embeddings: Ollama (mxbai-embed-large)

2. **High-Performance Setup**
   - Chat: OpenAI (gpt-4o)
   - Embeddings: Voyage AI (voyage-large-2)

3. **Balanced Setup**
   - Chat: Anthropic (claude-3-5-sonnet)
   - Embeddings: OpenAI (text-embedding-3-large)

## Verification and Testing

### 1. Test Configuration
1. Save your configuration
2. Navigate to **Chat with Notes**
3. Send a test message: "Hello, can you help me with my notes?"
4. Verify you receive a response

### 2. Test Embeddings
1. Check **Embedding Statistics** for progress
2. Try semantic search: "Find notes about [your topic]"
3. Verify relevant results are returned

### 3. Test Tools
1. Ask AI to "Create a new note about testing"
2. Verify the note is created
3. Ask AI to "Find my recent notes"
4. Verify search results are returned

## Performance Monitoring

### Embedding Statistics
Monitor in AI settings:
- **Total Notes**: Number of notes in your database
- **Notes with Embeddings**: Successfully processed notes
- **Embedding Progress**: Current processing status

### Usage Tracking
- Monitor API usage in provider dashboards
- Check response times for performance issues
- Watch for rate limit warnings

## Common Configuration Issues

### API Key Problems
- Verify key is correctly copied (no extra spaces)
- Check key permissions and usage limits
- Ensure account has sufficient credits

### Connection Issues
- Verify internet connectivity
- Check firewall settings
- Confirm base URLs are correct

### Model Issues
- Ensure selected models are available
- Check model permissions
- Verify model names are correct

### Embedding Issues
- Allow time for initial embedding generation
- Check available disk space
- Monitor for API rate limits

## Next Steps

Once configured, proceed to:
- [AI Features and Usage](AI-Features-and-Usage.md) - Learn about available features
- [Advanced Configuration](Advanced-Configuration.md) - Customize prompts and settings
- [Troubleshooting and Best Practices](Troubleshooting-and-Best-Practices.md) - Optimize performance