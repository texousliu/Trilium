# Security and Privacy Guidelines

This document outlines security considerations and privacy best practices for using AI features in Trilium Notes.

## Overview of Security Model

### Data Flow Architecture

```
Your Notes → Trilium → AI Provider → Response → Trilium → You
     ↓          ↓           ↓            ↓         ↓
 [Encrypted] [Filtered] [Processed] [Validated] [Sanitized]
```

### Security Layers

1. **Local Storage**: Notes encrypted at rest
2. **Access Control**: AI exclusion labels and permissions
3. **Transport Security**: HTTPS/TLS for API communications
4. **Provider Security**: Provider-specific security measures
5. **Response Validation**: Output sanitization and validation

## Privacy Considerations by Provider

### Cloud Providers (OpenAI, Anthropic)

#### Data Handling

**What Gets Sent:**
- Selected note content (based on context)
- Your queries and prompts
- System instructions
- Tool execution parameters

**What Doesn't Get Sent:**
- Notes marked with `#excludeFromAI`
- Encrypted note content (unless decrypted)
- System metadata (file paths, internal IDs)
- Other users' data (in multi-user setups)

#### Provider Policies

**OpenAI Data Usage:**
- API data not used for training (as of 2024)
- 30-day retention for abuse monitoring
- Zero-retention available for enterprise
- SOC 2 Type II certified

**Anthropic Data Usage:**
- No training on API inputs
- Limited retention (check current policy)
- Constitutional AI for safety
- SOC 2 Type II certified

#### Best Practices for Cloud Providers

1. **Review Terms of Service**
   ```
   OpenAI: https://openai.com/policies/terms-of-use
   Anthropic: https://www.anthropic.com/terms
   ```

2. **Use API Keys Securely**
   ```javascript
   // Never commit API keys to version control
   // Use environment variables instead
   process.env.OPENAI_API_KEY
   process.env.ANTHROPIC_API_KEY
   ```

3. **Implement Data Minimization**
   ```javascript
   {
     "context": {
       "strategy": "minimal",
       "max_content_per_note": 1000,
       "exclude_patterns": ["personal", "private", "confidential"]
     }
   }
   ```

### Local Provider (Ollama)

#### Privacy Advantages

1. **Complete Data Control**
   - No data leaves your machine
   - No external API calls
   - No usage tracking

2. **Offline Operation**
   - Works without internet
   - No dependency on external services
   - Full functionality preserved

3. **Model Control**
   - Choose your models
   - Delete models anytime
   - No model updates without consent

#### Security Considerations

1. **Model Source Verification**
   ```bash
   # Verify model checksums
   ollama show llama3 --modelfile
   
   # Check model source
   ollama list --verbose
   ```

2. **Network Isolation**
   ```bash
   # Run Ollama without network access
   unshare -n ollama serve
   
   # Or use firewall rules
   iptables -A OUTPUT -p tcp --dport 11434 -j ACCEPT
   iptables -A OUTPUT -j DROP
   ```

3. **Resource Limits**
   ```bash
   # Limit CPU usage
   nice -n 10 ollama serve
   
   # Limit memory
   ulimit -v 8000000  # 8GB limit
   ```

## Protecting Sensitive Information

### Note Exclusion System

#### Using Exclusion Labels

1. **Apply Exclusion Label**
   ```
   Add label: #excludeFromAI
   ```

2. **Bulk Exclusion**
   ```javascript
   // Script to exclude all notes in a subtree
   const sensitiveRoot = api.getNoteWithLabel('confidential');
   const descendants = sensitiveRoot.getDescendants();
   
   for (const note of descendants) {
       note.addLabel('excludeFromAI');
   }
   ```

3. **Verify Exclusions**
   ```sql
   -- Query to find excluded notes
   SELECT notes.noteId, notes.title 
   FROM notes 
   JOIN attributes ON notes.noteId = attributes.noteId
   WHERE attributes.name = 'label' 
   AND attributes.value = 'excludeFromAI';
   ```

### Content Filtering

#### Automatic Sanitization

1. **Pattern-Based Filtering**
   ```javascript
   {
     "sanitization": {
       "patterns": [
         "\\b\\d{3}-\\d{2}-\\d{4}\\b",  // SSN
         "\\b\\d{16}\\b",                // Credit card
         "password:\\s*\\S+",            // Passwords
         "api[_-]?key:\\s*\\S+"          // API keys
       ],
       "replacement": "[REDACTED]"
     }
   }
   ```

