# Security Architecture

This document provides a comprehensive overview of Trilium's security architecture, including threat models, security boundaries, and implementation details for developers.

## Security Model Overview

### Design Principles

Trilium's security architecture is built on several key principles:

1. **Defense in Depth**: Multiple layers of security controls
2. **Principle of Least Privilege**: Minimal necessary access rights
3. **Secure by Default**: Secure configuration out of the box
4. **Encryption First**: Sensitive data encrypted at rest
5. **Zero Trust**: Verify all requests and access attempts

### Threat Model

#### Assets to Protect

**Primary Assets**:
- User notes and content
- Encrypted data keys
- Authentication credentials
- Session information
- Configuration data

**Secondary Assets**:
- System availability
- Data integrity
- User privacy
- Application functionality

#### Threat Actors

**External Attackers**:
- Network-based attackers
- Malicious web traffic
- Data thieves
- Denial of service attackers

**Internal Threats**:
- Compromised user accounts
- Malicious scripts
- Insider threats
- Accidental disclosure

#### Attack Vectors

**Network Attacks**:
- Man-in-the-middle attacks
- Session hijacking
- Cross-site scripting
- SQL injection attempts

**Application Attacks**:
- Authentication bypass
- Authorization flaws
- Input validation failures
- Business logic exploits

**Data Attacks**:
- Database theft
- Backup compromise
- Memory dumps
- File system access

## Security Boundaries

### Client-Server Boundary

The boundary between client (browser/desktop) and server represents a critical security boundary.

#### Trust Model

```
┌─────────────────┐    HTTPS/WSS     ┌─────────────────┐
│   Client Side   │ ◄────────────── │   Server Side   │
│   (Untrusted)   │                 │   (Trusted)     │
│                 │                 │                 │
│ • User Input    │                 │ • Authentication │
│ • Display Logic │                 │ • Authorization  │
│ • Client State  │                 │ • Data Storage   │
│ • Local Cache   │                 │ • Encryption     │
└─────────────────┘                 └─────────────────┘
```

#### Security Controls

**Client-Side Controls**:
- Input validation (first line of defense)
- XSS prevention
- CSRF token handling
- Secure storage practices

**Server-Side Controls**:
- Authentication verification
- Authorization enforcement
- Input sanitization
- Data encryption
- Audit logging

### Protected Session Boundary

Protected sessions create a security boundary around encrypted content.

#### Session Lifecycle

```
┌─────────────────┐
│  Public Session │ ─────┐
│                 │      │ Enter Password
│ • Unprotected   │      │
│   content only  │      ▼
│                 │ ┌─────────────────┐
└─────────────────┘ │ Protected Session│
                    │                 │
                    │ • Encrypted     │ ◄── Timeout
                    │   content       │
                    │ • Data key      │
                    │   in memory     │
                    └─────────────────┘
```

#### Security Properties

**Inside Protected Session**:
- Data key available in memory
- Encrypted content accessible
- All protected operations allowed
- Session timeout monitoring active

**Outside Protected Session**:
- No data key in memory
- Encrypted content inaccessible
- Protected operations blocked
- Enhanced security posture

### Process Boundary

In multi-process deployments, process boundaries provide additional security.

#### Process Isolation

```
┌─────────────────┐    ┌─────────────────┐
│   Web Process   │    │   Worker Process │
│                 │    │                 │
│ • HTTP handling │    │ • Background    │
│ • Session mgmt  │ ◄──┤   tasks        │
│ • Authentication │    │ • File processing │
│                 │    │ • Maintenance   │
└─────────────────┘    └─────────────────┘
```

## Encryption Architecture

### Key Management Hierarchy

```
                    Master Password
                         │
                         ▼
                Password-Derived Key ◄── Scrypt + Salt
                         │
                         ▼
                    Data Key (encrypted) ──┐
                         │                  │
                         ▼                  │
                Protected Content ◄─────────┘
                    (encrypted)
```

#### Key Derivation Process

