# Protected Notes and Encryption System

Trilium's Protected Notes system provides robust, selective encryption for sensitive content using industry-standard AES encryption with scrypt-based key derivation. This guide covers setup, usage, and security considerations.

## Architecture Overview

### Encryption Stack

- **Cipher**: AES-128-CBC (Advanced Encryption Standard, Cipher Block Chaining mode)
- **Key Derivation**: Scrypt (N=16384, r=8, p=1) with random salt
- **Integrity Protection**: SHA-1 digest verification
- **Encoding**: Base64 for storage and transmission

### Key Hierarchy

```
Master Password (User Input)
    ↓
Password-Derived Key (Scrypt + Salt)
    ↓
Encrypted Data Key (AES-128-CBC)
    ↓
Session Data Key (In Memory)
    ↓
Protected Content (AES-128-CBC)
```

## Setting Up Protected Notes

### Initial Configuration

1. **Set Master Password**
   - Access via Options → Security → Password
   - Minimum 8 characters (recommend 12+)
   - Use unique, complex password

2. **Configure Session Settings**
   - Session timeout (default: 10 minutes)
   - Auto-logout on inactivity
   - Multi-client session handling

3. **Security Options**
   - Password strength requirements
   - Session notification preferences
   - Audit logging settings

### Creating Protected Notes

#### Method 1: Right-Click Menu
1. Right-click any note in the tree
2. Select "Toggle Protected Status"
3. Confirm protection in dialog

#### Method 2: Note Actions Menu
1. Open note editor
2. Click Actions button (⚙️)
3. Select "Protect this note"

#### Method 3: Keyboard Shortcut
1. Select note
2. Press `Ctrl+Shift+U` (toggle protection)

### Bulk Protection

Protect multiple notes simultaneously:

1. **Subtree Protection**
   - Right-click parent note
   - Select "Protect subtree"
   - All child notes become protected

2. **Batch Selection**
   - Use Ctrl+click to select multiple notes
   - Right-click → "Protect selected notes"

## Protected Sessions

### Session Lifecycle

#### Entering Protected Session

**Method 1: Manual Entry**
```
1. Click shield icon in toolbar
2. Enter master password
3. Session activates (shield turns green)
```

**Method 2: Automatic Prompt**
```
1. Access protected note
2. Password dialog appears
3. Enter credentials to continue
```

**Method 3: Keyboard Shortcut**
```
Press Ctrl+Shift+P to enter protected session
```

#### Session Management

- **Active Session**: Shield icon green, protected content accessible
- **Session Timeout**: Configurable (60-3600 seconds)
- **Activity Tracking**: Timeout resets with each protected note access
- **Multi-Client**: Independent sessions per browser/client

#### Leaving Protected Session

**Manual Logout**:
- Click green shield icon
- Select "Leave protected session"

**Automatic Logout**:
- Inactivity timeout
- Browser/application close
- Security state changes

### Session Security Features

#### Timeout Configuration

```typescript
// Access via Options → Protected Session
protectedSessionTimeout: number  // seconds (default: 600)
protectedSessionWarning: boolean // show timeout warnings
```

#### Security Events

- Session entry/exit logged
- Failed authentication attempts tracked
- Unusual access patterns detected
- Audit trail maintained

## Encryption Technical Details

### Encryption Process Flow

```
Plaintext Data
    ↓
1. Compute SHA-1 digest (integrity check)
    ↓
2. Prepend digest (4 bytes) to plaintext
    ↓
3. Generate random IV (16 bytes)
    ↓
4. Encrypt with AES-128-CBC (data key + IV)
    ↓
5. Prepend IV to encrypted data
    ↓
6. Encode as Base64
    ↓
Stored Ciphertext
```

### Decryption Process Flow

```
Base64 Ciphertext
    ↓
1. Decode from Base64
    ↓
2. Extract IV (first 16 bytes)
    ↓
3. Extract encrypted data (remaining bytes)
    ↓
4. Decrypt with AES-128-CBC (data key + IV)
    ↓
5. Extract digest (first 4 bytes) and plaintext
    ↓
6. Verify digest matches computed SHA-1
    ↓
Verified Plaintext Data
```

### Key Derivation Details

#### Scrypt Parameters

```typescript
const scryptParams = {
    N: 16384,    // CPU/memory cost (2^14)
    r: 8,        // Block size parameter
    p: 1,        // Parallelization parameter
    dkLen: 32    // Derived key length (bytes)
};
```

#### Salt Generation

- **Password Salt**: 32-byte random salt for password verification
- **Data Key Salt**: 32-byte random salt for data key encryption
- **Cryptographic Quality**: Node.js crypto.randomBytes()

#### Key Storage

