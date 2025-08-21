# Authentication and Access Control Guide

This comprehensive guide covers Trilium's authentication mechanisms, session management, API security, and access control systems. Understanding these systems is crucial for maintaining a secure Trilium installation.

## Authentication Overview

Trilium supports multiple authentication methods designed to provide flexible yet secure access control:

- **Password Authentication**: Primary method using scrypt-hashed passwords
- **Multi-Factor Authentication (MFA)**: TOTP-based secondary authentication
- **Single Sign-On (SSO)**: OpenID Connect integration for enterprise environments
- **API Token Authentication**: ETAPI tokens for programmatic access

## Password Authentication

### Password Security Architecture

#### Hashing Algorithm
- **Primary**: Scrypt with configurable parameters
- **Parameters**: N=16384, r=8, p=1 (adjustable)
- **Salt**: 32-byte cryptographically secure random salt
- **Storage**: Separate verification hash from encryption keys

#### Password Storage Schema

```sql
-- Password-related options in database
CREATE TABLE options (
    name TEXT PRIMARY KEY,
    value TEXT
);

-- Key storage entries
INSERT INTO options VALUES 
('passwordVerificationSalt', '<32-byte-base64-salt>'),
('passwordDerivedKeySalt', '<32-byte-base64-salt>'),
('passwordVerificationHash', '<scrypt-hash-base64>'),
('encryptedDataKey', '<aes-encrypted-key>');
```

#### Password Verification Process

```typescript
// Verification flow
1. Extract stored salt and hash from options
2. Derive key from provided password + salt using scrypt
3. Compare derived hash with stored verification hash
4. Return boolean result (constant-time comparison)
```

### Password Management

#### Setting Initial Password

```typescript
// During setup or first run
function setPassword(password: string): ChangePasswordResponse {
    // Generate new salts
    const verificationSalt = randomSecureToken(32);
    const dataKeySalt = randomSecureToken(32);
    
    // Create verification hash
    const verificationHash = scrypt(password, verificationSalt);
    
    // Generate and encrypt data key
    const dataKey = randomSecureToken(16);
    const passwordKey = scrypt(password, dataKeySalt);
    const encryptedDataKey = aes128Encrypt(passwordKey, dataKey);
    
    // Store in options table
    setOption('passwordVerificationSalt', verificationSalt);
    setOption('passwordDerivedKeySalt', dataKeySalt);
    setOption('passwordVerificationHash', verificationHash);
    setOption('encryptedDataKey', encryptedDataKey);
}
```

#### Changing Password

```typescript
// Password change process
function changePassword(currentPassword: string, newPassword: string) {
    // Verify current password
    if (!verifyPassword(currentPassword)) {
        throw new Error('Current password incorrect');
    }
    
    // Decrypt data key with current password
    const dataKey = getDataKey(currentPassword);
    
    // Generate new salts
    const newVerificationSalt = randomSecureToken(32);
    const newDataKeySalt = randomSecureToken(32);
    
    // Re-encrypt data key with new password
    const newPasswordKey = scrypt(newPassword, newDataKeySalt);
    const newEncryptedDataKey = aes128Encrypt(newPasswordKey, dataKey);
    
    // Update stored values
    updateOptions({
        passwordVerificationSalt: newVerificationSalt,
        passwordDerivedKeySalt: newDataKeySalt,
        passwordVerificationHash: scrypt(newPassword, newVerificationSalt),
        encryptedDataKey: newEncryptedDataKey
    });
}
```

#### Password Reset

```typescript
// Complete password reset (loses all protected content)
function resetPassword() {
    updateOptions({
        passwordVerificationSalt: '',
        passwordDerivedKeySalt: '',
        passwordVerificationHash: '',
        encryptedDataKey: ''
    });
    
    // All protected content becomes inaccessible
    // Only unprotected content remains
}
```

### Password Policy Configuration

#### Minimum Requirements

```typescript
// Default password policy
const passwordPolicy = {
    minLength: 8,           // Minimum character count
    requireUppercase: false, // At least one uppercase letter
    requireLowercase: false, // At least one lowercase letter
    requireNumbers: false,   // At least one number
    requireSymbols: false,   // At least one special character
    maxAge: 0,              // Days before expiration (0 = never)
    preventReuse: 0         // Number of previous passwords to check
};
```