2. **Content Type Filtering**
   ```javascript
   {
     "content_filtering": {
       "exclude_types": ["password", "credential"],
       "exclude_mime": ["application/pgp-encrypted"],
       "max_file_size": 1048576  // 1MB
     }
   }
   ```

### Encryption and Protected Notes

#### Working with Protected Notes

1. **Protected Notes Behavior**
   - Protected notes require decryption to be processed by AI
   - Temporary decryption only during AI processing
   - Re-encrypted immediately after

2. **Configuration Options**
   ```javascript
   {
     "protected_notes": {
       "allow_ai_access": false,  // Completely block
       "require_confirmation": true,  // Ask each time
       "auto_decrypt_timeout": 60000  // 1 minute
     }
   }
   ```

3. **Best Practices**
   - Keep highly sensitive data in protected notes
   - Disable AI access for protected notes
   - Use local AI (Ollama) for sensitive content

## API Key Security

### Secure Storage

#### Key Management Best Practices

1. **Never Store Keys in Code**
   ```javascript
   // BAD
   const API_KEY = "sk-abc123...";
   
   // GOOD
   const API_KEY = process.env.OPENAI_API_KEY;
   ```

2. **Use Trilium's Secure Storage**
   ```javascript
   // Keys are encrypted in Trilium's database
   await api.setOption('openaiApiKey', key, { encrypted: true });
   ```

3. **Rotate Keys Regularly**
   ```javascript
   // Set key expiration reminders
   {
     "key_rotation": {
       "reminder_days": 30,
       "max_age_days": 90,
       "auto_rotate": false
     }
   }
   ```

### Access Control

#### Limiting Key Permissions

1. **OpenAI Scoped Keys**
   - Create project-specific keys
   - Limit to required models only
   - Set usage limits

2. **Anthropic Usage Limits**
   - Configure spending limits
   - Set rate limits
   - Monitor usage dashboard

3. **Environment Isolation**
   ```bash
   # Development environment
   export OPENAI_API_KEY="sk-dev-..."
   
   # Production environment
   export OPENAI_API_KEY="sk-prod-..."
   ```

## Network Security

### HTTPS/TLS Configuration

#### Enforcing Secure Connections

1. **Verify TLS Certificates**
   ```javascript
   {
     "network": {
       "verify_ssl": true,
       "min_tls_version": "1.2",
       "reject_unauthorized": true
     }
   }
   ```

2. **Certificate Pinning**
   ```javascript
   {
     "security": {
       "pin_certificates": true,
       "trusted_cas": ["./certs/openai-ca.pem"]
     }
   }
   ```

### Proxy and VPN Considerations

#### Secure Proxy Configuration

1. **Authenticated Proxy**
   ```javascript
   {
     "proxy": {
       "host": "secure-proxy.company.com",
       "port": 8080,
       "auth": {
         "username": process.env.PROXY_USER,
         "password": process.env.PROXY_PASS
       }
     }
   }
   ```

2. **VPN Usage**
   - Route AI traffic through VPN
   - Use split tunneling carefully
   - Verify no DNS leaks

## Audit and Compliance

### Logging and Monitoring

#### Audit Trail Configuration

1. **Comprehensive Logging**
   ```javascript
   {
     "audit": {
       "log_all_ai_requests": true,
       "log_note_access": true,
       "log_tool_execution": true,
       "retention_days": 90
     }
   }
   ```

2. **Access Reports**
   ```javascript
   // Generate AI access report
   async function generateAIAuditReport() {
     const logs = await api.getAIAccessLogs();
     return {
       total_requests: logs.length,
       unique_notes_accessed: new Set(logs.map(l => l.noteId)).size,
       providers_used: groupBy(logs, 'provider'),
       tools_executed: filterTools(logs),
       sensitive_access: logs.filter(l => l.sensitive)
     };
   }
   ```

### Compliance Considerations

#### GDPR Compliance

1. **Data Minimization**
   - Send only necessary data
   - Implement retention policies
   - Enable data deletion