1. **Master Password**: User-provided secret
2. **Salt Generation**: Cryptographically secure random salt
3. **Key Derivation**: Scrypt(password, salt, N=16384, r=8, p=1)
4. **Data Key Encryption**: AES-128-CBC(password_key, data_key)
5. **Content Encryption**: AES-128-CBC(data_key, content)

### Encryption Implementation

#### Data Encryption Service

```typescript
// Core encryption interface
interface DataEncryptionService {
    encrypt(key: Buffer, plaintext: Buffer | string): string;
    decrypt(key: Buffer, ciphertext: string): Buffer | false | null;
    decryptString(key: Buffer, ciphertext: string): string | null;
}
```

#### Encryption Process Flow

```
Plaintext → SHA-1 Digest → Prepend → AES-128-CBC → Base64 → Ciphertext
              (4 bytes)     to data     Encrypt     Encode
                              ↓
                        Random IV (16 bytes)
```

#### Decryption Process Flow

```
Ciphertext → Base64 → Extract IV → AES-128-CBC → Extract → Verify → Plaintext
            Decode   & Encrypted    Decrypt     Digest   Digest
                        Data                   & Data
```

## Authentication Architecture

### Multi-Factor Authentication Flow

```
┌─────────────────┐
│ Password Auth   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐
│ Primary Factor  │    │ Secondary Factor │
│ Verified        │ ──▶│ Required        │
│                 │    │                 │
│ • Password      │    │ • TOTP Code     │
│ • Hash Check    │    │ • Recovery Code │
└─────────────────┘    └─────────┬───────┘
                                 │
                                 ▼
                       ┌─────────────────┐
                       │ Session Created │
                       │                 │
                       │ • Authenticated │
                       │ • State Tracked │
                       └─────────────────┘
```

### TOTP Implementation

#### Secret Generation and Storage

```typescript
interface TOTPSecurity {
    // Secret generation
    generateSecret(): string;           // Base32-encoded secret
    
    // Encrypted storage
    setTotpSecret(secret: string): void;    // Encrypt and store
    getTotpSecret(): string | null;         // Decrypt and return
    
    // Verification
    verifyTotpSecret(secret: string): boolean;  // Hash comparison
    validateTOTP(code: string): boolean;        // Time-based validation
}
```

#### Recovery Code System

```typescript
interface RecoveryCodeSystem {
    // Code generation
    generateRecoveryCodes(): string[];      // Base64 codes
    
    // Encrypted storage  
    setRecoveryCodes(codes: string[]): void; // AES-256-CBC
    getRecoveryCodes(): string[];           // Decrypt and return
    
    // Usage tracking
    verifyRecoveryCode(code: string): boolean;  // One-time use
    markCodeUsed(code: string): void;          // Replace with timestamp
}
```

## Session Management Architecture

### Session Storage

#### Database Schema

```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,        -- Session identifier
    expires INTEGER NOT NULL,   -- Expiration timestamp
    data TEXT NOT NULL         -- JSON session data
);

CREATE INDEX idx_sessions_expires ON sessions(expires);
```

#### Session Data Structure

```typescript
interface SessionData {
    loggedIn: boolean;              // Authentication status
    lastAuthState: {                // Previous auth configuration
        totpEnabled: boolean;
        ssoEnabled: boolean;
    };
    protectedSession?: {            // Protected session state
        active: boolean;
        lastActivity: number;
    };
    csrf?: string;                  // CSRF token
}
```

### Session Security Controls

#### Session Creation

1. **Secure ID Generation**: Cryptographically secure random session IDs
2. **Expiration Setting**: Configurable session timeouts
3. **State Initialization**: Secure default session state
4. **Database Storage**: Atomic session creation

#### Session Validation

1. **ID Verification**: Validate session ID format and existence
2. **Expiration Check**: Verify session hasn't expired
3. **State Validation**: Check authentication and authorization state
4. **Security Context**: Validate security configuration consistency

#### Session Cleanup

1. **Automatic Expiration**: Remove expired sessions periodically
2. **Manual Cleanup**: Explicit session termination
3. **Security Events**: Force cleanup on security state changes
4. **Database Maintenance**: Optimize session storage

