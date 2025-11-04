# Security Architecture
### Encryption System

**Per-Note Encryption:**

*   Notes can be individually protected
*   AES-128-CBC encryption for encrypted notes.
*   Separate protected session management

**Protected Session:**

*   Time-limited access to protected notes
*   Automatic timeout
*   Re-authentication required
*   Frontend: `protected_session.ts`
*   Backend: `protected_session.ts`

### Authentication

**Password Auth:**

*   PBKDF2 key derivation
*   Salt per installation
*   Hash verification

**OpenID Connect:**

*   External identity provider support
*   OAuth 2.0 flow
*   Configurable providers

**TOTP (2FA):**

*   Time-based one-time passwords
*   QR code setup
*   Backup codes

### Authorization

**Single-User Model:**

*   Desktop: single user (owner)
*   Server: single user per installation

**Share Notes:**

*   Public access without authentication
*   Separate Shaca cache
*   Read-only access

### CSRF Protection

**CSRF Tokens:**

*   Required for state-changing operations
*   Token in header or cookie
*   Validation middleware

### Input Sanitization

**XSS Prevention:**

*   DOMPurify for HTML sanitization
*   CKEditor content filtering
*   CSP headers

**SQL Injection:**

*   Parameterized queries only
*   Better-sqlite3 prepared statements
*   No string concatenation in SQL

### Dependency Security

**Vulnerability Scanning:**

*   Renovate bot for updates
*   npm audit integration
*   Override vulnerable sub-dependencies