# Secure Development Guidelines

This document provides comprehensive guidelines for developing secure code within the Trilium codebase, covering secure coding practices, vulnerability prevention, and security testing.

## Secure Coding Principles

### Input Validation and Sanitization

#### Server-Side Validation

Always validate input on the server side, regardless of client-side validation:

```typescript
// Good: Server-side validation with type checking
function validateNoteTitle(title: string): boolean {
    if (typeof title !== 'string') {
        throw new Error('Invalid title type');
    }
    
    if (title.length > 1000) {
        throw new Error('Title too long');
    }
    
    if (title.trim().length === 0) {
        throw new Error('Title cannot be empty');
    }
    
    return true;
}

// Bad: Assuming client validation is sufficient
function saveNote(data: any) {
    // No validation - dangerous!
    sql.execute('INSERT INTO notes (title) VALUES (?)', [data.title]);
}
```

#### HTML Sanitization

Sanitize HTML content to prevent XSS attacks:

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Good: Sanitize HTML content
function sanitizeHTML(content: string): string {
    return DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['p', 'b', 'i', 'u', 'strong', 'em', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['class', 'id'],
        FORBID_SCRIPT: true
    });
}

// Bad: Directly inserting user content
function displayNote(content: string) {
    element.innerHTML = content; // XSS vulnerability
}
```

#### SQL Injection Prevention

Always use parameterized queries:

```typescript
// Good: Parameterized query
function getNoteById(noteId: string) {
    return sql.getRow('SELECT * FROM notes WHERE noteId = ?', [noteId]);
}

// Bad: String concatenation
function getNoteById(noteId: string) {
    return sql.getRow(`SELECT * FROM notes WHERE noteId = '${noteId}'`);
}
```

### Authentication and Authorization

#### Password Handling

Never store passwords in plain text:

```typescript
// Good: Proper password hashing
import passwordEncryption from './encryption/password_encryption.js';

function setPassword(password: string): void {
    if (password.length < 8) {
        throw new Error('Password too short');
    }
    
    const hash = passwordEncryption.hashPassword(password);
    optionService.setOption('passwordHash', hash);
}

// Bad: Plain text password storage
function setPassword(password: string): void {
    optionService.setOption('password', password); // Never do this!
}
```

#### Session Management

Implement secure session handling:

```typescript
// Good: Secure session creation
function createSession(userId: string): string {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + SESSION_TIMEOUT;
    
    sessionStore.set(sessionId, {
        userId,
        expires,
        csrfToken: generateCSRFToken()
    });
    
    return sessionId;
}

// Bad: Predictable session IDs
function createSession(userId: string): string {
    const sessionId = `user_${userId}_${Date.now()}`; // Predictable
    return sessionId;
}
```

### Encryption and Cryptography

#### Key Management

Follow secure key management practices:

```typescript
// Good: Secure key generation and storage
function generateDataKey(): Buffer {
    const key = crypto.randomBytes(32);
    
    // Encrypt with password-derived key before storage
    const encryptedKey = dataEncryption.encrypt(passwordKey, key);
    optionService.setOption('encryptedDataKey', encryptedKey);
    
    return key;
}

// Bad: Hardcoded or weak keys
const SECRET_KEY = 'mySecretKey123'; // Never hardcode keys
```

#### Encryption Implementation

Use proven encryption libraries and algorithms:

```typescript
// Good: Using established encryption
function encryptSensitiveData(data: string, key: Buffer): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
}

// Bad: Custom encryption algorithms
function customEncrypt(data: string): string {
    // Never implement custom encryption
    return data.split('').reverse().join(''); // Terrible encryption
}
```

### Error Handling and Logging

#### Secure Error Messages

Don't leak sensitive information in error messages:

```typescript
// Good: Safe error messages
function authenticateUser(username: string, password: string): boolean {
    const user = getUserByUsername(username);
    
    if (!user || !verifyPassword(password, user.passwordHash)) {
        // Generic error message
        throw new Error('Invalid credentials');
    }
    
    return true;
}

