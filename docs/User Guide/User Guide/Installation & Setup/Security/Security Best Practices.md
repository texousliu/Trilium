# Security Best Practices

This guide provides comprehensive security recommendations for deploying and maintaining a secure Trilium installation.

## Deployment Security

### Server Configuration

#### HTTPS Deployment

**Always use HTTPS in production environments:**

1. **TLS Configuration**: Use TLS 1.2 or higher
2. **Certificate Management**: Use valid SSL certificates (Let's Encrypt recommended)
3. **HSTS Headers**: Enable HTTP Strict Transport Security
4. **Secure Redirects**: Redirect all HTTP traffic to HTTPS

Example Nginx configuration:
```nginx
server {
    listen 443 ssl http2;
    server_name your-trilium.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Network Security

1. **Firewall Configuration**: Restrict access to necessary ports only
2. **Port Security**: Use non-standard ports if required
3. **IP Restrictions**: Limit access to trusted IP ranges
4. **VPN Access**: Consider VPN for remote access

Example firewall rules:
```bash
# Allow only HTTPS and SSH
ufw allow 22/tcp
ufw allow 443/tcp
ufw deny 8080/tcp  # Block direct access to Trilium
ufw enable
```

### Access Control

#### User Management

1. **Single User Model**: Trilium is designed for single-user access
2. **Shared Access**: Use shared hosting or family sharing with caution
3. **Guest Access**: Disable guest access unless specifically needed
4. **Admin Privileges**: Run Trilium with minimal necessary privileges

#### Authentication Hardening

1. **Strong Passwords**: Enforce complex password requirements
2. **Multi-Factor Authentication**: Always enable MFA for production
3. **Password Rotation**: Regular password updates
4. **Account Lockout**: Monitor for brute force attempts

### Data Protection

#### Backup Security

1. **Encrypted Backups**: Ensure backups are encrypted at rest
2. **Secure Storage**: Store backups in secure locations
3. **Access Control**: Limit backup access to authorized personnel
4. **Regular Testing**: Verify backup integrity regularly

Backup encryption example:
```bash
# Create encrypted backup
tar czf - trilium-data/ | gpg --cipher-algo AES256 --compress-algo 1 --symmetric --output trilium-backup-$(date +%Y%m%d).tar.gz.gpg

# Restore encrypted backup
gpg --decrypt trilium-backup-20240101.tar.gz.gpg | tar xzf -
```

#### Database Security

1. **File Permissions**: Restrict database file access (600 or 640)
2. **Directory Security**: Secure data directory permissions
3. **Regular Monitoring**: Monitor for unauthorized access attempts
4. **Integrity Checks**: Verify database integrity regularly

```bash
# Secure file permissions
chmod 600 /path/to/trilium/data/document.db
chmod 700 /path/to/trilium/data/
chown trilium:trilium /path/to/trilium/data/ -R
```

## Application Security

### Configuration Hardening

#### Security Headers

Configure security headers for web protection:

```typescript
// Security headers configuration
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline';"
    );
    next();
});
```

#### Session Security

1. **Session Timeout**: Configure appropriate timeout values
2. **Secure Cookies**: Enable secure flag for all cookies
3. **Session Regeneration**: Regenerate session IDs after login
4. **CSRF Protection**: Enable and properly configure CSRF protection

Example session configuration:
```javascript
// Secure session configuration
{
    cookie: {
        secure: true,         // HTTPS only
        httpOnly: true,       // Prevent XSS
        maxAge: 30 * 60 * 1000, // 30 minutes
        sameSite: 'strict'    // CSRF protection
    },
    rolling: true,            // Reset timeout on activity
    resave: false,           // Don't save unchanged sessions
    saveUninitialized: false // Don't save empty sessions
}
```

### Input Validation

#### Content Security

1. **HTML Sanitization**: Properly sanitize user-generated content
2. **File Upload Security**: Validate file types and sizes
3. **Script Execution**: Control custom script execution
4. **SQL Injection Prevention**: Use parameterized queries

#### API Security

1. **Rate Limiting**: Implement API rate limiting
2. **Input Validation**: Validate all API inputs
3. **Authentication**: Require authentication for sensitive operations
4. **Authorization**: Implement proper access controls

Example rate limiting:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.'
});

app.use('/api/', limiter);
```

## Operational Security

### Monitoring and Logging

#### Security Logging

1. **Authentication Events**: Log all login attempts and failures
2. **Authorization Events**: Track access to protected resources
3. **Data Access**: Monitor sensitive data access patterns
4. **System Events**: Log system-level security events

Example log monitoring:
```bash
# Monitor failed login attempts
tail -f /var/log/trilium/security.log | grep "Failed login"

# Alert on multiple failures
tail -f /var/log/trilium/security.log | awk '/Failed login/ {count++} count>=5 {print "Alert: Multiple failed logins"; count=0}'
```

#### Security Metrics

Monitor key security metrics:
- Failed authentication attempts
- Session anomalies
- Unusual access patterns
- Data export activities
- Configuration changes

### Incident Response

#### Preparation

1. **Incident Response Plan**: Develop and document procedures
2. **Contact Lists**: Maintain emergency contact information
3. **Backup Procedures**: Ensure rapid recovery capabilities
4. **Communication Plans**: Prepare user notification procedures

#### Detection and Response