#### Configuration Options

```sql
-- Password policy options
INSERT INTO options VALUES 
('passwordMinLength', '8'),
('passwordRequireUppercase', 'false'),
('passwordRequireLowercase', 'false'),
('passwordRequireNumbers', 'false'),
('passwordRequireSymbols', 'false'),
('passwordMaxAge', '0'),
('passwordPreventReuse', '0');
```

## Multi-Factor Authentication (MFA)

### TOTP Implementation

#### Algorithm Details
- **Standard**: RFC 6238 (Time-Based One-Time Password)
- **Hash Function**: SHA-1 (standard for TOTP compatibility)
- **Time Step**: 30 seconds
- **Code Length**: 6 digits
- **Clock Tolerance**: ±1 time step (±30 seconds)

#### Secret Management

```typescript
// TOTP secret lifecycle
class TotpSecretManager {
    // Generate new TOTP secret
    generateSecret(): string {
        const secret = generateSecretBase32();  // 32-character base32
        return secret;
    }
    
    // Store encrypted secret
    setTotpSecret(secret: string): void {
        const encryptedSecret = encryptWithDataKey(secret);
        setOption('totpEncryptedSecret', encryptedSecret);
        
        // Store verification hash
        const verificationHash = sha256(secret);
        setOption('totpVerificationHash', verificationHash);
    }
    
    // Retrieve and decrypt secret
    getTotpSecret(): string | null {
        const encrypted = getOption('totpEncryptedSecret');
        if (!encrypted) return null;
        
        return decryptWithDataKey(encrypted);
    }
    
    // Verify secret integrity
    verifyTotpSecret(secret: string): boolean {
        const storedHash = getOption('totpVerificationHash');
        const computedHash = sha256(secret);
        return constantTimeEquals(storedHash, computedHash);
    }
}
```

#### TOTP Validation

```typescript
// TOTP code verification
function validateTOTP(submittedCode: string): boolean {
    const secret = getTotpSecret();
    if (!secret) return false;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeStep = 30;
    
    // Check current time window and adjacent windows
    for (let i = -1; i <= 1; i++) {
        const timeWindow = Math.floor(currentTime / timeStep) + i;
        const expectedCode = generateTOTP(secret, timeWindow);
        
        if (constantTimeEquals(submittedCode, expectedCode)) {
            return true;
        }
    }
    
    return false;
}
```

### Recovery Codes

#### Generation and Storage

```typescript
// Recovery code management
class RecoveryCodeManager {
    generateRecoveryCodes(): string[] {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            // Generate 24-character base64 codes ending in "=="
            const code = generateRecoveryCode();
            codes.push(code);
        }
        return codes;
    }
    
    storeRecoveryCodes(codes: string[]): void {
        // Encrypt codes with AES-256-CBC
        const encryptedCodes = codes.map(code => 
            aes256Encrypt(getDataKey(), code)
        );
        
        setOption('recoveryCodesEncrypted', JSON.stringify(encryptedCodes));
    }
    
    verifyRecoveryCode(submittedCode: string): boolean {
        const encryptedCodes = JSON.parse(getOption('recoveryCodesEncrypted') || '[]');
        
        for (let i = 0; i < encryptedCodes.length; i++) {
            const decryptedCode = aes256Decrypt(getDataKey(), encryptedCodes[i]);
            
            if (constantTimeEquals(submittedCode, decryptedCode)) {
                // Mark code as used (replace with timestamp)
                encryptedCodes[i] = aes256Encrypt(getDataKey(), `used:${Date.now()}`);
                setOption('recoveryCodesEncrypted', JSON.stringify(encryptedCodes));
                return true;
            }
        }
        
        return false;
    }
}
```

### MFA Setup Process

#### User Enrollment

