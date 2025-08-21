# Troubleshooting and Best Practices

This guide helps you resolve common issues with AI features and provides best practices for optimal performance.

## Common Issues and Solutions

### Connection and Authentication Issues

#### "Invalid API Key" Error

**Symptoms:**
- Error message: "Invalid API key provided"
- Cannot connect to AI provider
- All AI features disabled

**Solutions:**

1. **Verify API Key Format**
   ```
   OpenAI: Should start with "sk-"
   Anthropic: Should start with "sk-ant-"
   ```

2. **Check for Extra Spaces**
   - Remove leading/trailing whitespace
   - Ensure no line breaks in the key

3. **Verify Key Permissions**
   - OpenAI: Check key has Chat and Embedding permissions
   - Anthropic: Ensure key is active and not expired

4. **Test Outside Trilium**
   ```bash
   # Test OpenAI
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_KEY"
   
   # Test Anthropic
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: YOUR_KEY" \
     -H "anthropic-version: 2023-06-01"
   ```

#### Connection Timeout

**Symptoms:**
- "Connection timeout" errors
- Slow or no response from AI
- Intermittent failures

**Solutions:**

1. **Check Network Configuration**
   ```bash
   # Test connectivity
   ping api.openai.com
   ping api.anthropic.com
   
   # Check DNS
   nslookup api.openai.com
   ```

2. **Configure Proxy Settings**
   ```javascript
   // If behind corporate proxy
   {
     "proxy": {
       "http": "http://proxy.company.com:8080",
       "https": "http://proxy.company.com:8080"
     }
   }
   ```

3. **Increase Timeout Values**
   ```javascript
   {
     "timeouts": {
       "connection": 60000,  // 60 seconds
       "request": 120000     // 2 minutes
     }
   }
   ```

4. **Check Firewall Rules**
   - Ensure ports 443 (HTTPS) are open
   - Whitelist AI provider domains

#### Ollama Connection Issues

**Symptoms:**
- "Cannot connect to Ollama" error
- Models not loading
- Empty model list

**Solutions:**

1. **Verify Ollama is Running**
   ```bash
   # Check if Ollama is running
   ollama list
   
   # Start Ollama if needed
   ollama serve
   
   # Check process
   ps aux | grep ollama
   ```

2. **Correct Base URL**
   ```
   Default: http://localhost:11434
   Docker: http://host.docker.internal:11434
   Remote: http://server-ip:11434
   ```

3. **Enable CORS for Remote Access**
   ```bash
   # Set environment variable
   export OLLAMA_ORIGINS="*"
   
   # Or in service file
   Environment="OLLAMA_ORIGINS=*"
   ```

4. **Check Model Availability**
   ```bash
   # List available models
   ollama list
   
   # Pull missing model
   ollama pull llama3
   ```

### Embedding Issues

#### Embeddings Not Generating

**Symptoms:**
- Embedding count stays at 0
- "Failed to generate embeddings" error
- Search not finding relevant notes

**Solutions:**

1. **Check Embedding Model Configuration**
   - Ensure embedding model is selected
   - Verify model supports embeddings

2. **Manually Trigger Regeneration**
   ```
   Settings → AI/LLM → Recreate All Embeddings
   ```

3. **Check Note Exclusions**
   ```javascript
   // Look for notes with exclusion label
   SELECT * FROM attributes 
   WHERE name = 'label' 
   AND value = 'excludeFromAI';
   ```

4. **Verify Resource Availability**
   - Check disk space for embedding storage
   - Monitor memory usage during generation

#### Embedding Quality Issues

**Symptoms:**
- Poor search results
- Irrelevant context in chats
- Missing obvious matches

**Solutions:**

1. **Switch to Better Embedding Model**
   ```
   OpenAI: text-embedding-3-large (higher quality)
   Ollama: mxbai-embed-large (recommended)
   ```

2. **Adjust Similarity Threshold**
   ```javascript
   {
     "search": {
       "similarity_threshold": 0.6,  // Lower = more results
       "diversity_factor": 0.3       // Balance relevance/variety
     }
   }
   ```

3. **Recreate Embeddings After Changes**
   - Required when switching models
   - Recommended after major note updates

### Chat and Response Issues

#### AI Not Accessing Notes

**Symptoms:**
- AI says "I don't have access to your notes"
- Generic responses without note references
- Tools not being called

**Solutions:**

1. **Enable Tool Calling**
   ```javascript
   {
     "tools": {
       "enabled": true,
       "auto_invoke": true
     }
   }
   ```