```sql
-- Options table entries
INSERT INTO options VALUES 
('passwordVerificationSalt', '<32-byte-salt>'),
('passwordDerivedKeySalt', '<32-byte-salt>'),
('passwordVerificationHash', '<scrypt-hash>'),
('encryptedDataKey', '<encrypted-key>');
```

## Security Considerations

### Threat Model

#### Protected Against

✅ **Database Theft**: Encrypted content unreadable without password
✅ **Backup Compromise**: Encrypted backups maintain protection
✅ **Network Interception**: Data encrypted at rest and in transit
✅ **Server Breach**: Server never stores plaintext of protected content
✅ **Physical Storage Access**: Database files encrypted

#### Not Protected Against

❌ **Keyloggers**: Malware capturing password input
❌ **Memory Dumps**: Active sessions store keys in memory
❌ **Screen Capture**: Displayed content vulnerable
❌ **Social Engineering**: User convinced to reveal password
❌ **Endpoint Compromise**: Malware on user device

### Security Limitations

#### Metadata Exposure

- **Note Structure**: Tree hierarchy visible
- **Timestamps**: Creation/modification dates unencrypted
- **Note IDs**: Internal identifiers exposed
- **Attributes**: Some metadata may be unencrypted

#### Search Limitations

- **Full-text Search**: Protected content excluded from search index
- **Cross-references**: Links to protected notes may be limited
- **Content Analysis**: Automated analysis features disabled

### Best Practices

#### Password Management

1. **Strong Passwords**
   - Minimum 12 characters
   - Mix of letters, numbers, symbols
   - Avoid common patterns

2. **Password Storage**
   - Use reputable password manager
   - Store recovery information securely
   - Don't reuse passwords

3. **Regular Updates**
   - Change password periodically
   - Update after suspected compromise
   - Coordinate with team members

#### Session Management

1. **Timeout Configuration**
   - Set appropriate timeout for usage pattern
   - Shorter timeouts for sensitive environments
   - Balance security with usability

2. **Access Control**
   - Lock workstation when away
   - Use screen savers with password
   - Log out of shared computers

3. **Multi-Device Usage**
   - Use consistent passwords across devices
   - Monitor active sessions
   - Revoke compromised device access

## Troubleshooting

### Common Issues

#### Decryption Failures

**Error**: "Could not decrypt string"

**Causes**:
- Incorrect password
- Corrupted encrypted data
- Database schema issues
- Memory corruption

**Solutions**:
```bash
# Check database integrity
sqlite3 document.db "PRAGMA integrity_check;"

# Verify options table
sqlite3 document.db "SELECT name, length(value) FROM options WHERE name LIKE 'password%';"

# Test password verification
# (In protected session troubleshooting)
```

#### Session Problems

**Error**: Protected session won't start

**Diagnostic Steps**:
1. Check browser console for JavaScript errors
2. Verify network connectivity
3. Review server logs for authentication errors
4. Test with fresh browser session

**Solutions**:
```bash
# Clear browser data
# Restart Trilium server
# Check file permissions on database
# Verify encryption keys in options table
```

#### Performance Issues

**Symptoms**: Slow password verification, high CPU usage

**Optimization**:
```typescript
// Advanced users only - modify scrypt parameters
const optimizedParams = {
    N: 8192,     // Reduce for faster verification
    r: 8,        // Keep default
    p: 1         // Keep default
};
```

**Hardware Recommendations**:
- Minimum 4GB RAM for scrypt operations
- Modern CPU with AES-NI support
- SSD storage for database files

### Recovery Procedures

#### Forgotten Password

**No Built-in Recovery**: Trilium cannot recover forgotten passwords

**Options**:
1. **Restore from Backup**: Use backup with known password
2. **Partial Recovery**: Export unprotected content
3. **Complete Reset**: Lose all protected content

```bash
# Reset password (loses all protected content)
sqlite3 document.db "
UPDATE options SET value = '' WHERE name IN (
    'passwordVerificationSalt',
    'passwordDerivedKeySalt', 
    'passwordVerificationHash',
    'encryptedDataKey'
);
"
```

#### Data Corruption

**Corruption Detection**:
- Decryption failures
- Database integrity errors
- Inconsistent note content

**Recovery Steps**:
1. Stop Trilium application
2. Create backup of current database
3. Run database integrity check
4. Restore from known good backup
5. Compare and merge changes if needed

```bash
# Database integrity check
sqlite3 document.db "PRAGMA integrity_check;"

# Quick corruption check
sqlite3 document.db "SELECT COUNT(*) FROM notes WHERE isProtected = 1;"
```

## Performance Optimization

### System Requirements

#### Minimum Requirements
- **CPU**: 1GHz processor with AES support
- **RAM**: 2GB available memory
- **Storage**: 100MB free disk space
- **Network**: Stable connection for sync

#### Recommended Configuration
- **CPU**: Multi-core processor with AES-NI
- **RAM**: 8GB+ for large datasets
- **Storage**: SSD for database files
- **Network**: Broadband for sync operations