```typescript
// MFA enrollment workflow
async function enrollMFA() {
    // 1. Generate TOTP secret
    const secret = totp.generateSecret();
    
    // 2. Display QR code for authenticator app
    const qrCodeUrl = generateQRCode({
        secret: secret,
        issuer: 'Trilium Notes',
        account: 'user@trilium.local'
    });
    
    // 3. User scans QR code or enters secret manually
    // 4. User submits test TOTP code
    const testCode = await promptForTOTP();
    
    // 5. Verify test code
    if (validateTOTPWithSecret(testCode, secret)) {
        // 6. Store secret and enable MFA
        setTotpSecret(secret);
        setOption('mfaEnabled', 'true');
        setOption('mfaMethod', 'totp');
        
        // 7. Generate and display recovery codes
        const recoveryCodes = generateRecoveryCodes();
        storeRecoveryCodes(recoveryCodes);
        displayRecoveryCodes(recoveryCodes);
    } else {
        throw new Error('TOTP verification failed');
    }
}
```

#### Authentication Flow

```typescript
// MFA-enabled login process
async function authenticateWithMFA(username: string, password: string) {
    // 1. Verify primary credentials
    if (!verifyPassword(password)) {
        throw new Error('Invalid credentials');
    }
    
    // 2. Check if MFA is enabled
    if (isMFAEnabled()) {
        // 3. Prompt for TOTP code
        const totpCode = await promptForTOTP();
        
        // 4. Validate TOTP
        if (!validateTOTP(totpCode)) {
            // 5. Allow recovery code as fallback
            const recoveryCode = await promptForRecoveryCode();
            
            if (!verifyRecoveryCode(recoveryCode)) {
                throw new Error('MFA verification failed');
            }
        }
    }
    
    // 6. Create authenticated session
    return createSession(username);
}
```

## Single Sign-On (SSO)

### OpenID Connect Integration

#### Supported Providers

```typescript
// Common OIDC provider configurations
const oidcProviders = {
    google: {
        issuer: 'https://accounts.google.com',
        scope: 'openid email profile'
    },
    microsoft: {
        issuer: 'https://login.microsoftonline.com/common/v2.0',
        scope: 'openid email profile'
    },
    github: {
        issuer: 'https://token.actions.githubusercontent.com',
        scope: 'openid email'
    },
    custom: {
        issuer: process.env.OIDC_ISSUER,
        scope: 'openid email profile'
    }
};
```

#### Configuration Setup

```ini
# config.ini - OpenID Connect settings
[OpenID]
enabled=true
issuer=https://your-provider.com
client_id=your-client-id
client_secret=your-client-secret
redirect_uri=https://your-trilium.com/auth/callback
scope=openid email profile
response_type=code
response_mode=query
```

#### Authentication Flow

```typescript
// OIDC authentication process
class OIDCAuthenticator {
    async authenticate(req: Request, res: Response) {
        // 1. Redirect to OIDC provider
        const authUrl = buildAuthorizationUrl({
            issuer: config.oidc.issuer,
            clientId: config.oidc.clientId,
            redirectUri: config.oidc.redirectUri,
            scope: config.oidc.scope,
            state: generateSecureState(),
            nonce: generateSecureNonce()
        });
        
        res.redirect(authUrl);
    }
    
    async handleCallback(req: Request, res: Response) {
        // 2. Receive authorization code
        const { code, state } = req.query;
        
        // 3. Verify state parameter
        if (!verifyState(state)) {
            throw new Error('Invalid state parameter');
        }
        
        // 4. Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code);
        
        // 5. Verify ID token
        const userInfo = await verifyIdToken(tokens.id_token);
        
        // 6. Create local session
        req.session.loggedIn = true;
        req.session.userInfo = userInfo;
        req.session.oidcTokens = tokens;
        
        res.redirect('/app');
    }
}
```

### SSO Security Features

#### Token Validation

```typescript
// ID token verification
async function verifyIdToken(idToken: string): Promise<UserInfo> {
    // 1. Parse JWT header and payload
    const [header, payload, signature] = idToken.split('.');
    const parsedHeader = JSON.parse(base64Decode(header));
    const parsedPayload = JSON.parse(base64Decode(payload));
    
    // 2. Fetch provider's public keys
    const jwks = await fetchJWKS(config.oidc.issuer);
    const publicKey = findMatchingKey(jwks, parsedHeader.kid);
    
    // 3. Verify signature
    const isValid = verifyJWTSignature(idToken, publicKey);
    if (!isValid) {
        throw new Error('Invalid token signature');
    }
    
    // 4. Verify claims
    validateClaims(parsedPayload, {
        issuer: config.oidc.issuer,
        audience: config.oidc.clientId,
        nonce: getExpectedNonce()
    });
    
    return {
        sub: parsedPayload.sub,
        email: parsedPayload.email,
        name: parsedPayload.name
    };
}
```

