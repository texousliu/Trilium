# Trilium Security Architecture

> **Related:** [ARCHITECTURE.md](ARCHITECTURE.md) | [SECURITY.md](../SECURITY.md)

## Overview

Trilium implements a **defense-in-depth security model** with multiple layers of protection for user data. The security architecture covers authentication, authorization, encryption, input sanitization, and secure communication.

## Security Principles

1. **Data Privacy**: User data is protected at rest and in transit
2. **Encryption**: Per-note encryption for sensitive content
3. **Authentication**: Multiple authentication methods supported
4. **Authorization**: Single-user model with granular protected sessions
5. **Input Validation**: All user input sanitized
6. **Secure Defaults**: Security features enabled by default
7. **Transparency**: Open source allows security audits

## Threat Model

### Threats Considered

1. **Unauthorized Access**
   - Physical access to device
   - Network eavesdropping
   - Stolen credentials
   - Session hijacking

2. **Data Exfiltration**
   - Malicious scripts
   - XSS attacks
   - SQL injection
   - CSRF attacks

3. **Data Corruption**
   - Malicious modifications
   - Database tampering
   - Sync conflicts

4. **Privacy Leaks**
   - Unencrypted backups
   - Search indexing
   - Temporary files
   - Memory dumps

### Out of Scope

- Nation-state attackers
- Zero-day vulnerabilities in dependencies
- Hardware vulnerabilities (Spectre, Meltdown)
- Physical access with unlimited time
- Quantum computing attacks

## Authentication

### Password Authentication

**Implementation:** `apps/server/src/services/password.ts`

**Password Storage:**
```typescript
// Password is never stored directly
const salt = crypto.randomBytes(32)
const derivedKey = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256')
const verificationHash = crypto.createHash('sha256')
    .update(derivedKey)
    .digest('hex')

// Store only salt and verification hash
sql.insert('user_data', {
    salt: salt.toString('hex'),
    derivedKey: derivedKey.toString('hex')  // Used for encryption
})

sql.insert('options', {
    name: 'passwordVerificationHash',
    value: verificationHash
})
```

**Password Requirements:**
- Minimum length: 4 characters (configurable)
- No maximum length
- All characters allowed
- Can be changed by user

**Login Process:**
```typescript
// 1. User submits password
POST /api/login/password
Body: { password: "user-password" }

// 2. Server derives key
const derivedKey = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256')

// 3. Verify against stored hash
const verificationHash = crypto.createHash('sha256')
    .update(derivedKey)
    .digest('hex')

if (verificationHash === storedHash) {
    // 4. Create session
    req.session.loggedIn = true
    req.session.regenerate()
}
```

### TOTP (Two-Factor Authentication)

**Implementation:** `apps/server/src/routes/api/login.ts`

**Setup Process:**
```typescript
// 1. Generate secret
const secret = speakeasy.generateSecret({
    name: `Trilium (${username})`,
    length: 32
})

// 2. Store encrypted secret
const encryptedSecret = encrypt(secret.base32, dataKey)
sql.insert('options', {
    name: 'totpSecret',
    value: encryptedSecret
})

// 3. Generate QR code
const qrCodeUrl = secret.otpauth_url
```

**Verification:**
```typescript
// User submits TOTP token
POST /api/login/totp
Body: { token: "123456" }

// Verify token
const secret = decrypt(encryptedSecret, dataKey)
const verified = speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1  // Allow 1 time step tolerance
})
```

### OpenID Connect

**Implementation:** `apps/server/src/routes/api/login.ts`

**Supported Providers:**
- Any OpenID Connect compatible provider
- Google, GitHub, Auth0, etc.

**Flow:**
```typescript
// 1. Redirect to provider
GET /api/login/openid

// 2. Provider redirects back with code
GET /api/login/openid/callback?code=...

// 3. Exchange code for tokens
const tokens = await openidClient.callback(redirectUri, req.query)

// 4. Verify ID token
const claims = tokens.claims()

// 5. Create session
req.session.loggedIn = true
```

### Session Management

**Session Storage:** SQLite database (sessions table)

**Session Configuration:**
```typescript
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
        httpOnly: true,
        secure: isHttps,
        sameSite: 'lax'
    },
    store: new SqliteStore({
        db: db,
        table: 'sessions'
    })
}))
```

**Session Invalidation:**
- Automatic timeout after inactivity
- Manual logout clears session
- Server restart invalidates all sessions (optional)

## Authorization

### Single-User Model