### Performance Tuning

#### Database Optimization

```sql
-- Optimize database performance
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = MEMORY;
```

#### Memory Management

- **Session Caching**: Keep frequently accessed protected notes in memory
- **Garbage Collection**: Clear old session data regularly
- **Resource Monitoring**: Monitor memory usage patterns

#### Network Optimization

- **Compression**: Enable content compression
- **Caching**: Use appropriate cache headers
- **Connection Pooling**: Optimize database connections

## Compliance and Auditing

### Encryption Standards

#### Algorithm Compliance
- **AES-128**: NIST approved, FIPS 140-2 Level 1
- **Scrypt**: RFC 7914 standard
- **SHA-1**: NIST standard (integrity only)

#### Key Management
- **Generation**: Cryptographically secure random number generator
- **Storage**: Encrypted at rest
- **Transmission**: Never transmitted in plaintext
- **Destruction**: Securely cleared from memory

### Audit Requirements

#### Logging Events
```typescript
// Security events logged
enum AuditEvents {
    PROTECTED_SESSION_START = 'protected_session_start',
    PROTECTED_SESSION_END = 'protected_session_end',
    PROTECTED_NOTE_ACCESS = 'protected_note_access',
    ENCRYPTION_FAILURE = 'encryption_failure',
    DECRYPTION_FAILURE = 'decryption_failure',
    PASSWORD_CHANGE = 'password_change'
}
```

#### Compliance Reports
- Authentication success/failure rates
- Protected content access patterns
- Security event timelines
- Performance metrics

### Regulatory Considerations

#### GDPR Compliance
- **Data Protection**: AES encryption provides technical safeguards
- **Right to Erasure**: Secure deletion of encryption keys
- **Data Portability**: Export capabilities for protected content
- **Privacy by Design**: Encryption built into architecture

#### HIPAA Requirements
- **Administrative Safeguards**: Access controls and audit trails
- **Physical Safeguards**: Workstation security recommendations
- **Technical Safeguards**: AES encryption meets requirements

#### Industry Standards
- **ISO 27001**: Information security management
- **SOC 2**: Security and availability controls
- **PCI DSS**: Data protection requirements

## Advanced Configuration

### Custom Encryption Parameters

**Warning**: Modifying encryption parameters requires expert knowledge and may break compatibility with future versions.

```typescript
// File: apps/server/src/services/encryption/my_scrypt.ts
const customScryptParams = {
    N: 32768,    // Higher security (slower)
    r: 8,        // Block size
    p: 2         // Parallel processing
};
```

### Integration Examples

#### Backend Script Access

```javascript
// Accessing protected notes in backend scripts
const protectedNote = api.getNote(noteId);

if (protectedNote.isProtected) {
    // Content is encrypted unless in protected session
    if (api.isProtectedSessionAvailable()) {
        const content = protectedNote.getContent();
        // Process decrypted content
    } else {
        // Request protected session
        throw new Error('Protected session required');
    }
}
```

#### API Integration

```typescript
// External API access to protected content
const etapiToken = 'your-etapi-token';
const headers = {
    'Authorization': `Bearer ${etapiToken}`,
    'Content-Type': 'application/json'
};

// Note: ETAPI cannot access protected content
// Protected session must be established in web interface
```

## Backup and Migration

### Backup Strategies

#### Complete Database Backup
```bash
# Stop Trilium first
sqlite3 document.db ".backup backup-$(date +%Y%m%d).db"

# Compressed backup
tar czf trilium-backup-$(date +%Y%m%d).tar.gz \
    document.db session_secret.txt config.ini
```

#### Encrypted Backup
```bash
# GPG encrypted backup
tar czf - trilium-data/ | \
gpg --cipher-algo AES256 --compress-algo 1 --symmetric \
--output trilium-backup-$(date +%Y%m%d).tar.gz.gpg
```

#### Protected Content Export
```javascript
// Export during protected session
const protectedNotes = api.getNotesByLabel('#protected');
protectedNotes.forEach(note => {
    if (note.isProtected) {
        const exportData = {
            title: note.title,
            content: note.getContent(),
            attributes: note.getAttributes()
        };
        // Save to secure location
    }
});
```

### Migration Procedures

#### Same-Password Migration
1. Export data from source installation
2. Create fresh installation
3. Set same master password
4. Import exported data
5. Verify protected content access

#### Password Change Migration
1. Enter protected session in source
2. Export all protected content unencrypted
3. Create new installation with new password
4. Import content (will be re-encrypted)
5. Verify all content accessible

#### Cross-Platform Migration
```bash
# Export from source platform
trilium-server --export=/path/to/export.zip

# Import to target platform  
trilium-server --import=/path/to/export.zip
```

Remember: The security of your protected notes depends on maintaining good password practices and following security best practices for your overall system environment.