#### Session Management

```typescript
// SSO session handling
class SSOSessionManager {
    async refreshTokens(req: Request): Promise<void> {
        const refreshToken = req.session.oidcTokens?.refresh_token;
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }
        
        try {
            const newTokens = await refreshAccessToken(refreshToken);
            req.session.oidcTokens = newTokens;
        } catch (error) {
            // Refresh failed, require re-authentication
            req.session.destroy();
            throw new Error('Token refresh failed');
        }
    }
    
    async logout(req: Request, res: Response): Promise<void> {
        // 1. Destroy local session
        const oidcTokens = req.session.oidcTokens;
        req.session.destroy();
        
        // 2. Construct logout URL
        const logoutUrl = buildLogoutUrl({
            issuer: config.oidc.issuer,
            clientId: config.oidc.clientId,
            postLogoutRedirectUri: config.oidc.postLogoutRedirectUri,
            idTokenHint: oidcTokens?.id_token
        });
        
        // 3. Redirect to provider logout
        res.redirect(logoutUrl);
    }
}
```

## Session Management

### Session Architecture

#### Storage Backend

```typescript
// Session store configuration
const sessionStore = new SqliteStore({
    database: './data/document.db',
    table: 'sessions',
    createTable: true,
    cleanupInterval: 3600000  // 1 hour
});
```

#### Session Schema

```sql
-- Session storage table
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,        -- Session identifier
    expires INTEGER NOT NULL,   -- Expiration timestamp
    data TEXT NOT NULL         -- JSON session data
);

CREATE INDEX idx_sessions_expires ON sessions(expires);
```

#### Session Data Structure

```typescript
// Session data interface
interface SessionData {
    loggedIn: boolean;
    userId?: string;
    userInfo?: {
        email: string;
        name: string;
        sub: string;
    };
    lastAuthState: {
        totpEnabled: boolean;
        ssoEnabled: boolean;
    };
    protectedSession?: {
        active: boolean;
        lastActivity: number;
    };
    csrf?: string;
    oidcTokens?: {
        access_token: string;
        refresh_token: string;
        id_token: string;
    };
}
```

### Session Security Configuration

#### Cookie Security

```typescript
// Secure session cookie configuration
const sessionConfig = {
    name: 'trilium.sid',
    secret: generateSessionSecret(),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        httpOnly: true,           // Prevent XSS access
        secure: isProduction,     // HTTPS only in production
        sameSite: 'strict',       // CSRF protection
        maxAge: 24 * 60 * 60 * 1000,  // 24 hours
        domain: undefined         // Current domain only
    }
};
```

#### Session Validation

```typescript
// Session validation middleware
function validateSession(req: Request, res: Response, next: NextFunction) {
    // 1. Check session existence
    if (!req.session) {
        return res.status(401).json({ error: 'No session found' });
    }
    
    // 2. Verify session integrity
    if (!req.session.loggedIn) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // 3. Check session expiration
    if (isSessionExpired(req.session)) {
        req.session.destroy();
        return res.status(401).json({ error: 'Session expired' });
    }
    
    // 4. Validate authentication state consistency
    const currentAuthState = getCurrentAuthState();
    const lastAuthState = req.session.lastAuthState;
    
    if (!authStateMatches(currentAuthState, lastAuthState)) {
        req.session.destroy();
        return res.status(401).json({ error: 'Authentication state changed' });
    }
    
    // 5. Update last activity
    req.session.lastActivity = Date.now();
    
    next();
}
```

### Session Lifecycle Management

#### Session Creation

```typescript
// Create new authenticated session
async function createSession(req: Request, userInfo: UserInfo): Promise<void> {
    // 1. Generate session data
    const sessionData: SessionData = {
        loggedIn: true,
        userId: userInfo.sub,
        userInfo: userInfo,
        lastAuthState: {
            totpEnabled: isTotpEnabled(),
            ssoEnabled: isSSoEnabled()
        },
        csrf: generateCSRFToken()
    };
    
    // 2. Store session
    req.session = sessionData;
    
    // 3. Set secure cookie
    req.session.save((err) => {
        if (err) {
            throw new Error('Failed to save session');
        }
    });
    
    // 4. Log security event
    logSecurityEvent('SESSION_CREATE', {
        userId: userInfo.sub,
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });
}
```