**Desktop:**
- Single user (owner of device)
- No multi-user support
- Full access to all notes

**Server:**
- Single user per installation
- Authentication required for all operations
- No user roles or permissions

### Protected Sessions

**Purpose:** Temporary access to encrypted (protected) notes

**Implementation:** `apps/server/src/services/protected_session.ts`

**Workflow:**
```typescript
// 1. User enters password for protected notes
POST /api/protected-session/enter
Body: { password: "protected-password" }

// 2. Derive encryption key
const protectedDataKey = deriveKey(password)

// 3. Verify password (decrypt known encrypted value)
const decrypted = decrypt(testValue, protectedDataKey)
if (decrypted === expectedValue) {
    // 4. Store in memory (not in session)
    protectedSessionHolder.setProtectedDataKey(protectedDataKey)
    
    // 5. Set timeout
    setTimeout(() => {
        protectedSessionHolder.clearProtectedDataKey()
    }, timeout)
}
```

**Protected Session Timeout:**
- Default: 10 minutes (configurable)
- Extends on activity
- Cleared on browser close
- Separate from main session

### API Authorization

**Internal API:**
- Requires authenticated session
- CSRF token validation
- Same-origin policy

**ETAPI (External API):**
- Token-based authentication
- No session required
- Rate limiting

## Encryption

### Note Encryption

**Encryption Algorithm:** AES-256-CBC

**Key Hierarchy:**
```
User Password
    ↓ (PBKDF2)
Data Key (for protected notes)
    ↓ (AES-256)
Protected Note Content
```

**Encryption Process:**
```typescript
// 1. Generate IV (initialization vector)
const iv = crypto.randomBytes(16)

// 2. Encrypt content
const cipher = crypto.createCipheriv('aes-256-cbc', dataKey, iv)
let encrypted = cipher.update(content, 'utf8', 'base64')
encrypted += cipher.final('base64')

// 3. Prepend IV to encrypted content
const encryptedBlob = iv.toString('base64') + ':' + encrypted

// 4. Store in database
sql.insert('blobs', {
    blobId: blobId,
    content: encryptedBlob
})
```

**Decryption Process:**
```typescript
// 1. Split IV and encrypted content
const [ivBase64, encryptedData] = encryptedBlob.split(':')
const iv = Buffer.from(ivBase64, 'base64')

// 2. Decrypt
const decipher = crypto.createDecipheriv('aes-256-cbc', dataKey, iv)
let decrypted = decipher.update(encryptedData, 'base64', 'utf8')
decrypted += decipher.final('utf8')

return decrypted
```

**Protected Note Metadata:**
- Title is NOT encrypted (for tree display)
- Type and MIME are NOT encrypted
- Content IS encrypted
- Attributes CAN be encrypted (optional)

### Data Key Management

**Master Data Key:**
```typescript
// Generated once during setup
const dataKey = crypto.randomBytes(32)  // 256 bits

// Encrypted with derived key from user password
const derivedKey = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256')
const encryptedDataKey = encrypt(dataKey, derivedKey)

// Stored in database
sql.insert('options', {
    name: 'encryptedDataKey',
    value: encryptedDataKey.toString('hex')
})
```

**Key Rotation:**
- Not currently supported
- Requires re-encrypting all protected notes
- Planned for future version

### Transport Encryption

**HTTPS:**
- Required for server installations (recommended)
- TLS 1.2+ only
- Strong cipher suites preferred
- Certificate validation enabled

**Desktop:**
- Local communication (no network)
- No HTTPS required

### Backup Encryption

**Database Backups:**
- Protected notes remain encrypted in backup
- Backup file should be protected separately
- Consider encrypting backup storage location

## Input Sanitization

### XSS Prevention

**HTML Sanitization:**

Location: `apps/client/src/services/dompurify.ts`

```typescript
import DOMPurify from 'dompurify'

// Configure DOMPurify
DOMPurify.setConfig({
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'div', ...],
    ALLOWED_ATTR: ['href', 'title', 'class', 'id', ...],
    ALLOW_DATA_ATTR: false
})

// Sanitize HTML before rendering
const cleanHtml = DOMPurify.sanitize(userHtml)
```

**CKEditor Configuration:**
```typescript
// apps/client/src/widgets/type_widgets/text_type_widget.ts
ClassicEditor.create(element, {
    // Restrict allowed content
    htmlSupport: {
        allow: [
            { name: /./, attributes: true, classes: true, styles: true }
        ],
        disallow: [
            { name: 'script' },
            { name: 'iframe', attributes: /^(?!src$).*/ }
        ]
    }
})
```