### CSRF Protection Architecture

#### Double Submit Cookie Pattern

```
┌─────────────────┐    Token in Cookie     ┌─────────────────┐
│     Client      │ ◄─────────────────────│     Server      │
│                 │                       │                 │
│ • Store token   │    Token in Header    │ • Generate      │
│ • Send header   │ ─────────────────────▶│ • Validate      │
│                 │                       │ • Compare       │
└─────────────────┘                       └─────────────────┘
```

#### Token Lifecycle

1. **Generation**: Create cryptographically secure token
2. **Distribution**: Send token in secure cookie
3. **Validation**: Require token in request headers
4. **Comparison**: Verify cookie and header tokens match
5. **Rotation**: Regenerate tokens periodically

## Authorization Architecture

### Access Control Model

Trilium uses a simplified access control model based on authentication state and note properties.

#### Permission Matrix

```
Operation          │ Public │ Authenticated │ Protected Session
─────────────────────┼────────┼───────────────┼──────────────────
Read Public Notes   │   ✓    │       ✓       │        ✓
Create Notes        │   ✗    │       ✓       │        ✓
Modify Notes        │   ✗    │       ✓       │        ✓
Read Protected      │   ✗    │       ✗       │        ✓
Modify Protected    │   ✗    │       ✗       │        ✓
Admin Operations    │   ✗    │       ✓       │        ✓
```

### API Security

#### Endpoint Protection

```typescript
// Authentication middleware chain
const protectedRoute = [
    checkAuth,              // Verify authentication
    checkApiAuth,           // API-specific checks
    doubleCsrfProtection,   // CSRF protection
    routeHandler            // Business logic
];

// ETAPI token authentication
const etapiRoute = [
    checkEtapiToken,        // Token validation
    rateLimiter,            // Rate limiting
    routeHandler            // Business logic
];
```

#### Input Validation

```typescript
interface InputValidation {
    // Type validation
    validateType(input: any, expectedType: string): boolean;
    
    // Size limits
    validateSize(input: string, maxLength: number): boolean;
    
    // Content sanitization
    sanitizeHTML(input: string): string;
    
    // SQL injection prevention
    parameterizeQuery(query: string, params: any[]): string;
}
```

## Security Event Architecture

### Event Types

#### Authentication Events

```typescript
enum AuthenticationEvents {
    LOGIN_SUCCESS = 'auth.login.success',
    LOGIN_FAILURE = 'auth.login.failure',
    LOGOUT = 'auth.logout',
    MFA_CHALLENGE = 'auth.mfa.challenge',
    MFA_SUCCESS = 'auth.mfa.success',
    MFA_FAILURE = 'auth.mfa.failure',
    PASSWORD_CHANGE = 'auth.password.change'
}
```

#### Session Events

```typescript
enum SessionEvents {
    SESSION_CREATE = 'session.create',
    SESSION_DESTROY = 'session.destroy',
    SESSION_EXPIRE = 'session.expire',
    PROTECTED_ENTER = 'session.protected.enter',
    PROTECTED_EXIT = 'session.protected.exit',
    PROTECTED_TIMEOUT = 'session.protected.timeout'
}
```

#### Security Events

```typescript
enum SecurityEvents {
    CSRF_VIOLATION = 'security.csrf.violation',
    RATE_LIMIT_EXCEEDED = 'security.rate.exceeded',
    INVALID_TOKEN = 'security.token.invalid',
    SUSPICIOUS_ACTIVITY = 'security.suspicious',
    ENCRYPTION_FAILURE = 'security.encryption.failure'
}
```

### Event Processing

#### Event Handler Architecture

```typescript
interface SecurityEventHandler {
    // Event processing
    handleEvent(event: SecurityEvent): void;
    
    // Alert generation
    generateAlert(severity: AlertSeverity, event: SecurityEvent): void;
    
    // Response actions
    executeResponse(event: SecurityEvent, action: ResponseAction): void;
}
```

#### Audit Logging