1. **Automated Monitoring**: Implement automated threat detection
2. **Alert Systems**: Configure appropriate alerting thresholds
3. **Response Procedures**: Define step-by-step response actions
4. **Forensic Preparation**: Preserve evidence for analysis

Example incident response checklist:
```
□ Identify and isolate affected systems
□ Preserve logs and evidence
□ Assess scope and impact
□ Notify relevant stakeholders
□ Implement containment measures
□ Begin recovery procedures
□ Document lessons learned
□ Update security controls
```

### Regular Maintenance

#### Security Updates

1. **Application Updates**: Keep Trilium updated to latest version
2. **Dependency Updates**: Regularly update dependencies
3. **System Updates**: Maintain OS and security patches
4. **Certificate Renewal**: Monitor and renew SSL certificates

#### Security Audits

1. **Regular Reviews**: Conduct periodic security assessments
2. **Penetration Testing**: Perform authorized security testing
3. **Configuration Audits**: Review security configurations
4. **Access Reviews**: Audit user access and permissions

Automated update checking:
```bash
#!/bin/bash
# Check for Trilium updates
CURRENT_VERSION=$(curl -s https://api.github.com/repos/TriliumNext/Trilium/releases/latest | grep tag_name | cut -d'"' -f4)
INSTALLED_VERSION=$(grep version /opt/trilium/package.json | cut -d'"' -f4)

if [ "$CURRENT_VERSION" != "v$INSTALLED_VERSION" ]; then
    echo "Update available: $CURRENT_VERSION (current: $INSTALLED_VERSION)"
    # Add notification logic here
fi
```

## Threat Mitigation

### Common Attack Vectors

#### Web Application Attacks

**Cross-Site Scripting (XSS)**:
- Content Security Policy headers
- Input sanitization
- Output encoding
- Secure cookie flags

**Cross-Site Request Forgery (CSRF)**:
- CSRF token validation
- SameSite cookie attributes
- Referrer validation
- Double-submit cookies

**Session Hijacking**:
- Secure session management
- HTTPS enforcement
- Session timeout controls
- Session regeneration

#### Infrastructure Attacks

**Denial of Service (DoS)**:
- Rate limiting
- Request size limits
- Connection throttling
- Resource monitoring

**Data Breaches**:
- Encryption at rest
- Access controls
- Audit logging
- Regular backups

### Security Controls Implementation

#### Preventive Controls

1. **Authentication**: Strong password policies and MFA
2. **Authorization**: Proper access controls and permissions
3. **Encryption**: Data encryption at rest and in transit
4. **Input Validation**: Comprehensive input sanitization

#### Detective Controls

1. **Logging**: Comprehensive security logging
2. **Monitoring**: Real-time security monitoring
3. **Alerting**: Automated threat detection
4. **Auditing**: Regular security audits

#### Responsive Controls

1. **Incident Response**: Documented response procedures
2. **Backup and Recovery**: Reliable backup systems
3. **Isolation**: Network segmentation capabilities
4. **Communication**: Stakeholder notification systems

## Compliance Considerations

### Data Protection Regulations

#### GDPR Compliance

1. **Data Minimization**: Only collect necessary data
2. **Consent Management**: Obtain proper user consent
3. **Right to Erasure**: Implement data deletion capabilities
4. **Data Portability**: Enable data export functionality
5. **Privacy by Design**: Build privacy into system design

#### HIPAA Compliance (Healthcare)

1. **Access Controls**: Implement user authentication and authorization
2. **Audit Logs**: Maintain comprehensive audit trails
3. **Encryption**: Encrypt data at rest and in transit
4. **Risk Assessment**: Conduct regular risk assessments
5. **Business Associate Agreements**: Ensure proper agreements

### Industry Standards

#### ISO 27001

1. **Information Security Management**: Implement ISMS
2. **Risk Management**: Conduct regular risk assessments
3. **Security Controls**: Implement appropriate controls
4. **Continuous Improvement**: Regular reviews and updates

#### SOC 2

1. **Security**: Implement comprehensive security controls
2. **Availability**: Ensure system availability and reliability
3. **Processing Integrity**: Maintain data processing integrity
4. **Confidentiality**: Protect sensitive information
5. **Privacy**: Implement privacy protection measures

## Security Assessment Checklist

### Infrastructure Security
- [ ] HTTPS configured with valid certificates
- [ ] Firewall rules properly configured
- [ ] Network access controls implemented
- [ ] System updates current
- [ ] Backup procedures tested
- [ ] Monitoring systems active

### Application Security
- [ ] Strong authentication configured
- [ ] Multi-factor authentication enabled
- [ ] Session security properly configured
- [ ] CSRF protection enabled
- [ ] Security headers configured
- [ ] Input validation implemented

### Data Security
- [ ] Database properly secured
- [ ] File permissions configured
- [ ] Encryption properly implemented
- [ ] Backup encryption verified
- [ ] Access controls tested
- [ ] Data retention policies defined

### Operational Security
- [ ] Security logging enabled
- [ ] Monitoring systems configured
- [ ] Incident response plan documented
- [ ] Security training completed
- [ ] Regular audits scheduled
- [ ] Update procedures documented

Remember: Security is an ongoing process, not a one-time configuration. Regularly review and update your security posture to address evolving threats and requirements.