#### Session Cleanup

```typescript
// Automatic session cleanup
class SessionCleaner {
    constructor(private sessionStore: SqliteStore) {
        // Run cleanup every hour
        setInterval(() => this.cleanup(), 3600000);
    }
    
    async cleanup(): Promise<void> {
        const now = Date.now();
        
        // Remove expired sessions
        const expiredCount = await this.sessionStore.clear({
            where: 'expires < ?',
            params: [now]
        });
        
        // Log cleanup results
        if (expiredCount > 0) {
            logSecurityEvent('SESSION_CLEANUP', {
                expiredSessions: expiredCount,
                timestamp: now
            });
        }
        
        // Optimize database
        await this.sessionStore.optimize();
    }
}
```

## CSRF Protection

### Double Submit Cookie Implementation

#### Token Generation

```typescript
// CSRF token management
class CSRFTokenManager {
    generateToken(): string {
        // Generate 32-byte random token
        const tokenBytes = crypto.randomBytes(32);
        return tokenBytes.toString('hex');
    }
    
    setToken(req: Request, res: Response): void {
        const token = this.generateToken();
        
        // Store in session
        req.session.csrf = token;
        
        // Send as cookie
        res.cookie('_csrf', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'strict',
            path: '/'
        });
    }
    
    validateToken(req: Request): boolean {
        const sessionToken = req.session.csrf;
        const cookieToken = req.cookies._csrf;
        const headerToken = req.headers['x-csrf-token'] || 
                           req.headers['x-xsrf-token'];
        
        // All tokens must be present and match
        return sessionToken && 
               cookieToken && 
               headerToken &&
               constantTimeEquals(sessionToken, cookieToken) &&
               constantTimeEquals(sessionToken, headerToken);
    }
}
```

#### CSRF Middleware

```typescript
// CSRF protection middleware
function csrfProtection(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    
    // Skip CSRF for API token authentication
    if (isApiTokenAuthenticated(req)) {
        return next();
    }
    
    // Validate CSRF token
    if (!csrfTokenManager.validateToken(req)) {
        logSecurityEvent('CSRF_VIOLATION', {
            ip: req.ip,
            path: req.path,
            method: req.method,
            userAgent: req.headers['user-agent']
        });
        
        return res.status(403).json({ 
            error: 'CSRF token validation failed' 
        });
    }
    
    next();
}
```

## API Authentication

### ETAPI Token System

#### Token Structure

```typescript
// ETAPI token format
interface EtapiToken {
    id: string;              // Unique token identifier
    name: string;            // Human-readable name
    tokenHash: string;       // SHA-256 hash of token
    isDeleted: boolean;      // Soft delete flag
    dateCreated: string;     // Creation timestamp
    dateModified: string;    // Last modification
}
```

#### Token Generation

```typescript
// Generate new ETAPI token
function generateEtapiToken(name: string): { token: string, tokenHash: string } {
    // Generate 64-character random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Create hash for storage
    const tokenHash = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
    
    // Store in database
    sql.execute(`
        INSERT INTO etapi_tokens (id, name, tokenHash, isDeleted, dateCreated, dateModified)
        VALUES (?, ?, ?, 0, datetime('now'), datetime('now'))
    `, [generateId(), name, tokenHash]);
    
    return { token, tokenHash };
}
```

#### Token Validation

```typescript
// Validate ETAPI token
function validateEtapiToken(authHeader: string): boolean {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Hash provided token
    const providedHash = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
    
    // Check against stored hashes
    const storedToken = sql.getValue(`
        SELECT id FROM etapi_tokens 
        WHERE tokenHash = ? AND isDeleted = 0
    `, [providedHash]);
    
    return !!storedToken;
}
```

### Rate Limiting

#### Token-based Rate Limiting