2. **User Rights**
   ```javascript
   // Export AI-related data
   async function exportAIData(userId) {
     return {
       conversations: await getConversations(userId),
       embeddings: await getEmbeddings(userId),
       preferences: await getAIPreferences(userId)
     };
   }
   
   // Delete AI data
   async function deleteAIData(userId) {
     await deleteConversations(userId);
     await deleteEmbeddings(userId);
     await clearAICache(userId);
   }
   ```

#### HIPAA Considerations

For healthcare data:

1. **Use Business Associate Agreements (BAA)**
   - OpenAI: Available for enterprise
   - Anthropic: Contact for BAA
   - Ollama: No BAA needed (local)

2. **Additional Safeguards**
   ```javascript
   {
     "hipaa": {
       "enabled": true,
       "deidentify": true,
       "audit_level": "maximum",
       "encryption": "aes-256"
     }
   }
   ```

## Security Best Practices Checklist

### Initial Setup

- [ ] Review and understand provider privacy policies
- [ ] Use strong, unique API keys
- [ ] Enable HTTPS/TLS verification
- [ ] Configure appropriate model selection
- [ ] Set up exclusion labels for sensitive notes
- [ ] Test security configuration

### Ongoing Maintenance

- [ ] Regularly rotate API keys (monthly)
- [ ] Review audit logs (weekly)
- [ ] Update excluded notes list
- [ ] Monitor usage and costs
- [ ] Check for security updates
- [ ] Verify no sensitive data in logs

### Incident Response

#### Data Exposure Response

1. **Immediate Actions**
   ```bash
   # Revoke potentially compromised keys
   # OpenAI Dashboard → API Keys → Revoke
   
   # Disable AI features temporarily
   # Settings → AI/LLM → Disable
   ```

2. **Investigation**
   ```javascript
   // Check what was accessed
   const exposedData = await api.getAILogs({
     startDate: incidentTime,
     endDate: now
   });
   ```

3. **Remediation**
   - Generate new API keys
   - Update security configuration
   - Add additional exclusions
   - Document incident

## Privacy-First Configuration Examples

### Maximum Privacy Setup (Local Only)

```javascript
{
  "ai": {
    "provider": "ollama",
    "base_url": "http://localhost:11434",
    "models": {
      "chat": "llama3:7b",
      "embedding": "mxbai-embed-large"
    },
    "network": {
      "allow_external": false,
      "localhost_only": true
    },
    "privacy": {
      "telemetry": false,
      "analytics": false,
      "crash_reports": false
    }
  }
}
```

### Balanced Security Setup

```javascript
{
  "ai": {
    "provider": "openai",
    "security": {
      "api_key_rotation": 30,
      "content_filtering": true,
      "audit_logging": true
    },
    "privacy": {
      "exclude_patterns": ["personal", "confidential"],
      "max_context_age": 7,  // Days
      "clear_cache_on_exit": true
    },
    "compliance": {
      "gdpr_mode": true,
      "data_retention": 30,
      "user_consent_required": true
    }
  }
}
```

### High-Security Enterprise Setup

```javascript
{
  "ai": {
    "provider": "azure-openai",  // Private instance
    "security": {
      "private_endpoint": true,
      "client_certificates": true,
      "ip_whitelist": ["10.0.0.0/8"],
      "mfa_required": true
    },
    "audit": {
      "siem_integration": true,
      "log_format": "cef",
      "forward_to": "syslog://siem.company.com"
    },
    "dlp": {
      "enabled": true,
      "scan_content": true,
      "block_sensitive": true,
      "alert_security_team": true
    }
  }
}
```

## Recommendations by Use Case

### Personal Knowledge Base
- Use Ollama for maximum privacy
- Enable exclusion labels
- Regular key rotation if using cloud
- Minimal logging

### Professional/Business Use
- Use enterprise API tiers
- Implement audit logging
- Configure DLP rules
- Use VPN or proxy
- Regular security reviews

### Regulated Industries
- Local AI only (Ollama)
- Or use compliant providers with BAA
- Maximum audit logging
- Encryption at rest and in transit
- Regular compliance audits

### Academic/Research
- Balance between capability and privacy
- Exclude unpublished research
- Use institutional credentials
- Follow data governance policies

## Conclusion

Security and privacy in AI features require ongoing attention and configuration appropriate to your use case. Start with the most restrictive settings and gradually relax them as you understand the implications. When in doubt, prefer local processing with Ollama over cloud providers for sensitive data.