// Bad: Information disclosure
function authenticateUser(username: string, password: string): boolean {
    const user = getUserByUsername(username);
    
    if (!user) {
        throw new Error('User not found'); // Reveals user existence
    }
    
    if (!verifyPassword(password, user.passwordHash)) {
        throw new Error('Invalid password'); // Confirms user exists
    }
    
    return true;
}
```

#### Security Logging

Log security events appropriately:

```typescript
// Good: Security event logging
function logSecurityEvent(event: SecurityEvent): void {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event: event.type,
        severity: event.severity,
        user: event.userId ? hashUserId(event.userId) : 'anonymous',
        ip: hashIP(event.sourceIP),
        details: sanitizeLogData(event.details)
    };
    
    securityLogger.log(logEntry);
}

// Bad: Logging sensitive data
function logSecurityEvent(event: SecurityEvent): void {
    console.log(`User ${event.password} failed login`); // Logs password!
}
```

## Vulnerability Prevention

### Cross-Site Scripting (XSS) Prevention

#### Content Security Policy

Implement and maintain a strict CSP:

```typescript
// Good: Strict CSP configuration
const cspPolicy = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"], // Minimize unsafe-inline
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'"],
    'font-src': ["'self'"],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
    'frame-src': ["'none'"]
};
```

#### Output Encoding

Properly encode output based on context:

```typescript
// Good: Context-aware encoding
function renderNoteTitle(title: string): string {
    return htmlEncode(title); // HTML context
}

function renderJavaScriptData(data: any): string {
    return JSON.stringify(data); // JavaScript context
}

// Bad: No encoding
function renderNoteTitle(title: string): string {
    return title; // Potential XSS
}
```

### Cross-Site Request Forgery (CSRF) Prevention

#### CSRF Token Implementation

Implement proper CSRF protection:

```typescript
// Good: CSRF token validation
function validateCSRFToken(req: Request): boolean {
    const tokenFromHeader = req.headers['x-csrf-token'];
    const tokenFromCookie = req.cookies['_csrf'];
    
    if (!tokenFromHeader || !tokenFromCookie) {
        return false;
    }
    
    return crypto.timingSafeEqual(
        Buffer.from(tokenFromHeader),
        Buffer.from(tokenFromCookie)
    );
}

// Bad: Missing CSRF protection
function processForm(req: Request): void {
    // Process form without CSRF validation - vulnerable!
    updateUserData(req.body);
}
```

### SQL Injection Prevention

#### Parameterized Queries

Always use parameterized queries:

```typescript
// Good: Parameterized query with proper typing
function searchNotes(searchTerm: string, limit: number): Note[] {
    const sql = `
        SELECT noteId, title, content 
        FROM notes 
        WHERE title LIKE ? 
        ORDER BY dateModified DESC 
        LIMIT ?
    `;
    
    return db.getRows(sql, [`%${searchTerm}%`, limit]);
}

// Bad: Dynamic query construction
function searchNotes(searchTerm: string, limit: number): Note[] {
    const sql = `
        SELECT noteId, title, content 
        FROM notes 
        WHERE title LIKE '%${searchTerm}%' 
        ORDER BY dateModified DESC 
        LIMIT ${limit}
    `;
    
    return db.getRows(sql); // SQL injection vulnerability
}
```

### Path Traversal Prevention

#### File Access Controls

Validate and restrict file access:

```typescript
// Good: Safe file access
function getAttachment(attachmentId: string): Buffer {
    // Validate attachment ID format
    if (!/^[a-zA-Z0-9_-]+$/.test(attachmentId)) {
        throw new Error('Invalid attachment ID');
    }
    
    const safePath = path.join(ATTACHMENTS_DIR, attachmentId);
    
    // Ensure path is within allowed directory
    if (!safePath.startsWith(ATTACHMENTS_DIR)) {
        throw new Error('Path traversal attempt detected');
    }
    
    return fs.readFileSync(safePath);
}