```typescript
// Rate limiter for API endpoints
class ApiRateLimiter {
    private limits = new Map<string, TokenLimit>();
    
    constructor(
        private maxRequests: number = 1000,
        private windowMs: number = 60000  // 1 minute
    ) {}
    
    check(tokenHash: string): boolean {
        const now = Date.now();
        const limit = this.limits.get(tokenHash);
        
        if (!limit || now - limit.resetTime > this.windowMs) {
            // Reset or create new limit
            this.limits.set(tokenHash, {
                count: 1,
                resetTime: now
            });
            return true;
        }
        
        if (limit.count >= this.maxRequests) {
            return false; // Rate limit exceeded
        }
        
        limit.count++;
        return true;
    }
}
```

## Access Control

### Permission Matrix

```typescript
// Access control matrix
enum Permission {
    READ_PUBLIC = 'read_public',
    READ_PROTECTED = 'read_protected',
    WRITE_PUBLIC = 'write_public', 
    WRITE_PROTECTED = 'write_protected',
    ADMIN = 'admin',
    API_ACCESS = 'api_access'
}

enum AuthState {
    ANONYMOUS = 'anonymous',
    AUTHENTICATED = 'authenticated',
    PROTECTED_SESSION = 'protected_session',
    API_TOKEN = 'api_token'
}

const accessMatrix: Record<AuthState, Permission[]> = {
    [AuthState.ANONYMOUS]: [
        Permission.READ_PUBLIC  // Only if sharing enabled
    ],
    [AuthState.AUTHENTICATED]: [
        Permission.READ_PUBLIC,
        Permission.WRITE_PUBLIC,
        Permission.ADMIN
    ],
    [AuthState.PROTECTED_SESSION]: [
        Permission.READ_PUBLIC,
        Permission.READ_PROTECTED,
        Permission.WRITE_PUBLIC,
        Permission.WRITE_PROTECTED,
        Permission.ADMIN
    ],
    [AuthState.API_TOKEN]: [
        Permission.READ_PUBLIC,
        Permission.WRITE_PUBLIC,
        Permission.API_ACCESS
    ]
};
```

### Authorization Middleware

```typescript
// Authorization enforcement
function requirePermission(permission: Permission) {
    return (req: Request, res: Response, next: NextFunction) => {
        const authState = getAuthState(req);
        const allowedPermissions = accessMatrix[authState];
        
        if (!allowedPermissions.includes(permission)) {
            logSecurityEvent('AUTHORIZATION_DENIED', {
                permission: permission,
                authState: authState,
                ip: req.ip,
                path: req.path
            });
            
            return res.status(403).json({
                error: 'Insufficient permissions'
            });
        }
        
        next();
    };
}

// Usage examples
app.get('/api/notes/:id', 
    requirePermission(Permission.READ_PUBLIC),
    getNoteHandler
);

app.put('/api/notes/:id',
    requirePermission(Permission.WRITE_PUBLIC),
    updateNoteHandler
);

app.get('/api/protected-notes/:id',
    requirePermission(Permission.READ_PROTECTED),
    getProtectedNoteHandler
);
```

## Security Monitoring

### Security Event Logging

```typescript
// Security event types
enum SecurityEventType {
    LOGIN_SUCCESS = 'login_success',
    LOGIN_FAILURE = 'login_failure',
    MFA_SUCCESS = 'mfa_success',
    MFA_FAILURE = 'mfa_failure',
    SESSION_CREATE = 'session_create',
    SESSION_DESTROY = 'session_destroy',
    PROTECTED_SESSION_START = 'protected_session_start',
    PROTECTED_SESSION_END = 'protected_session_end',
    CSRF_VIOLATION = 'csrf_violation',
    RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
    AUTHORIZATION_DENIED = 'authorization_denied',
    PASSWORD_CHANGE = 'password_change',
    API_TOKEN_CREATED = 'api_token_created',
    API_TOKEN_DELETED = 'api_token_deleted'
}

// Security event logger
class SecurityEventLogger {
    logEvent(type: SecurityEventType, data: any): void {
        const event = {
            timestamp: new Date().toISOString(),
            type: type,
            data: data,
            severity: this.getSeverity(type)
        };
        
        // Log to database
        sql.execute(`
            INSERT INTO security_events (timestamp, type, data, severity)
            VALUES (?, ?, ?, ?)
        `, [event.timestamp, event.type, JSON.stringify(event.data), event.severity]);
        
        // Log to file
        logger.info('Security Event', event);
        
        // Send alerts for high-severity events
        if (event.severity === 'HIGH') {
            this.sendAlert(event);
        }
    }
    
    private getSeverity(type: SecurityEventType): string {
        const highSeverityEvents = [
            SecurityEventType.LOGIN_FAILURE,
            SecurityEventType.MFA_FAILURE,
            SecurityEventType.CSRF_VIOLATION,
            SecurityEventType.AUTHORIZATION_DENIED
        ];
        
        return highSeverityEvents.includes(type) ? 'HIGH' : 'LOW';
    }
}
```