2. **Check Note Permissions**
   - Ensure notes aren't encrypted
   - Remove #excludeFromAI labels if present

3. **Verify Context Service**
   ```
   Check logs for:
   - "Context extraction failed"
   - "No relevant notes found"
   ```

4. **Test Tool Execution**
   ```
   Ask explicitly: "Search my notes for [topic]"
   Should trigger search_notes tool
   ```

#### Slow Response Times

**Symptoms:**
- Long delays before responses
- Timeouts during conversations
- UI freezing during AI operations

**Solutions:**

1. **Optimize Model Selection**
   ```
   Fast: gpt-3.5-turbo, claude-3-haiku
   Balanced: gpt-4-turbo, claude-3-sonnet
   Quality: gpt-4, claude-3-opus
   ```

2. **Reduce Context Size**
   ```javascript
   {
     "context": {
       "max_notes": 5,      // Reduce from 10
       "max_tokens": 4000   // Reduce from 8000
     }
   }
   ```

3. **Enable Caching**
   ```javascript
   {
     "cache": {
       "enabled": true,
       "ttl": 3600000,
       "aggressive": true
     }
   }
   ```

4. **Use Streaming Responses**
   ```javascript
   {
     "streaming": true,
     "stream_delay": 0
   }
   ```

#### Incomplete or Cut-off Responses

**Symptoms:**
- Responses end mid-sentence
- Missing expected information
- "Length limit reached" messages

**Solutions:**

1. **Increase Token Limits**
   ```javascript
   {
     "max_tokens": 8000,  // Increase limit
     "reserve_tokens": 500 // Reserve for completion
   }
   ```

2. **Optimize Prompts**
   - Be more specific to reduce response length
   - Request summaries instead of full content

3. **Use Continuation Prompts**
   ```
   "Continue from where you left off"
   "Please complete the previous response"
   ```

### Model-Specific Issues

#### OpenAI Rate Limits

**Symptoms:**
- "Rate limit exceeded" errors
- 429 status codes
- Intermittent failures

**Solutions:**

1. **Implement Retry Logic**
   ```javascript
   {
     "retry": {
       "max_attempts": 3,
       "delay": 2000,
       "backoff": 2
     }
   }
   ```

2. **Configure Rate Limiting**
   ```javascript
   {
     "rate_limit": {
       "requests_per_minute": 50,
       "tokens_per_minute": 40000
     }
   }
   ```

3. **Upgrade API Tier**
   - Check OpenAI usage tier
   - Request tier increase if needed

#### Anthropic Context Window

**Symptoms:**
- "Context too long" errors
- Inability to process large notes

**Solutions:**

1. **Use Larger Context Models**
   ```
   Claude 3 models: 200K token context
   ```

2. **Implement Smart Truncation**
   ```javascript
   {
     "truncation": {
       "strategy": "smart",
       "preserve": ["title", "summary"],
       "max_per_note": 2000
     }
   }
   ```

#### Ollama Memory Issues

**Symptoms:**
- "Out of memory" errors
- Model loading failures
- System slowdown

**Solutions:**

1. **Use Quantized Models**
   ```bash
   # Use smaller quantization
   ollama pull llama3:7b-q4_0
   ```

2. **Limit Context Size**
   ```bash
   # Set context window
   ollama run llama3 --ctx-size 2048
   ```

3. **Configure GPU Memory**
   ```bash
   export OLLAMA_GPU_MEMORY=4GB
   export OLLAMA_NUM_GPU_LAYERS=20
   ```

## Best Practices

### Cost Optimization Strategies

#### Monitor Usage

1. **Track Token Consumption**
   ```javascript
   // Add to your configuration
   {
     "monitoring": {
       "log_token_usage": true,
       "alert_threshold": 100000
     }
   }
   ```

2. **Set Budget Limits**
   ```javascript
   {
     "budget": {
       "daily_limit": 2.00,
       "monthly_limit": 50.00,
       "auto_stop": true
     }
   }
   ```

#### Optimize Requests

1. **Use Appropriate Models**
   - Simple queries: Use cheaper/faster models
   - Complex analysis: Use advanced models
   - Embeddings: Use dedicated embedding models

2. **Cache Aggressively**
   - Cache common queries
   - Store processed embeddings
   - Reuse context when possible

3. **Batch Operations**
   ```javascript
   // Process multiple notes together
   await ai.batchEmbed(notes, { batch_size: 100 });
   ```

### Quality and Accuracy Tips

#### Improve Response Quality

