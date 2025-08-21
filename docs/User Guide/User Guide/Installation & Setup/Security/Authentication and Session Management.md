# Authentication and Session Management

Trilium provides multiple authentication methods and robust session management to secure access to your notes while maintaining usability.

## Authentication Methods

### Password Authentication

The primary authentication method uses a master password to secure your Trilium instance.

#### Password Setup

1. **Initial Setup**: Set during first launch or server installation
2. **Password Requirements**: Configurable strength requirements
3. **Verification**: Scrypt-based password hashing for security
4. **Storage**: Hashed using scrypt with random salt

#### Password Security

- **Hashing Algorithm**: Scrypt with parameters N=16384, r=8, p=1
- **Salt**: Unique random salt generated per installation
- **Verification Hash**: Stored separately from encryption keys
- **Timing Attack Protection**: Constant-time comparison

### Multi-Factor Authentication (TOTP)

Trilium supports Time-based One-Time Password (TOTP) authentication for enhanced security.

#### Setup Process

1. **Enable MFA**: Navigate to Options → Multi-Factor Authentication
2. **Generate Secret**: Click "Generate New Secret"
3. **Add to Authenticator**: Scan QR code or enter secret manually
4. **Verify Setup**: Enter TOTP code to confirm configuration
5. **Save Recovery Codes**: Store backup codes securely

#### Supported Authenticators

- **Google Authenticator**: Mobile app for Android/iOS
- **Authy**: Cross-platform authenticator with cloud sync
- **Microsoft Authenticator**: Integrated with Microsoft accounts
- **1Password**: Built-in TOTP support
- **Any RFC 6238 Compatible App**: Standard TOTP implementation

#### TOTP Configuration

```typescript
// TOTP settings in options
{
  mfaEnabled: "true",           // Enable/disable MFA
  mfaMethod: "totp",           // Authentication method
  totpEncryptedSecret: "...",  // Encrypted TOTP secret
  totpVerificationHash: "..."  // Secret verification hash
}
```

### Recovery Codes

Recovery codes provide backup access when TOTP is unavailable.

#### Code Generation

- **Format**: Base64-encoded 24-character strings ending in "=="
- **Quantity**: Multiple codes generated during setup
- **Encryption**: AES-256-CBC encrypted storage
- **One-time Use**: Each code invalidated after use

#### Usage Guidelines

1. **Secure Storage**: Keep codes in password manager or secure location
2. **Limited Use**: Only use when primary authentication unavailable
3. **Regeneration**: Generate new codes if compromised
4. **Expiration**: Codes replaced with timestamp when used

### Single Sign-On (SSO)

Trilium supports OpenID Connect for enterprise authentication.

#### Supported Providers

- **Google**: Google Workspace accounts
- **Microsoft**: Azure AD integration
- **GitHub**: Developer account authentication
- **Custom OIDC**: Any OpenID Connect provider

#### Configuration

Set environment variables or config.ini:

```ini
[OpenID]
enabled=true
issuer=https://accounts.google.com
client_id=your-client-id
client_secret=your-client-secret
redirect_uri=https://your-trilium.example.com/auth/callback
```

## Session Management

### Session Security

Trilium implements secure session management with multiple protection layers.

#### Session Storage

- **Database Storage**: Sessions stored in SQLite database
- **Secure Secrets**: Cryptographically secure session secrets
- **Expiration Tracking**: Automatic cleanup of expired sessions
- **Multiple Sessions**: Support for concurrent user sessions

#### Session Configuration

```typescript
// Session settings
{
  secret: sessionSecret,           // Cryptographic secret
  resave: false,                  // Don't save unchanged sessions
  saveUninitialized: false,       // Don't save empty sessions
  rolling: true,                  // Reset expiration on activity
  cookie: {
    httpOnly: true,               // Prevent XSS attacks
    secure: false,                // HTTPS-only in production
    maxAge: 24 * 60 * 60 * 1000  // 24-hour expiration
  }
}
```

### Session Lifecycle

#### Session Creation

1. **Authentication**: User provides valid credentials
2. **Session ID**: Generate cryptographically secure session ID
3. **Database Storage**: Store session data with expiration
4. **Cookie Setting**: Send session cookie to client
5. **State Tracking**: Monitor authentication state changes

#### Session Maintenance

- **Activity Tracking**: Update session expiration on each request
- **State Validation**: Verify session integrity on each access
- **Timeout Management**: Automatic logout after inactivity
- **Cross-tab Sync**: Session state synchronized across browser tabs

#### Session Termination

1. **Manual Logout**: User-initiated session termination
2. **Timeout Expiration**: Automatic logout after inactivity
3. **Security Events**: Forced logout on security state changes
4. **Cleanup**: Remove session data from database

### CSRF Protection

Trilium implements double-submit cookie CSRF protection.

#### Protection Mechanism

- **Token Generation**: Cryptographically secure CSRF tokens
- **Cookie Storage**: Token stored in httpOnly cookie
- **Header Validation**: Token required in request headers
- **Double Submit**: Cookie and header values must match

#### Configuration