// Bad: Unsafe file access
function getAttachment(filename: string): Buffer {
    const filePath = path.join(ATTACHMENTS_DIR, filename);
    return fs.readFileSync(filePath); // Path traversal vulnerability
}
```

## Security Testing

### Unit Tests for Security

#### Authentication Tests

```typescript
describe('Authentication Security', () => {
    test('should reject weak passwords', () => {
        expect(() => {
            passwordService.setPassword('123');
        }).toThrow('Password too short');
    });
    
    test('should use timing-safe comparison', () => {
        const validHash = passwordService.hashPassword('correct-password');
        
        const start1 = process.hrtime.bigint();
        passwordService.verifyPassword('wrong-password', validHash);
        const time1 = process.hrtime.bigint() - start1;
        
        const start2 = process.hrtime.bigint();
        passwordService.verifyPassword('correct-password', validHash);
        const time2 = process.hrtime.bigint() - start2;
        
        // Times should be similar (within 10ms)
        const timeDiff = Math.abs(Number(time1 - time2)) / 1000000;
        expect(timeDiff).toBeLessThan(10);
    });
});
```

#### Input Validation Tests

```typescript
describe('Input Validation', () => {
    test('should sanitize HTML content', () => {
        const maliciousHTML = '<script>alert("XSS")</script><p>Safe content</p>';
        const sanitized = htmlSanitizer.sanitize(maliciousHTML);
        
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).toContain('<p>Safe content</p>');
    });
    
    test('should validate note IDs', () => {
        expect(() => {
            noteService.getNote('../../../etc/passwd');
        }).toThrow('Invalid note ID');
        
        expect(() => {
            noteService.getNote('note123');
        }).not.toThrow();
    });
});
```

#### Encryption Tests

```typescript
describe('Encryption Security', () => {
    test('should use different IVs for each encryption', () => {
        const data = 'sensitive information';
        const key = crypto.randomBytes(32);
        
        const encrypted1 = encryptionService.encrypt(key, data);
        const encrypted2 = encryptionService.encrypt(key, data);
        
        expect(encrypted1).not.toBe(encrypted2);
    });
    
    test('should detect tampered ciphertext', () => {
        const data = 'important data';
        const key = crypto.randomBytes(32);
        
        const encrypted = encryptionService.encrypt(key, data);
        const tampered = encrypted.slice(0, -4) + '0000';
        
        expect(() => {
            encryptionService.decrypt(key, tampered);
        }).toThrow('Decryption failed');
    });
});
```

### Integration Security Tests

#### API Security Tests

```typescript
describe('API Security', () => {
    test('should require authentication for protected endpoints', async () => {
        const response = await request(app)
            .get('/api/notes')
            .expect(401);
        
        expect(response.body.error).toBe('Authentication required');
    });
    
    test('should validate CSRF tokens', async () => {
        const session = await createAuthenticatedSession();
        
        const response = await request(app)
            .post('/api/notes')
            .set('Cookie', session.cookie)
            // Missing CSRF token
            .send({ title: 'Test Note' })
            .expect(403);
        
        expect(response.body.error).toBe('CSRF token validation failed');
    });
    
    test('should rate limit API requests', async () => {
        const session = await createAuthenticatedSession();
        
        // Make many requests quickly
        const promises = Array(101).fill(null).map(() =>
            request(app)
                .get('/api/notes')
                .set('Cookie', session.cookie)
                .set('X-CSRF-Token', session.csrfToken)
        );
        
        const responses = await Promise.all(promises);
        const rateLimited = responses.filter(r => r.status === 429);
        
        expect(rateLimited.length).toBeGreaterThan(0);
    });
});
```

### Security Automation

#### Static Analysis Integration

```typescript
// Example ESLint security rules configuration
module.exports = {
    extends: [
        'plugin:security/recommended'
    ],
    rules: {
        'security/detect-sql-injection': 'error',
        'security/detect-xss': 'error',
        'security/detect-eval-with-expression': 'error',
        'security/detect-non-literal-fs-filename': 'error',
        'security/detect-unsafe-regex': 'error'
    }
};
```

#### Dependency Vulnerability Scanning

```bash
# Automated security scanning in CI/CD
npm audit --audit-level moderate
npm run security:check