### Intrusion Detection

```typescript
// Basic intrusion detection
class IntrusionDetector {
    private failedAttempts = new Map<string, FailureRecord>();
    
    constructor(
        private maxFailures = 5,
        private windowMs = 300000  // 5 minutes
    ) {}
    
    recordFailure(ip: string): void {
        const now = Date.now();
        const record = this.failedAttempts.get(ip);
        
        if (!record || now - record.firstAttempt > this.windowMs) {
            this.failedAttempts.set(ip, {
                count: 1,
                firstAttempt: now,
                lastAttempt: now
            });
        } else {
            record.count++;
            record.lastAttempt = now;
            
            if (record.count >= this.maxFailures) {
                this.triggerLockout(ip);
            }
        }
    }
    
    private triggerLockout(ip: string): void {
        // Log security event
        logSecurityEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, {
            ip: ip,
            failureCount: this.maxFailures,
            action: 'temporary_lockout'
        });
        
        // Implement temporary IP blocking
        this.blockIP(ip, 3600000); // 1 hour block
    }
}
```

## Troubleshooting

### Common Authentication Issues

#### Login Failures

**Symptom**: Cannot login with correct credentials

**Diagnostic Steps**:
```bash
# Check session storage
sqlite3 document.db "SELECT COUNT(*) FROM sessions;"

# Verify password hash
sqlite3 document.db "SELECT name, length(value) FROM options WHERE name LIKE 'password%';"

# Check for session errors
tail -f logs/trilium.log | grep -i session
```

**Solutions**:
1. Clear browser cookies and cache
2. Restart Trilium server
3. Check database permissions
4. Verify password case sensitivity

#### MFA Problems

**Symptom**: TOTP codes rejected

**Diagnostic Steps**:
```bash
# Check TOTP configuration
sqlite3 document.db "SELECT value FROM options WHERE name = 'mfaEnabled';"

# Verify time synchronization
timedatectl status

# Check TOTP secret
# (In protected session only)
```

**Solutions**:
1. Synchronize system time with NTP
2. Use recovery codes
3. Regenerate TOTP secret
4. Check authenticator app configuration

#### Session Issues

**Symptom**: Frequent logouts or session errors

**Diagnostic Steps**:
```bash
# Check session configuration
sqlite3 document.db "SELECT * FROM sessions LIMIT 5;"

# Monitor session cleanup
tail -f logs/trilium.log | grep -i "session cleanup"

# Check cookie settings
# Browser Developer Tools → Application → Cookies
```

**Solutions**:
1. Increase session timeout
2. Enable secure cookies for HTTPS
3. Check browser cookie settings
4. Verify database write permissions

### Security Monitoring Queries

```sql
-- Recent login failures
SELECT timestamp, data FROM security_events 
WHERE type = 'login_failure' 
AND timestamp > datetime('now', '-1 hour')
ORDER BY timestamp DESC;

-- MFA bypass attempts
SELECT timestamp, data FROM security_events 
WHERE type = 'mfa_failure'
AND timestamp > datetime('now', '-1 day')
ORDER BY timestamp DESC;

-- CSRF violations
SELECT timestamp, data FROM security_events 
WHERE type = 'csrf_violation'
ORDER BY timestamp DESC LIMIT 10;

-- Active sessions
SELECT id, expires, length(data) as data_size 
FROM sessions 
WHERE expires > unixepoch('now') * 1000
ORDER BY expires ASC;
```

Remember: Proper authentication and access control are fundamental to Trilium's security. Regularly review your configuration and monitor for suspicious activity to maintain a secure environment.