```typescript
// CSRF protection settings
{
  cookieOptions: {
    path: "/",
    secure: false,        // HTTPS-only in production
    sameSite: "strict",   // Strict same-site policy
    httpOnly: true        // Prevent JavaScript access
  },
  cookieName: "_csrf"     // Cookie name for CSRF token
}
```

### Session Security Headers

Trilium sets security headers to protect against common attacks.

#### Standard Headers

- **X-Frame-Options**: Prevent clickjacking attacks
- **X-Content-Type-Options**: Prevent MIME sniffing
- **X-XSS-Protection**: Enable browser XSS protection
- **Strict-Transport-Security**: Enforce HTTPS connections
- **Content-Security-Policy**: Control resource loading

## Authentication Flow

### Standard Login Process

1. **Initial Request**: User accesses protected resource
2. **Redirect**: System redirects to login page
3. **Credential Entry**: User enters username/password
4. **Verification**: System validates credentials
5. **MFA Challenge**: TOTP prompt if MFA enabled
6. **Session Creation**: Generate and store session
7. **Redirect**: Send user to requested resource

### MFA Login Process

1. **Primary Authentication**: Password verification succeeds
2. **MFA Challenge**: Display TOTP input form
3. **Code Verification**: Validate TOTP code
4. **Recovery Option**: Allow recovery code if TOTP fails
5. **Session Creation**: Create authenticated session
6. **State Tracking**: Update last authentication state

### SSO Login Process

1. **Provider Redirect**: Redirect to OpenID provider
2. **Provider Authentication**: User authenticates with provider
3. **Authorization Code**: Provider returns authorization code
4. **Token Exchange**: Exchange code for access token
5. **User Info**: Retrieve user information from provider
6. **Local Session**: Create local session for user
7. **Access Grant**: Allow access to protected resources

## Security Best Practices

### Password Security

1. **Strong Passwords**: Require complex passwords
2. **Regular Updates**: Encourage periodic password changes
3. **Unique Passwords**: Don't reuse passwords from other services
4. **Secure Storage**: Use password managers

### Session Security

1. **HTTPS Only**: Always use HTTPS in production
2. **Secure Cookies**: Enable secure flag for session cookies
3. **Short Timeouts**: Configure appropriate session timeouts
4. **Regular Cleanup**: Automatically clean expired sessions

### Multi-Factor Authentication

1. **Enable MFA**: Always enable MFA for sensitive installations
2. **Secure Recovery**: Store recovery codes securely
3. **Regular Review**: Periodically review MFA configuration
4. **Backup Methods**: Maintain multiple authentication methods

## Troubleshooting

### Common Authentication Issues

#### Login Failures

**Symptoms**: Cannot login with correct credentials

**Possible Causes**:
- Incorrect password
- Database connectivity issues
- Session storage problems
- Browser cookie issues

**Solutions**:
1. Verify password accuracy (check caps lock)
2. Clear browser cookies and cache
3. Check database connectivity
4. Review server logs for errors
5. Restart application if needed

#### MFA Issues

**Symptoms**: TOTP codes rejected or recovery codes fail

**Possible Causes**:
- Clock synchronization issues
- Corrupted TOTP secret
- Used recovery codes
- Configuration problems

**Solutions**:
1. Synchronize device time
2. Regenerate TOTP secret
3. Use fresh recovery codes
4. Check MFA configuration
5. Contact administrator if needed

#### Session Problems

**Symptoms**: Frequent logouts or session errors

**Possible Causes**:
- Short session timeout
- Database session storage issues
- Browser cookie problems
- Network connectivity issues

**Solutions**:
1. Increase session timeout
2. Check database permissions
3. Enable browser cookies
4. Verify network stability
5. Review session configuration

### Security Monitoring

#### Log Analysis

Monitor authentication logs for:
- Failed login attempts
- MFA failures
- Session anomalies
- Unusual access patterns

#### Alert Configuration

Set up alerts for:
- Multiple failed logins
- MFA bypass attempts
- Session manipulation
- Account lockouts

#### Regular Audits

Perform regular security audits:
- Review authentication logs
- Check session configurations
- Validate MFA setup
- Test recovery procedures

## Configuration Reference

### Environment Variables

```bash
# Authentication settings
TRILIUM_NO_AUTHENTICATION=false
TRILIUM_PASSWORD_MIN_LENGTH=8
TRILIUM_SESSION_TIMEOUT=86400

# MFA settings  
TRILIUM_MFA_ENABLED=true
TRILIUM_MFA_METHOD=totp

# OpenID settings
TRILIUM_OPENID_ENABLED=false
TRILIUM_OPENID_ISSUER=https://provider.example.com
TRILIUM_OPENID_CLIENT_ID=your-client-id
TRILIUM_OPENID_CLIENT_SECRET=your-client-secret
```

### Database Options

```sql
-- Authentication options
INSERT INTO options (name, value) VALUES 
('passwordMinLength', '8'),
('sessionTimeout', '86400'),
('mfaEnabled', 'true'),
('mfaMethod', 'totp');
```

Remember: Strong authentication and session management are critical for protecting your notes. Always use HTTPS in production and enable MFA for enhanced security.