**Content Security Policy:**
```typescript
// apps/server/src/main.ts
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob:;"
    )
    next()
})
```

### SQL Injection Prevention

**Parameterized Queries:**
```typescript
// GOOD - Safe from SQL injection
const notes = sql.getRows(
    'SELECT * FROM notes WHERE title = ?',
    [userInput]
)

// BAD - Vulnerable to SQL injection
const notes = sql.getRows(
    `SELECT * FROM notes WHERE title = '${userInput}'`
)
```

**ORM Usage:**
```typescript
// Entity-based access prevents SQL injection
const note = becca.getNote(noteId)
note.title = userInput  // Sanitized by entity
note.save()  // Parameterized query
```

### CSRF Prevention

**CSRF Token Validation:**

Location: `apps/server/src/routes/middleware/csrf.ts`

```typescript
// Generate CSRF token
const csrfToken = crypto.randomBytes(32).toString('hex')
req.session.csrfToken = csrfToken

// Validate on state-changing requests
app.use((req, res, next) => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        const token = req.headers['x-csrf-token']
        if (token !== req.session.csrfToken) {
            return res.status(403).json({ error: 'CSRF token mismatch' })
        }
    }
    next()
})
```

**Client-Side:**
```typescript
// apps/client/src/services/server.ts
const csrfToken = getCsrfToken()

fetch('/api/notes', {
    method: 'POST',
    headers: {
        'X-CSRF-Token': csrfToken,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
})
```

### File Upload Validation

**Validation:**
```typescript
// apps/server/src/routes/api/attachments.ts
const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    // ...
]

if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error('File type not allowed')
}

// Validate file size
const maxSize = 100 * 1024 * 1024  // 100 MB
if (file.size > maxSize) {
    throw new Error('File too large')
}

// Sanitize filename
const sanitizedFilename = path.basename(file.originalname)
    .replace(/[^a-z0-9.-]/gi, '_')
```

## Network Security

### HTTPS Configuration

**Server Setup:**
```typescript
// apps/server/src/main.ts
const httpsOptions = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
}

https.createServer(httpsOptions, app).listen(443)
```

**Certificate Validation:**
- Require valid certificates in production
- Self-signed certificates allowed for development
- Certificate pinning not implemented

### Secure Headers

```typescript
// apps/server/src/main.ts
app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    
    // Prevent MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff')
    
    // XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block')
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'same-origin')
    
    // HTTPS upgrade
    if (req.secure) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000')
    }
    
    next()
})
```

### Rate Limiting

**API Rate Limiting:**
```typescript
// apps/server/src/routes/middleware/rate_limit.ts
const rateLimit = require('express-rate-limit')

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 1000,  // Limit each IP to 1000 requests per window
    message: 'Too many requests from this IP'
})

app.use('/api/', apiLimiter)
```

**Login Rate Limiting:**
```typescript
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,  // 5 failed attempts
    skipSuccessfulRequests: true
})

app.post('/api/login/password', loginLimiter, loginHandler)
```

## Data Security

### Secure Data Deletion

**Soft Delete:**
```typescript
// Mark as deleted (sync first)
note.isDeleted = 1
note.deleteId = generateUUID()
note.save()

// Entity change tracked for sync
addEntityChange('notes', noteId, note)
```

**Hard Delete (Erase):**
```typescript
// After sync completed
sql.execute('DELETE FROM notes WHERE noteId = ?', [noteId])
sql.execute('DELETE FROM branches WHERE noteId = ?', [noteId])
sql.execute('DELETE FROM attributes WHERE noteId = ?', [noteId])

// Mark entity change as erased
sql.execute('UPDATE entity_changes SET isErased = 1 WHERE entityId = ?', [noteId])
```

**Blob Cleanup:**
```typescript
// Find orphaned blobs (not referenced by any note/revision/attachment)
const orphanedBlobs = sql.getRows(`
    SELECT blobId FROM blobs
    WHERE blobId NOT IN (SELECT blobId FROM notes WHERE blobId IS NOT NULL)
      AND blobId NOT IN (SELECT blobId FROM revisions WHERE blobId IS NOT NULL)
      AND blobId NOT IN (SELECT blobId FROM attachments WHERE blobId IS NOT NULL)
`)

// Delete orphaned blobs
for (const blob of orphanedBlobs) {
    sql.execute('DELETE FROM blobs WHERE blobId = ?', [blob.blobId])
}
```