# Integration with security tools
snyk test
```

## Security Code Review Guidelines

### Review Checklist

#### Authentication and Authorization
- [ ] All endpoints properly authenticate users
- [ ] Authorization checks performed before data access
- [ ] Session management follows security best practices
- [ ] Password policies enforced
- [ ] MFA implementation secure

#### Input Validation
- [ ] All user inputs validated server-side
- [ ] HTML content properly sanitized
- [ ] File uploads restricted and validated
- [ ] SQL queries use parameterized statements
- [ ] Path traversal protection implemented

#### Cryptography
- [ ] Strong encryption algorithms used
- [ ] Keys generated and stored securely
- [ ] Random number generation cryptographically secure
- [ ] Sensitive data encrypted at rest
- [ ] TLS properly configured for data in transit

#### Error Handling
- [ ] Error messages don't leak sensitive information
- [ ] Stack traces not exposed to users
- [ ] Security events properly logged
- [ ] Logs don't contain sensitive data

### Common Security Anti-Patterns

#### Dangerous Patterns to Avoid

```typescript
// Anti-pattern: Eval and dynamic code execution
eval(userInput); // Never do this
Function(userInput)(); // Also dangerous

// Anti-pattern: Weak random number generation
Math.random(); // Not cryptographically secure
new Date().getTime(); // Predictable

// Anti-pattern: Client-side security
if (user.isAdmin) { // Can be bypassed
    showAdminPanel();
}

// Anti-pattern: Trusting user input
const isAdmin = req.body.isAdmin; // User controls this
```

#### Secure Alternatives

```typescript
// Good: Safe alternatives
crypto.randomBytes(32); // Cryptographically secure random
serverSideValidation(input); // Server-side validation
checkPermissionsOnServer(userId); // Server-side authorization
```

## Security Dependencies Management

### Dependency Security

#### Regular Updates

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Automated dependency updates
dependabot configuration in .github/dependabot.yml
```

#### Dependency Validation

```typescript
// Example package-lock.json integrity verification
{
  "name": "trilium",
  "lockfileVersion": 2,
  "requires": true,
  "packages": {
    "node_modules/express": {
      "version": "4.18.2",
      "resolved": "https://registry.npmjs.org/express/-/express-4.18.2.tgz",
      "integrity": "sha512-5/PsL6iGPdfQ/lKM1UuielYgv3BUoJfz1aUwU9vHZ+J7gyvwdQXFEBIEIaxeGf0GIcreATNyBExtalisDbuMqQ=="
    }
  }
}
```

### Third-Party Integration Security

#### API Integration

```typescript
// Good: Secure external API calls
async function callExternalAPI(data: any): Promise<any> {
    const sanitizedData = sanitizeAPIData(data);
    
    const response = await fetch(EXTERNAL_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_TOKEN}`,
            'User-Agent': 'Trilium/1.0'
        },
        body: JSON.stringify(sanitizedData),
        timeout: 10000 // Prevent hanging requests
    });
    
    if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
    }
    
    return response.json();
}
```

## Incident Response for Developers

### Security Incident Handling

#### Immediate Response

1. **Assess Impact**: Determine scope of security issue
2. **Contain Threat**: Implement immediate mitigations
3. **Notify Team**: Alert security team and stakeholders
4. **Document**: Record all actions and findings

#### Code Fixes

```typescript
// Example security patch process
function emergencySecurityPatch() {
    // 1. Identify vulnerable code
    const vulnerableFunction = identifyVulnerability();
    
    // 2. Implement fix
    const securedFunction = applySecurityFix(vulnerableFunction);
    
    // 3. Test fix
    runSecurityTests(securedFunction);
    
    // 4. Deploy immediately
    deployEmergencyPatch(securedFunction);
    
    // 5. Monitor for issues
    monitorPostDeployment();
}
```

### Security Communication

#### Internal Communication

```typescript
interface SecurityIncident {
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedSystems: string[];
    mitigationSteps: string[];
    timeline: {
        discovered: Date;
        patched: Date;
        verified: Date;
    };
}
```

This comprehensive guide provides the foundation for secure development practices within Trilium. Regular training and code reviews ensure these practices are consistently applied across the development team.