```typescript
interface AuditLogger {
    // Standard logging
    logEvent(event: SecurityEvent): void;
    
    // Structured logging
    logStructured(level: LogLevel, data: AuditData): void;
    
    // Security-specific logging
    logSecurityEvent(event: SecurityEvent, context: SecurityContext): void;
}
```

## Threat Detection and Response

### Intrusion Detection

#### Behavioral Analysis

1. **Login Pattern Analysis**: Detect unusual login patterns
2. **Session Anomalies**: Identify suspicious session behavior
3. **Access Patterns**: Monitor unusual data access
4. **Rate Limiting**: Detect and prevent abuse

#### Threat Indicators

```typescript
interface ThreatIndicators {
    // Authentication anomalies
    multipleFailedLogins(timeWindow: number, threshold: number): boolean;
    
    // Session anomalies
    sessionHijackingPattern(sessionId: string): boolean;
    
    // Data access anomalies
    unusualDataAccess(userId: string, pattern: AccessPattern): boolean;
    
    // Network anomalies
    suspiciousNetworkActivity(ip: string, pattern: NetworkPattern): boolean;
}
```

### Incident Response

#### Automated Response

1. **Account Lockout**: Temporary account suspension
2. **Session Termination**: Force logout of suspicious sessions
3. **Rate Limiting**: Dynamic rate limit adjustment
4. **Alert Generation**: Notify administrators of threats

#### Response Actions

```typescript
enum ResponseActions {
    LOG_ONLY = 'log',              // Record event only
    ALERT = 'alert',               // Generate alert
    BLOCK_IP = 'block_ip',         // Block source IP
    LOCK_ACCOUNT = 'lock_account', // Suspend account
    FORCE_LOGOUT = 'force_logout', // Terminate sessions
    REQUIRE_MFA = 'require_mfa'    // Force MFA challenge
}
```

## Security Testing

### Security Test Categories

#### Unit Tests

1. **Encryption Tests**: Verify encryption/decryption operations
2. **Authentication Tests**: Test password verification and MFA
3. **Session Tests**: Validate session management
4. **Input Validation Tests**: Test sanitization functions

#### Integration Tests

1. **Authentication Flow**: End-to-end authentication testing
2. **Session Management**: Multi-client session testing
3. **API Security**: Test API authentication and authorization
4. **CSRF Protection**: Validate CSRF token handling

#### Security Tests

1. **Penetration Testing**: Simulated attack scenarios
2. **Vulnerability Scanning**: Automated security scanning
3. **Fuzzing**: Input validation stress testing
4. **Security Code Review**: Manual code analysis

### Test Implementation Examples

#### Encryption Tests

```typescript
describe('Data Encryption Service', () => {
    test('should encrypt and decrypt data correctly', () => {
        const key = crypto.randomBytes(16);
        const plaintext = 'sensitive data';
        
        const encrypted = dataEncryption.encrypt(key, plaintext);
        const decrypted = dataEncryption.decryptString(key, encrypted);
        
        expect(decrypted).toBe(plaintext);
    });
    
    test('should fail with wrong key', () => {
        const key1 = crypto.randomBytes(16);
        const key2 = crypto.randomBytes(16);
        const plaintext = 'sensitive data';
        
        const encrypted = dataEncryption.encrypt(key1, plaintext);
        const decrypted = dataEncryption.decrypt(key2, encrypted);
        
        expect(decrypted).toBe(false);
    });
});
```

#### Authentication Tests

```typescript
describe('TOTP Authentication', () => {
    test('should validate correct TOTP code', () => {
        const secret = totpService.createSecret();
        const code = totp.generate(secret.message);
        
        const isValid = totpService.validateTOTP(code);
        expect(isValid).toBe(true);
    });
    
    test('should reject expired TOTP code', () => {
        const secret = totpService.createSecret();
        const expiredCode = '000000'; // Known invalid code
        
        const isValid = totpService.validateTOTP(expiredCode);
        expect(isValid).toBe(false);
    });
});
```

This security architecture provides a comprehensive foundation for understanding and maintaining Trilium's security posture. Regular review and updates ensure the architecture remains effective against evolving threats.