1. **Provide Clear Context**
   ```
   Bad: "Summarize my notes"
   Good: "Summarize my project management notes from Q1 2024"
   ```

2. **Use Examples**
   ```
   "Format the response like this example:
   - Topic: [name]
   - Key Points: [list]
   - Action Items: [list]"
   ```

3. **Iterate and Refine**
   - Start with broad questions
   - Narrow down based on responses
   - Use follow-up questions

#### Maintain Note Quality

1. **Structure Notes Consistently**
   - Use clear titles
   - Add descriptive labels
   - Include summaries for long notes

2. **Update Metadata**
   - Add relevant attributes
   - Maintain relationships
   - Keep dates current

3. **Regular Maintenance**
   - Remove duplicate notes
   - Update outdated information
   - Fix broken links

### Privacy Considerations

#### Protect Sensitive Data

1. **Use Exclusion Labels**
   ```
   Add #excludeFromAI to sensitive notes
   ```

2. **Configure Privacy Settings**
   ```javascript
   {
     "privacy": {
       "exclude_patterns": ["password", "ssn", "credit card"],
       "sanitize_logs": true,
       "local_only": false
     }
   }
   ```

3. **Choose Appropriate Providers**
   - Sensitive data: Use Ollama (local)
   - General content: Cloud providers acceptable

#### Audit AI Access

1. **Review AI Logs**
   ```bash
   grep "AI accessed note" trilium-logs.txt
   ```

2. **Monitor Tool Usage**
   ```javascript
   // Track which notes are accessed
   {
     "audit": {
       "log_note_access": true,
       "log_tool_calls": true
     }
   }
   ```

### Performance Tuning

#### System Resources

1. **Memory Management**
   - Close unused applications
   - Increase Node.js memory limit
   - Use swap space if needed

2. **CPU Optimization**
   - Limit concurrent requests
   - Use worker threads
   - Enable process priority

3. **Storage Optimization**
   - Regular database maintenance
   - Compress old embeddings
   - Archive unused chat logs

#### Network Optimization

1. **Reduce Latency**
   - Use CDN endpoints when available
   - Enable HTTP/2
   - Configure keep-alive

2. **Handle Failures Gracefully**
   ```javascript
   {
     "resilience": {
       "circuit_breaker": true,
       "fallback_provider": "ollama",
       "offline_mode": true
     }
   }
   ```

## Diagnostic Tools

### Built-in Diagnostics

1. **AI Health Check**
   ```
   Settings → AI/LLM → Run Diagnostics
   ```

2. **Connection Test**
   ```
   Settings → AI/LLM → Test Connection
   ```

3. **Embedding Statistics**
   ```
   Settings → AI/LLM → View Statistics
   ```

### Log Analysis

1. **Enable Debug Logging**
   ```javascript
   {
     "logging": {
       "level": "debug",
       "ai_verbose": true
     }
   }
   ```

2. **Common Log Patterns**
   ```bash
   # Find errors
   grep "ERROR.*AI" logs/*.log
   
   # Track performance
   grep "AI response time" logs/*.log | awk '{print $NF}'
   
   # Monitor token usage
   grep "tokens_used" logs/*.log | sum
   ```

### Performance Monitoring

1. **Response Time Tracking**
   ```javascript
   // Add to configuration
   {
     "metrics": {
       "track_response_time": true,
       "slow_query_threshold": 5000
     }
   }
   ```

2. **Resource Usage**
   ```bash
   # Monitor Trilium process
   top -p $(pgrep -f trilium)
   
   # Check memory usage
   ps aux | grep trilium
   
   # Monitor network
   netstat -an | grep 11434  # Ollama
   ```

## Getting Help

### Self-Help Resources

1. **Check Documentation**
   - Review this troubleshooting guide
   - Read provider-specific docs
   - Check release notes for known issues

2. **Community Resources**
   - Trilium Discord server
   - GitHub Discussions
   - Reddit r/TriliumNotes

3. **Debug Information to Collect**
   - Trilium version
   - AI provider and model
   - Error messages and logs
   - System specifications
   - Configuration settings

### Reporting Issues

When reporting AI-related issues:

1. **Include Details**
   ```
   Trilium Version: X.X.X
   Provider: OpenAI/Anthropic/Ollama
   Model: gpt-4/claude-3/llama3
   Error: [exact error message]
   Steps to reproduce: [detailed steps]
   ```

2. **Attach Logs**
   - Recent error logs
   - Debug output if available
   - Configuration (sanitized)

3. **Describe Expected Behavior**
   - What you expected to happen
   - What actually happened
   - Any workarounds tried