### Memory Security

**Protected Data in Memory:**
- Protected data keys stored in memory only
- Cleared on timeout
- Not written to disk
- Not in session storage

**Memory Cleanup:**
```typescript
// Clear sensitive data
const clearSensitiveData = () => {
    protectedDataKey = null
    
    // Force garbage collection if available
    if (global.gc) {
        global.gc()
    }
}
```

### Temporary Files

**Secure Temporary Files:**
```typescript
const tempDir = os.tmpdir()
const tempFile = path.join(tempDir, `trilium-${crypto.randomBytes(16).toString('hex')}`)

// Write temp file
fs.writeFileSync(tempFile, data, { mode: 0o600 })  // Owner read/write only

// Clean up after use
fs.unlinkSync(tempFile)
```

## Dependency Security

### Vulnerability Scanning

**Tools:**
- `npm audit` - Check for known vulnerabilities
- Renovate bot - Automatic dependency updates
- GitHub Dependabot alerts

**Process:**
```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Manual review for breaking changes
npm audit fix --force
```

### Dependency Pinning

**package.json:**
```json
{
  "dependencies": {
    "express": "4.18.2",  // Exact version
    "better-sqlite3": "^9.2.2"  // Compatible versions
  }
}
```

**pnpm Overrides:**
```json
{
  "pnpm": {
    "overrides": {
      "lodash@<4.17.21": ">=4.17.21",  // Force minimum version
      "axios@<0.21.2": ">=0.21.2"
    }
  }
}
```

### Patch Management

**pnpm Patches:**
```bash
# Create patch
pnpm patch @ckeditor/ckeditor5

# Edit files in temporary directory
# ...

# Generate patch file
pnpm patch-commit /tmp/ckeditor5-patch

# Patch applied automatically on install
```

## Security Best Practices

### For Users

1. **Strong Passwords**
   - Use unique password for Trilium
   - Enable TOTP 2FA
   - Protect password manager

2. **Protected Notes**
   - Use for sensitive information
   - Set reasonable session timeout
   - Don't leave sessions unattended

3. **Backups**
   - Regular backups to secure location
   - Encrypt backup storage
   - Test backup restoration

4. **Server Setup**
   - Use HTTPS only
   - Keep software updated
   - Firewall configuration
   - Use reverse proxy (nginx, Caddy)

5. **Scripts**
   - Review scripts before using
   - Be cautious with external scripts
   - Understand script permissions

### For Developers

1. **Code Review**
   - Review all security-related changes
   - Test authentication/authorization changes
   - Validate input sanitization

2. **Testing**
   - Write security tests
   - Test edge cases
   - Penetration testing

3. **Dependencies**
   - Regular updates
   - Audit new dependencies
   - Monitor security advisories

4. **Secrets**
   - No secrets in source code
   - Use environment variables
   - Secure key generation

## Security Auditing

### Logs

**Security Events Logged:**
- Login attempts (success/failure)
- Protected session access
- Password changes
- ETAPI token usage
- Failed CSRF validations

**Log Location:**
- Desktop: Console output
- Server: Log files or stdout

### Monitoring

**Metrics to Monitor:**
- Failed login attempts
- API error rates
- Unusual database changes
- Large exports/imports

## Incident Response

### Security Issue Reporting

**Process:**
1. Email security@triliumnext.com
2. Include vulnerability details
3. Provide reproduction steps
4. Allow reasonable disclosure time

**Response:**
1. Acknowledge within 48 hours
2. Investigate and validate
3. Develop fix
4. Coordinate disclosure
5. Release patch

### Breach Response

**If Compromised:**
1. Change password immediately
2. Review recent activity
3. Check for unauthorized changes
4. Restore from backup if needed
5. Update security settings

## Future Security Enhancements

**Planned:**
- Hardware security key support (U2F/WebAuthn)
- End-to-end encryption for sync
- Zero-knowledge architecture option
- Encryption key rotation
- Audit log enhancements
- Per-note access controls

**Under Consideration:**
- Multi-user support with permissions
- Blockchain-based sync verification
- Homomorphic encryption for search
- Quantum-resistant encryption

---

**See Also:**
- [SECURITY.md](../SECURITY.md) - Security policy
- [ARCHITECTURE.md](ARCHITECTURE.md) - Overall architecture
- [Protected Notes Guide](https://triliumnext.github.io/Docs/Wiki/protected-notes)
