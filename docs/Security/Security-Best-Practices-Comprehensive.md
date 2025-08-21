# Trilium Security Best Practices - Comprehensive Guide

This comprehensive guide provides detailed security recommendations for deploying, configuring, and maintaining a secure Trilium installation across all environments from personal desktop use to enterprise deployments.

## Table of Contents

1. [Deployment Security](#deployment-security)
2. [Infrastructure Hardening](#infrastructure-hardening)
3. [Application Security Configuration](#application-security-configuration)
4. [Data Protection](#data-protection)
5. [Operational Security](#operational-security)
6. [Compliance and Governance](#compliance-and-governance)
7. [Incident Response](#incident-response)
8. [Security Assessment](#security-assessment)

## Deployment Security

### Production Environment Setup

#### HTTPS Configuration

**Mandatory for Production**: Always use HTTPS in production environments to protect data in transit.

```nginx
# Nginx configuration for Trilium
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name trilium.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/trilium.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/trilium.yourdomain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # HSTS (63072000 seconds = 2 years)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; media-src 'self'; object-src 'none'; child-src 'none'; frame-src 'none'; worker-src 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests;" always;
    
    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Proxy configuration
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Security headers for proxy
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Server $host;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket support
    location /api/sync {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name trilium.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

#### Docker Security Configuration

```dockerfile
# Secure Dockerfile for Trilium
FROM node:18-alpine AS builder

# Create non-root user
RUN addgroup -g 1001 -S trilium && \
    adduser -S trilium -u 1001

# Security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init

# Application setup
WORKDIR /opt/trilium
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN chown -R trilium:trilium /opt/trilium

# Runtime image
FROM node:18-alpine

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init

# Create user and directories
RUN addgroup -g 1001 -S trilium && \
    adduser -S trilium -u 1001 && \
    mkdir -p /opt/trilium /home/trilium/data && \
    chown trilium:trilium /opt/trilium /home/trilium/data

# Copy application
COPY --from=builder --chown=trilium:trilium /opt/trilium /opt/trilium

# Switch to non-root user
USER trilium

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node docker_healthcheck.js

WORKDIR /opt/trilium
EXPOSE 8080

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/www.js"]
```

```yaml
# Docker Compose with security hardening
version: '3.8'

services:
  trilium:
    image: triliumnext/trilium:latest
    container_name: trilium
    restart: unless-stopped
    
    # Security configurations
    read_only: true
    user: "1001:1001"
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - DAC_OVERRIDE
      - SETGID
      - SETUID
    security_opt:
      - no-new-privileges:true
      - apparmor:docker-default
    
    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
    
    # Tmpfs for temporary files
    tmpfs:
      - /tmp:noexec,nosuid,size=100m
      - /var/tmp:noexec,nosuid,size=50m
    
    environment:
      - TRILIUM_DATA_DIR=/home/trilium/data
      - NODE_ENV=production
      - TRILIUM_PORT=8080
    
    volumes:
      - trilium_data:/home/trilium/data:rw
      - /etc/localtime:/etc/localtime:ro
    
    ports:
      - "127.0.0.1:8080:8080"
    
    # Health check
    healthcheck:
      test: ["CMD", "node", "docker_healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  trilium_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /opt/trilium/data
```

### Network Security

#### Firewall Configuration

```bash
#!/bin/bash
# Comprehensive firewall setup for Trilium server

# Flush existing rules
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X
iptables -t mangle -F
iptables -t mangle -X

# Set default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Allow established connections
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# SSH access (change port as needed)
iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT

# HTTPS only for Trilium (block direct HTTP access)
iptables -A INPUT -p tcp --dport 443 -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT

# Rate limiting for SSH
iptables -A INPUT -p tcp --dport 22 -m recent --set --name SSH
iptables -A INPUT -p tcp --dport 22 -m recent --update --seconds 60 --hitcount 4 --name SSH -j DROP

# Rate limiting for HTTPS
iptables -A INPUT -p tcp --dport 443 -m recent --set --name HTTPS
iptables -A INPUT -p tcp --dport 443 -m recent --update --seconds 1 --hitcount 20 --name HTTPS -j DROP

# ICMP (ping) - limited
iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit 1/second -j ACCEPT

# Block common attack patterns
iptables -A INPUT -p tcp --tcp-flags ALL NONE -j DROP
iptables -A INPUT -p tcp --tcp-flags ALL ALL -j DROP
iptables -A INPUT -p tcp --tcp-flags ALL FIN,URG,PSH -j DROP
iptables -A INPUT -p tcp --tcp-flags ALL SYN,RST,ACK,FIN,URG -j DROP

# Log dropped packets
iptables -A INPUT -j LOG --log-prefix "IPTABLES-DROPPED: " --log-level 4
iptables -A INPUT -j DROP

# Save rules (Ubuntu/Debian)
iptables-save > /etc/iptables/rules.v4

# Install UFW for easier management
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 443/tcp
ufw limit ssh
ufw --force enable
```

#### VPN Access Configuration

```bash
# WireGuard VPN setup for secure remote access
# Server configuration
cat > /etc/wireguard/wg0.conf << EOF
[Interface]
PrivateKey = $(wg genkey)
Address = 10.100.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Client configuration template
[Peer]
PublicKey = CLIENT_PUBLIC_KEY
AllowedIPs = 10.100.0.2/32
EOF

# Enable IP forwarding
echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf
sysctl -p

# Start WireGuard
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

# Firewall rule for VPN
ufw allow 51820/udp
```

## Infrastructure Hardening

### Operating System Security

#### System Hardening

```bash
#!/bin/bash
# Comprehensive OS hardening script

# Update system
apt update && apt upgrade -y

# Install security tools
apt install -y fail2ban unattended-upgrades apt-listchanges

# Automatic security updates
cat > /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

# Configure unattended upgrades for security only
sed -i 's/\/\/\s*"\${distro_id}:\${distro_codename}-security";/"\${distro_id}:\${distro_codename}-security";/' /etc/apt/apt.conf.d/50unattended-upgrades

# Secure kernel parameters
cat > /etc/sysctl.d/99-security.conf << EOF
# IP Spoofing protection
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.rp_filter = 1

# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0

# Ignore send redirects
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Disable source packet routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0

# Log Martians
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1

# Ignore ICMP ping requests
net.ipv4.icmp_echo_ignore_all = 0

# Ignore Directed pings
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Disable IPv6 if not used
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1

# Enable TCP SYN Cookies
net.ipv4.tcp_syncookies = 1

# Disable core dumps
fs.suid_dumpable = 0

# Hide kernel pointers
kernel.kptr_restrict = 2

# Restrict dmesg
kernel.dmesg_restrict = 1

# Restrict perf events
kernel.perf_event_paranoid = 2
EOF

sysctl -p /etc/sysctl.d/99-security.conf

# Secure shared memory
echo "tmpfs /run/shm tmpfs defaults,noexec,nosuid 0 0" >> /etc/fstab

# Configure fail2ban
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Setup log rotation
cat > /etc/logrotate.d/trilium << EOF
/opt/trilium/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 trilium trilium
    postrotate
        systemctl reload trilium
    endscript
}
EOF

# Secure file permissions
chmod 600 /etc/ssh/sshd_config
chmod 700 /root
chmod 644 /etc/passwd
chmod 644 /etc/group
chmod 600 /etc/shadow
chmod 600 /etc/gshadow

# Remove unnecessary packages
apt autoremove -y
apt autoclean
```

#### SSH Hardening

```bash
# SSH configuration hardening
cat > /etc/ssh/sshd_config << EOF
# Protocol and encryption
Protocol 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key

# Key exchange, cipher, and MAC algorithms
KexAlgorithms curve25519-sha256@libssh.org,ecdh-sha2-nistp521,ecdh-sha2-nistp384,ecdh-sha2-nistp256,diffie-hellman-group-exchange-sha256
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr
MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com,hmac-sha2-256,hmac-sha2-512

# Authentication
LoginGraceTime 30
PermitRootLogin no
StrictModes yes
MaxAuthTries 3
MaxSessions 2
PubkeyAuthentication yes
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes

# Network settings
Port 22
AddressFamily inet
ListenAddress 0.0.0.0
TCPKeepAlive yes
ClientAliveInterval 300
ClientAliveCountMax 2

# Logging
SyslogFacility AUTH
LogLevel VERBOSE

# File transfer
AllowAgentForwarding no
AllowTcpForwarding no
GatewayPorts no
X11Forwarding no
PrintMotd no
PrintLastLog yes
UsePrivilegeSeparation sandbox

# User restrictions
DenyUsers root
AllowUsers trilium

# Miscellaneous
Compression delayed
UseDNS no
PermitUserEnvironment no
Banner /etc/ssh/banner
EOF

# Create SSH banner
cat > /etc/ssh/banner << EOF
***************************************************************************
                            AUTHORIZED ACCESS ONLY
***************************************************************************
This system is for authorized users only. All activities are monitored
and recorded. Unauthorized access is strictly prohibited and will be
prosecuted to the full extent of the law.
***************************************************************************
EOF

# Restart SSH service
systemctl restart sshd
```

### Database Security

#### SQLite Security Configuration

```bash
#!/bin/bash
# Secure SQLite database configuration

# Set proper file permissions
TRILIUM_DATA_DIR="/opt/trilium/data"
DATABASE_FILE="$TRILIUM_DATA_DIR/document.db"

# Create trilium user if not exists
if ! id -u trilium >/dev/null 2>&1; then
    useradd -r -s /bin/false -M trilium
fi

# Set ownership and permissions
chown -R trilium:trilium "$TRILIUM_DATA_DIR"
chmod 700 "$TRILIUM_DATA_DIR"
chmod 600 "$DATABASE_FILE"
chmod 600 "$TRILIUM_DATA_DIR"/*.txt
chmod 600 "$TRILIUM_DATA_DIR"/*.ini

# Configure database security settings
sqlite3 "$DATABASE_FILE" << EOF
-- Enable WAL mode for better concurrency
PRAGMA journal_mode=WAL;

-- Secure delete
PRAGMA secure_delete=ON;

-- Auto vacuum for better space management
PRAGMA auto_vacuum=INCREMENTAL;

-- Foreign key constraints
PRAGMA foreign_keys=ON;

-- Integrity check
PRAGMA integrity_check;
EOF

# Set up database backup with encryption
cat > /usr/local/bin/trilium-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/trilium/backups"
DATE=$(date +%Y%m%d_%H%M%S)
GPG_RECIPIENT="trilium-backup@yourdomain.com"

mkdir -p "$BACKUP_DIR"

# Create backup
sqlite3 /opt/trilium/data/document.db ".backup /tmp/trilium_backup_$DATE.db"

# Encrypt backup
tar czf - -C /opt/trilium/data . | gpg --trust-model always --encrypt -r "$GPG_RECIPIENT" > "$BACKUP_DIR/trilium_backup_$DATE.tar.gz.gpg"

# Clean up
rm -f "/tmp/trilium_backup_$DATE.db"

# Remove old backups (keep 30 days)
find "$BACKUP_DIR" -name "*.gpg" -mtime +30 -delete

# Set permissions
chown trilium:trilium "$BACKUP_DIR"/*.gpg
chmod 600 "$BACKUP_DIR"/*.gpg
EOF

chmod +x /usr/local/bin/trilium-backup.sh

# Add to crontab for daily backups
echo "0 2 * * * /usr/local/bin/trilium-backup.sh" | crontab -u trilium -
```

### Monitoring and Logging

#### Comprehensive Logging Setup

```bash
#!/bin/bash
# Setup comprehensive logging for Trilium

# Install log monitoring tools
apt install -y rsyslog logwatch logrotate auditd

# Configure auditd for file system monitoring
cat > /etc/audit/rules.d/trilium.rules << EOF
# Monitor Trilium directory
-w /opt/trilium/data/ -p wa -k trilium_data
-w /opt/trilium/data/document.db -p wa -k trilium_database
-w /etc/systemd/system/trilium.service -p wa -k trilium_config

# Monitor authentication
-w /var/log/auth.log -p wa -k auth_log
-w /etc/passwd -p wa -k passwd_changes
-w /etc/group -p wa -k group_changes
-w /etc/shadow -p wa -k shadow_changes

# Monitor network configuration
-w /etc/hosts -p wa -k network_config
-w /etc/network/ -p wa -k network_config

# Monitor sudoers
-w /etc/sudoers -p wa -k sudoers_changes
-w /etc/sudoers.d/ -p wa -k sudoers_changes
EOF

# Configure rsyslog for Trilium
cat > /etc/rsyslog.d/trilium.conf << EOF
# Trilium application logs
if $programname == 'trilium' then /var/log/trilium/trilium.log
& stop

# Trilium security events
:msg, contains, "trilium" /var/log/trilium/security.log
& stop

# Rotate logs
\$WorkDirectory /var/spool/rsyslog
\$ActionFileDefaultTemplate RSYSLOG_TraditionalFileFormat
\$RepeatedMsgReduction on
\$FileOwner trilium
\$FileGroup adm
\$FileCreateMode 0640
\$DirCreateMode 0755
\$Umask 0022
EOF

# Create log directories
mkdir -p /var/log/trilium
chown trilium:adm /var/log/trilium
chmod 750 /var/log/trilium

# Configure log rotation for Trilium
cat > /etc/logrotate.d/trilium << EOF
/var/log/trilium/*.log {
    daily
    missingok
    rotate 90
    compress
    delaycompress
    notifempty
    create 640 trilium adm
    sharedscripts
    postrotate
        systemctl reload rsyslog
    endscript
}
EOF

# Setup log monitoring script
cat > /usr/local/bin/trilium-log-monitor.sh << 'EOF'
#!/bin/bash
# Monitor Trilium logs for security events

LOG_FILE="/var/log/trilium/security.log"
ALERT_EMAIL="admin@yourdomain.com"

# Check for failed login attempts
FAILED_LOGINS=$(grep -c "Failed login" "$LOG_FILE" 2>/dev/null || echo 0)
if [ "$FAILED_LOGINS" -gt 5 ]; then
    echo "Alert: $FAILED_LOGINS failed login attempts detected in Trilium" | \
    mail -s "Trilium Security Alert" "$ALERT_EMAIL"
fi

# Check for CSRF violations
CSRF_VIOLATIONS=$(grep -c "CSRF violation" "$LOG_FILE" 2>/dev/null || echo 0)
if [ "$CSRF_VIOLATIONS" -gt 0 ]; then
    echo "Alert: $CSRF_VIOLATIONS CSRF violations detected in Trilium" | \
    mail -s "Trilium Security Alert" "$ALERT_EMAIL"
fi

# Check for unusual access patterns
UNUSUAL_ACCESS=$(grep -c "Unusual access" "$LOG_FILE" 2>/dev/null || echo 0)
if [ "$UNUSUAL_ACCESS" -gt 0 ]; then
    echo "Alert: $UNUSUAL_ACCESS unusual access patterns detected in Trilium" | \
    mail -s "Trilium Security Alert" "$ALERT_EMAIL"
fi
EOF

chmod +x /usr/local/bin/trilium-log-monitor.sh

# Add to crontab for monitoring
echo "*/15 * * * * /usr/local/bin/trilium-log-monitor.sh" | crontab -u root -

# Restart services
systemctl restart auditd
systemctl restart rsyslog
```

## Application Security Configuration

### Trilium Configuration Hardening

#### Security Configuration

```ini
# config.ini - Production security configuration
[General]
# Disable authentication only for localhost/VPN access
noAuthentication=false

# Enable additional security logging
securityLogging=true

# Set minimum password length
passwordMinLength=12

# Session security
[Session]
# Shorter session timeout for security
cookieMaxAge=3600

# Secure cookie settings (HTTPS required)
cookieSecure=true
cookieSameSite=strict
cookieHttpOnly=true

# Session secret rotation
sessionSecretRotationDays=30

# Database settings
[Database]
# Enable database encryption at rest
encryptionEnabled=true

# Regular integrity checks
integrityCheckInterval=86400

# Backup encryption
backupEncryption=true

# API Security
[ETAPI]
# Rate limiting
rateLimitRequests=100
rateLimitWindow=60

# Token expiration
tokenExpirationDays=90

# Require API token for all operations
requireTokenForRead=true

# Protected Session
[ProtectedSession]
# Shorter timeout for protected sessions
timeout=600

# Warning before timeout
timeoutWarning=true

# Auto-logout on browser close
autoLogoutOnClose=true

# Content Security Policy
[CSP]
# Strict CSP for XSS protection
enabled=true
scriptSrc='self' 'unsafe-inline'
styleSrc='self' 'unsafe-inline'
imgSrc='self' data: https:
connectSrc='self'
fontSrc='self' data:
objectSrc='none'
mediaSrc='self'
frameSrc='none'
```

#### Environment Variables for Security

```bash
# Trilium security environment variables
export TRILIUM_ENV=production
export TRILIUM_PORT=8080
export TRILIUM_HOST=127.0.0.1

# Security settings
export TRILIUM_PASSWORD_MIN_LENGTH=12
export TRILIUM_SESSION_TIMEOUT=3600
export TRILIUM_PROTECTED_SESSION_TIMEOUT=600
export TRILIUM_MFA_REQUIRED=true

# Database security
export TRILIUM_DB_ENCRYPTION=true
export TRILIUM_BACKUP_ENCRYPTION=true

# Logging
export TRILIUM_LOG_LEVEL=info
export TRILIUM_SECURITY_LOGGING=true
export TRILIUM_AUDIT_LOGGING=true

# API security
export TRILIUM_ETAPI_RATE_LIMIT=100
export TRILIUM_ETAPI_TOKEN_EXPIRATION=90

# Content Security Policy
export TRILIUM_CSP_ENABLED=true
export TRILIUM_HSTS_ENABLED=true
```

### Security Headers Configuration

```typescript
// Enhanced security headers for Trilium
const securityHeaders = {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // HSTS (only over HTTPS)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Permissions policy
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()',
    
    // Content Security Policy
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "media-src 'self'",
        "object-src 'none'",
        "child-src 'none'",
        "frame-src 'none'",
        "worker-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "upgrade-insecure-requests",
        "block-all-mixed-content"
    ].join('; ')
};
```

## Data Protection

### Backup Security Strategy

#### Encrypted Backup Implementation

```bash
#!/bin/bash
# Comprehensive encrypted backup strategy

BACKUP_CONFIG_FILE="/etc/trilium/backup.conf"
GPG_KEY_ID="trilium-backup@yourdomain.com"
BACKUP_BASE_DIR="/opt/trilium/backups"
RETENTION_DAYS=90

# Load configuration
source "$BACKUP_CONFIG_FILE"

backup_trilium() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="trilium_backup_$timestamp"
    local temp_dir="/tmp/$backup_name"
    
    echo "Starting Trilium backup: $backup_name"
    
    # Create temporary directory
    mkdir -p "$temp_dir"
    
    # Stop Trilium for consistent backup
    systemctl stop trilium
    
    # Copy data files
    cp -r /opt/trilium/data/* "$temp_dir/"
    
    # Copy configuration
    cp /opt/trilium/config.ini "$temp_dir/"
    
    # Database integrity check
    sqlite3 "$temp_dir/document.db" "PRAGMA integrity_check;" > "$temp_dir/integrity_check.log"
    
    # Create backup manifest
    cat > "$temp_dir/backup_manifest.txt" << EOF
Backup Date: $(date -Iseconds)
Trilium Version: $(cat /opt/trilium/package.json | jq -r .version)
Database Size: $(stat -c%s "$temp_dir/document.db" | numfmt --to=iec)
Files Included:
$(find "$temp_dir" -type f -exec basename {} \;)
Checksum:
$(find "$temp_dir" -type f -exec sha256sum {} \;)
EOF
    
    # Create encrypted archive
    tar czf - -C /tmp "$backup_name" | \
    gpg --trust-model always --cipher-algo AES256 --compress-algo 2 \
        --symmetric --passphrase-file /etc/trilium/backup_passphrase \
        --output "$BACKUP_BASE_DIR/${backup_name}.tar.gz.gpg"
    
    # Verify backup
    if gpg --quiet --batch --passphrase-file /etc/trilium/backup_passphrase \
           --decrypt "$BACKUP_BASE_DIR/${backup_name}.tar.gz.gpg" | tar tz > /dev/null; then
        echo "Backup verification successful"
    else
        echo "Backup verification failed!" >&2
        exit 1
    fi
    
    # Clean up
    rm -rf "$temp_dir"
    
    # Start Trilium
    systemctl start trilium
    
    # Set permissions
    chown trilium:trilium "$BACKUP_BASE_DIR/${backup_name}.tar.gz.gpg"
    chmod 600 "$BACKUP_BASE_DIR/${backup_name}.tar.gz.gpg"
    
    echo "Backup completed: $BACKUP_BASE_DIR/${backup_name}.tar.gz.gpg"
}

restore_trilium() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        echo "Backup file not found: $backup_file" >&2
        exit 1
    fi
    
    echo "Restoring from backup: $backup_file"
    
    # Stop Trilium
    systemctl stop trilium
    
    # Backup current data
    local current_backup="/opt/trilium/data.backup.$(date +%Y%m%d_%H%M%S)"
    mv /opt/trilium/data "$current_backup"
    
    # Extract backup
    mkdir -p /opt/trilium/data
    gpg --quiet --batch --passphrase-file /etc/trilium/backup_passphrase \
        --decrypt "$backup_file" | tar xzf - -C /opt/trilium/data --strip-components=1
    
    # Verify database integrity
    if sqlite3 /opt/trilium/data/document.db "PRAGMA integrity_check;" | grep -q "ok"; then
        echo "Database integrity check passed"
    else
        echo "Database integrity check failed!" >&2
        echo "Restoring original data..."
        rm -rf /opt/trilium/data
        mv "$current_backup" /opt/trilium/data
        exit 1
    fi
    
    # Set permissions
    chown -R trilium:trilium /opt/trilium/data
    chmod 700 /opt/trilium/data
    chmod 600 /opt/trilium/data/*
    
    # Start Trilium
    systemctl start trilium
    
    echo "Restore completed successfully"
}

cleanup_old_backups() {
    echo "Cleaning up backups older than $RETENTION_DAYS days"
    find "$BACKUP_BASE_DIR" -name "*.tar.gz.gpg" -mtime +$RETENTION_DAYS -delete
}

# Main execution
case "$1" in
    backup)
        backup_trilium
        cleanup_old_backups
        ;;
    restore)
        restore_trilium "$2"
        ;;
    cleanup)
        cleanup_old_backups
        ;;
    *)
        echo "Usage: $0 {backup|restore <file>|cleanup}"
        exit 1
        ;;
esac
```

#### Backup Configuration

```bash
# /etc/trilium/backup.conf
BACKUP_FREQUENCY="daily"
BACKUP_TIME="02:00"
BACKUP_RETENTION_DAYS=90
BACKUP_LOCATION="/opt/trilium/backups"
REMOTE_BACKUP_ENABLED=true
REMOTE_BACKUP_HOST="backup.yourdomain.com"
REMOTE_BACKUP_USER="trilium-backup"
VERIFICATION_ENABLED=true
COMPRESSION_LEVEL=6
```

#### Remote Backup Synchronization

```bash
#!/bin/bash
# Secure remote backup synchronization

REMOTE_HOST="backup.yourdomain.com"
REMOTE_USER="trilium-backup"
REMOTE_PATH="/backups/trilium"
LOCAL_BACKUP_DIR="/opt/trilium/backups"

# Sync backups to remote location
sync_remote_backups() {
    echo "Syncing backups to remote location..."
    
    rsync -avz --progress --delete \
        -e "ssh -i /home/trilium/.ssh/backup_key -o StrictHostKeyChecking=yes" \
        "$LOCAL_BACKUP_DIR/" \
        "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"
    
    if [ $? -eq 0 ]; then
        echo "Remote backup sync completed successfully"
    else
        echo "Remote backup sync failed" >&2
        exit 1
    fi
}

# Verify remote backups
verify_remote_backups() {
    echo "Verifying remote backups..."
    
    ssh -i /home/trilium/.ssh/backup_key \
        "$REMOTE_USER@$REMOTE_HOST" \
        "find $REMOTE_PATH -name '*.tar.gz.gpg' -mtime -1 | wc -l"
}

# Setup SSH key for backup user
setup_backup_ssh() {
    # Generate SSH key for backup user
    sudo -u trilium ssh-keygen -t ed25519 -f /home/trilium/.ssh/backup_key -N ""
    
    # Set proper permissions
    chown trilium:trilium /home/trilium/.ssh/backup_key*
    chmod 600 /home/trilium/.ssh/backup_key
    chmod 644 /home/trilium/.ssh/backup_key.pub
    
    echo "SSH key generated. Add the following public key to the remote backup server:"
    cat /home/trilium/.ssh/backup_key.pub
}

case "$1" in
    sync)
        sync_remote_backups
        ;;
    verify)
        verify_remote_backups
        ;;
    setup-ssh)
        setup_backup_ssh
        ;;
    *)
        echo "Usage: $0 {sync|verify|setup-ssh}"
        exit 1
        ;;
esac
```

### Data Loss Prevention

#### File Integrity Monitoring

```bash
#!/bin/bash
# File integrity monitoring for Trilium

TRILIUM_DATA_DIR="/opt/trilium/data"
CHECKSUM_FILE="/var/lib/trilium/checksums.db"
ALERT_EMAIL="admin@yourdomain.com"

# Initialize checksum database
init_checksums() {
    echo "Initializing file integrity monitoring..."
    
    sqlite3 "$CHECKSUM_FILE" << EOF
CREATE TABLE IF NOT EXISTS file_checksums (
    path TEXT PRIMARY KEY,
    checksum TEXT NOT NULL,
    size INTEGER NOT NULL,
    mtime INTEGER NOT NULL,
    last_check INTEGER NOT NULL
);
EOF
    
    update_checksums
}

# Update checksums for all files
update_checksums() {
    echo "Updating file checksums..."
    
    while IFS= read -r -d '' file; do
        if [ -f "$file" ]; then
            local checksum=$(sha256sum "$file" | cut -d' ' -f1)
            local size=$(stat -c%s "$file")
            local mtime=$(stat -c%Y "$file")
            local now=$(date +%s)
            
            sqlite3 "$CHECKSUM_FILE" << EOF
INSERT OR REPLACE INTO file_checksums 
(path, checksum, size, mtime, last_check)
VALUES ('$file', '$checksum', $size, $mtime, $now);
EOF
        fi
    done < <(find "$TRILIUM_DATA_DIR" -type f -print0)
}

# Check file integrity
check_integrity() {
    echo "Checking file integrity..."
    
    local violations=0
    
    while IFS='|' read -r path stored_checksum stored_size stored_mtime; do
        if [ -f "$path" ]; then
            local current_checksum=$(sha256sum "$path" | cut -d' ' -f1)
            local current_size=$(stat -c%s "$path")
            local current_mtime=$(stat -c%Y "$path")
            
            if [ "$current_checksum" != "$stored_checksum" ] || 
               [ "$current_size" != "$stored_size" ] ||
               [ "$current_mtime" != "$stored_mtime" ]; then
                
                echo "INTEGRITY VIOLATION: $path"
                echo "  Expected checksum: $stored_checksum"
                echo "  Current checksum:  $current_checksum"
                echo "  Expected size: $stored_size"
                echo "  Current size:  $current_size"
                
                violations=$((violations + 1))
            fi
        else
            echo "FILE MISSING: $path"
            violations=$((violations + 1))
        fi
    done < <(sqlite3 "$CHECKSUM_FILE" "SELECT path, checksum, size, mtime FROM file_checksums;" | tr ' ' '|')
    
    if [ $violations -gt 0 ]; then
        echo "ALERT: $violations integrity violations detected!" >&2
        echo "File integrity violations detected in Trilium data directory" | \
        mail -s "Trilium Integrity Alert" "$ALERT_EMAIL"
        return 1
    else
        echo "File integrity check passed"
        return 0
    fi
}

# Generate integrity report
generate_report() {
    local report_file="/var/log/trilium/integrity_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
Trilium File Integrity Report
Generated: $(date -Iseconds)

File Count: $(sqlite3 "$CHECKSUM_FILE" "SELECT COUNT(*) FROM file_checksums;")
Last Check: $(date -d "@$(sqlite3 "$CHECKSUM_FILE" "SELECT MAX(last_check) FROM file_checksums;")")

Files by Type:
$(sqlite3 "$CHECKSUM_FILE" "
SELECT 
    CASE 
        WHEN path LIKE '%.db' THEN 'Database'
        WHEN path LIKE '%.log' THEN 'Log'
        WHEN path LIKE '%.ini' THEN 'Config'
        WHEN path LIKE '%.txt' THEN 'Text'
        ELSE 'Other'
    END as type,
    COUNT(*) as count
FROM file_checksums 
GROUP BY type;
")

Total Data Size: $(sqlite3 "$CHECKSUM_FILE" "SELECT SUM(size) FROM file_checksums;" | numfmt --to=iec)
EOF
    
    echo "Integrity report generated: $report_file"
}

case "$1" in
    init)
        init_checksums
        ;;
    update)
        update_checksums
        ;;
    check)
        check_integrity
        ;;
    report)
        generate_report
        ;;
    *)
        echo "Usage: $0 {init|update|check|report}"
        exit 1
        ;;
esac
```

## Operational Security

### Security Monitoring and Alerting

#### Real-time Security Monitoring

```python
#!/usr/bin/env python3
"""
Trilium Security Monitoring System
Real-time monitoring and alerting for security events
"""

import sqlite3
import time
import smtplib
import json
import logging
from datetime import datetime, timedelta
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from typing import Dict, List, Any
import configparser

class TriliumSecurityMonitor:
    def __init__(self, config_file: str):
        self.config = configparser.ConfigParser()
        self.config.read(config_file)
        
        self.db_path = self.config.get('database', 'path')
        self.log_path = self.config.get('logging', 'path')
        self.alert_email = self.config.get('alerts', 'email')
        self.smtp_server = self.config.get('smtp', 'server')
        self.smtp_port = self.config.getint('smtp', 'port')
        self.smtp_user = self.config.get('smtp', 'user')
        self.smtp_password = self.config.get('smtp', 'password')
        
        # Thresholds
        self.failed_login_threshold = self.config.getint('thresholds', 'failed_logins')
        self.time_window_minutes = self.config.getint('thresholds', 'time_window')
        
        # Setup logging
        logging.basicConfig(
            filename=self.log_path,
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
    
    def connect_db(self) -> sqlite3.Connection:
        """Connect to Trilium database"""
        return sqlite3.connect(self.db_path)
    
    def check_failed_logins(self) -> Dict[str, Any]:
        """Check for excessive failed login attempts"""
        with self.connect_db() as conn:
            cursor = conn.cursor()
            
            # Check for failed logins in the last time window
            time_threshold = datetime.now() - timedelta(minutes=self.time_window_minutes)
            
            cursor.execute("""
                SELECT data, COUNT(*) as count
                FROM security_events 
                WHERE type = 'login_failure' 
                AND timestamp > ?
                GROUP BY JSON_EXTRACT(data, '$.ip')
                HAVING count > ?
            """, (time_threshold.isoformat(), self.failed_login_threshold))
            
            results = cursor.fetchall()
            
            if results:
                return {
                    'alert_type': 'failed_logins',
                    'severity': 'HIGH',
                    'count': len(results),
                    'details': results
                }
        
        return None
    
    def check_csrf_violations(self) -> Dict[str, Any]:
        """Check for CSRF violations"""
        with self.connect_db() as conn:
            cursor = conn.cursor()
            
            time_threshold = datetime.now() - timedelta(minutes=self.time_window_minutes)
            
            cursor.execute("""
                SELECT COUNT(*) as count, data
                FROM security_events 
                WHERE type = 'csrf_violation' 
                AND timestamp > ?
            """, (time_threshold.isoformat(),))
            
            result = cursor.fetchone()
            
            if result and result[0] > 0:
                return {
                    'alert_type': 'csrf_violations',
                    'severity': 'HIGH',
                    'count': result[0],
                    'details': result[1]
                }
        
        return None
    
    def check_database_integrity(self) -> Dict[str, Any]:
        """Check database integrity"""
        try:
            with self.connect_db() as conn:
                cursor = conn.cursor()
                cursor.execute("PRAGMA integrity_check;")
                result = cursor.fetchone()
                
                if result[0] != 'ok':
                    return {
                        'alert_type': 'database_integrity',
                        'severity': 'CRITICAL',
                        'result': result[0]
                    }
        except Exception as e:
            return {
                'alert_type': 'database_error',
                'severity': 'CRITICAL',
                'error': str(e)
            }
        
        return None
    
    def check_unusual_activity(self) -> Dict[str, Any]:
        """Check for unusual activity patterns"""
        with self.connect_db() as conn:
            cursor = conn.cursor()
            
            # Check for sessions from new IPs
            cursor.execute("""
                SELECT JSON_EXTRACT(data, '$.ip') as ip, COUNT(*) as count
                FROM security_events 
                WHERE type = 'session_create'
                AND timestamp > datetime('now', '-1 hour')
                GROUP BY ip
                HAVING count > 10
            """)
            
            unusual_ips = cursor.fetchall()
            
            if unusual_ips:
                return {
                    'alert_type': 'unusual_activity',
                    'severity': 'MEDIUM',
                    'ips': unusual_ips
                }
        
        return None
    
    def send_alert(self, alert: Dict[str, Any]):
        """Send security alert via email"""
        try:
            msg = MimeMultipart()
            msg['From'] = self.smtp_user
            msg['To'] = self.alert_email
            msg['Subject'] = f"Trilium Security Alert - {alert['alert_type'].upper()}"
            
            body = f"""
Security Alert Detected

Alert Type: {alert['alert_type']}
Severity: {alert['severity']}
Time: {datetime.now().isoformat()}

Details:
{json.dumps(alert, indent=2)}

Please investigate immediately.
            """
            
            msg.attach(MimeText(body, 'plain'))
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)
            server.quit()
            
            self.logger.info(f"Alert sent: {alert['alert_type']}")
            
        except Exception as e:
            self.logger.error(f"Failed to send alert: {e}")
    
    def run_monitoring_cycle(self):
        """Run one monitoring cycle"""
        self.logger.info("Starting monitoring cycle")
        
        checks = [
            self.check_failed_logins,
            self.check_csrf_violations,
            self.check_database_integrity,
            self.check_unusual_activity
        ]
        
        for check in checks:
            try:
                alert = check()
                if alert:
                    self.logger.warning(f"Security alert: {alert['alert_type']}")
                    self.send_alert(alert)
            except Exception as e:
                self.logger.error(f"Error in check {check.__name__}: {e}")
        
        self.logger.info("Monitoring cycle completed")
    
    def run_continuous(self, interval_seconds: int = 300):
        """Run continuous monitoring"""
        self.logger.info("Starting continuous security monitoring")
        
        while True:
            try:
                self.run_monitoring_cycle()
                time.sleep(interval_seconds)
            except KeyboardInterrupt:
                self.logger.info("Monitoring stopped by user")
                break
            except Exception as e:
                self.logger.error(f"Unexpected error: {e}")
                time.sleep(60)  # Wait before retrying

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python3 trilium_security_monitor.py <config_file>")
        sys.exit(1)
    
    monitor = TriliumSecurityMonitor(sys.argv[1])
    monitor.run_continuous()
```

#### Configuration for Security Monitor

```ini
# /etc/trilium/security_monitor.conf
[database]
path = /opt/trilium/data/document.db

[logging]
path = /var/log/trilium/security_monitor.log

[alerts]
email = admin@yourdomain.com

[smtp]
server = smtp.gmail.com
port = 587
user = trilium-alerts@yourdomain.com
password = your-app-password

[thresholds]
failed_logins = 5
time_window = 15
```

### Incident Response Procedures

#### Automated Incident Response

```bash
#!/bin/bash
# Automated incident response for Trilium

INCIDENT_LOG="/var/log/trilium/incidents.log"
BACKUP_DIR="/opt/trilium/incident_backups"
ADMIN_EMAIL="admin@yourdomain.com"

log_incident() {
    local incident_type="$1"
    local severity="$2"
    local description="$3"
    
    local timestamp=$(date -Iseconds)
    local incident_id="INC-$(date +%Y%m%d-%H%M%S)"
    
    echo "[$timestamp] [$incident_id] [$severity] [$incident_type] $description" >> "$INCIDENT_LOG"
    
    # Send immediate notification for high severity
    if [ "$severity" = "HIGH" ] || [ "$severity" = "CRITICAL" ]; then
        echo "INCIDENT ALERT: $incident_id - $incident_type - $description" | \
        mail -s "CRITICAL: Trilium Security Incident $incident_id" "$ADMIN_EMAIL"
    fi
}

isolate_system() {
    log_incident "ISOLATION" "HIGH" "System isolation initiated"
    
    # Block all incoming connections except admin SSH
    iptables -P INPUT DROP
    iptables -A INPUT -i lo -j ACCEPT
    iptables -A INPUT -p tcp --dport 22 -s ADMIN_IP_RANGE -j ACCEPT
    iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
    
    # Stop Trilium service
    systemctl stop trilium
    
    # Create forensic backup
    create_forensic_backup
}

create_forensic_backup() {
    local backup_name="forensic_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    mkdir -p "$backup_path"
    
    # Copy database
    cp /opt/trilium/data/document.db "$backup_path/"
    
    # Copy logs
    cp -r /var/log/trilium "$backup_path/"
    
    # Copy configuration
    cp /opt/trilium/config.ini "$backup_path/"
    
    # System information
    uname -a > "$backup_path/system_info.txt"
    ps aux > "$backup_path/processes.txt"
    netstat -tulpn > "$backup_path/network.txt"
    
    # Calculate checksums
    find "$backup_path" -type f -exec sha256sum {} \; > "$backup_path/checksums.txt"
    
    # Encrypt backup
    tar czf - -C "$BACKUP_DIR" "$backup_name" | \
    gpg --symmetric --cipher-algo AES256 --output "$backup_path.tar.gz.gpg"
    
    rm -rf "$backup_path"
    
    log_incident "FORENSICS" "MEDIUM" "Forensic backup created: $backup_path.tar.gz.gpg"
}

investigate_failed_logins() {
    local threshold="$1"
    local time_window="$2"
    
    # Check for failed login patterns
    local failed_attempts=$(sqlite3 /opt/trilium/data/document.db "
        SELECT COUNT(*) FROM security_events 
        WHERE type = 'login_failure' 
        AND timestamp > datetime('now', '-$time_window minutes')
    ")
    
    if [ "$failed_attempts" -gt "$threshold" ]; then
        log_incident "BRUTE_FORCE" "HIGH" "Excessive failed login attempts detected: $failed_attempts"
        
        # Extract attacking IPs
        sqlite3 /opt/trilium/data/document.db "
            SELECT JSON_EXTRACT(data, '$.ip') as ip, COUNT(*) as count
            FROM security_events 
            WHERE type = 'login_failure'
            AND timestamp > datetime('now', '-$time_window minutes')
            GROUP BY ip
            ORDER BY count DESC
        " > /tmp/attack_ips.txt
        
        # Block attacking IPs
        while read ip count; do
            if [ "$count" -gt 3 ]; then
                iptables -A INPUT -s "$ip" -j DROP
                log_incident "IP_BLOCK" "MEDIUM" "Blocked attacking IP: $ip ($count attempts)"
            fi
        done < /tmp/attack_ips.txt
        
        rm /tmp/attack_ips.txt
    fi
}

check_data_integrity() {
    # Database integrity check
    local integrity_result=$(sqlite3 /opt/trilium/data/document.db "PRAGMA integrity_check;")
    
    if [ "$integrity_result" != "ok" ]; then
        log_incident "DATA_CORRUPTION" "CRITICAL" "Database integrity check failed: $integrity_result"
        isolate_system
        return 1
    fi
    
    # File system integrity check
    if ! /usr/local/bin/trilium-integrity-check.sh check; then
        log_incident "FILE_CORRUPTION" "HIGH" "File integrity check failed"
        create_forensic_backup
    fi
}

restore_from_backup() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        log_incident "RESTORE_ERROR" "HIGH" "Backup file not found: $backup_file"
        return 1
    fi
    
    log_incident "RESTORE_START" "HIGH" "Starting restore from backup: $backup_file"
    
    # Stop services
    systemctl stop trilium
    
    # Backup current state
    mv /opt/trilium/data /opt/trilium/data.corrupt.$(date +%Y%m%d_%H%M%S)
    
    # Restore from backup
    if /usr/local/bin/trilium-backup.sh restore "$backup_file"; then
        log_incident "RESTORE_SUCCESS" "MEDIUM" "Restore completed successfully"
        systemctl start trilium
    else
        log_incident "RESTORE_FAILED" "CRITICAL" "Restore failed"
        return 1
    fi
}

generate_incident_report() {
    local start_time="$1"
    local end_time="$2"
    local report_file="/tmp/incident_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
TRILIUM SECURITY INCIDENT REPORT
Generated: $(date -Iseconds)
Period: $start_time to $end_time

INCIDENTS:
$(grep -A 5 -B 5 "\[$start_time\].*\[$end_time\]" "$INCIDENT_LOG")

SECURITY EVENTS:
$(sqlite3 /opt/trilium/data/document.db "
    SELECT timestamp, type, data 
    FROM security_events 
    WHERE timestamp BETWEEN '$start_time' AND '$end_time'
    ORDER BY timestamp DESC
")

SYSTEM STATUS:
Service Status: $(systemctl is-active trilium)
Database Integrity: $(sqlite3 /opt/trilium/data/document.db "PRAGMA integrity_check;")
Disk Usage: $(df -h /opt/trilium)
Memory Usage: $(free -h)

NETWORK STATUS:
$(netstat -tulpn | grep :8080)

EOF
    
    echo "Incident report generated: $report_file"
    
    # Email report
    mail -s "Trilium Incident Report" -a "$report_file" "$ADMIN_EMAIL" < "$report_file"
}

# Main incident response dispatcher
case "$1" in
    isolate)
        isolate_system
        ;;
    investigate-logins)
        investigate_failed_logins "${2:-5}" "${3:-15}"
        ;;
    check-integrity)
        check_data_integrity
        ;;
    restore)
        restore_from_backup "$2"
        ;;
    report)
        generate_incident_report "$2" "$3"
        ;;
    log)
        log_incident "$2" "$3" "$4"
        ;;
    *)
        echo "Usage: $0 {isolate|investigate-logins [threshold] [window]|check-integrity|restore <backup>|report <start> <end>|log <type> <severity> <description>}"
        exit 1
        ;;
esac
```

## Security Assessment

### Automated Security Assessment

```bash
#!/bin/bash
# Comprehensive Trilium security assessment

ASSESSMENT_DATE=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="/tmp/trilium_security_assessment_$ASSESSMENT_DATE.txt"
SCORE=0
MAX_SCORE=0

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

print_status() {
    local status="$1"
    local message="$2"
    local points="$3"
    
    case "$status" in
        "PASS")
            echo -e "${GREEN}[PASS]${NC} $message (+$points points)"
            SCORE=$((SCORE + points))
            ;;
        "FAIL")
            echo -e "${RED}[FAIL]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
    esac
    
    MAX_SCORE=$((MAX_SCORE + points))
}

check_https_configuration() {
    echo "=== HTTPS Configuration ==="
    
    # Check if HTTPS is enabled
    if curl -s -I https://localhost:8080 2>/dev/null | grep -q "HTTP/"; then
        print_status "PASS" "HTTPS is configured" 20
    else
        print_status "FAIL" "HTTPS is not configured" 20
    fi
    
    # Check SSL certificate validity
    if openssl s_client -connect localhost:443 -servername localhost </dev/null 2>/dev/null | grep -q "Verification: OK"; then
        print_status "PASS" "SSL certificate is valid" 10
    else
        print_status "WARN" "SSL certificate validation failed" 10
    fi
    
    # Check for secure ciphers
    local ciphers=$(nmap --script ssl-enum-ciphers -p 443 localhost 2>/dev/null | grep -c "TLS")
    if [ "$ciphers" -gt 0 ]; then
        print_status "PASS" "Secure TLS ciphers available" 10
    else
        print_status "WARN" "TLS cipher check inconclusive" 10
    fi
    
    echo
}

check_authentication_security() {
    echo "=== Authentication Security ==="
    
    # Check if password is set
    local password_set=$(sqlite3 /opt/trilium/data/document.db "SELECT value FROM options WHERE name = 'passwordVerificationHash';" 2>/dev/null)
    if [ -n "$password_set" ]; then
        print_status "PASS" "Password authentication is configured" 15
    else
        print_status "FAIL" "Password authentication is not configured" 15
    fi
    
    # Check MFA status
    local mfa_enabled=$(sqlite3 /opt/trilium/data/document.db "SELECT value FROM options WHERE name = 'mfaEnabled';" 2>/dev/null)
    if [ "$mfa_enabled" = "true" ]; then
        print_status "PASS" "Multi-factor authentication is enabled" 20
    else
        print_status "WARN" "Multi-factor authentication is not enabled" 20
    fi
    
    # Check session timeout
    local session_timeout=$(grep -i "cookieMaxAge" /opt/trilium/config.ini 2>/dev/null | cut -d'=' -f2)
    if [ "$session_timeout" -le 3600 ]; then
        print_status "PASS" "Session timeout is appropriately configured" 10
    else
        print_status "WARN" "Session timeout may be too long" 10
    fi
    
    echo
}

check_file_permissions() {
    echo "=== File Permissions ==="
    
    # Check database permissions
    local db_perms=$(stat -c "%a" /opt/trilium/data/document.db 2>/dev/null)
    if [ "$db_perms" = "600" ] || [ "$db_perms" = "640" ]; then
        print_status "PASS" "Database file permissions are secure" 10
    else
        print_status "FAIL" "Database file permissions are too permissive ($db_perms)" 10
    fi
    
    # Check data directory permissions
    local dir_perms=$(stat -c "%a" /opt/trilium/data 2>/dev/null)
    if [ "$dir_perms" = "700" ] || [ "$dir_perms" = "750" ]; then
        print_status "PASS" "Data directory permissions are secure" 10
    else
        print_status "FAIL" "Data directory permissions are too permissive ($dir_perms)" 10
    fi
    
    # Check config file permissions
    if [ -f /opt/trilium/config.ini ]; then
        local config_perms=$(stat -c "%a" /opt/trilium/config.ini)
        if [ "$config_perms" = "600" ] || [ "$config_perms" = "640" ]; then
            print_status "PASS" "Configuration file permissions are secure" 5
        else
            print_status "WARN" "Configuration file permissions could be more secure ($config_perms)" 5
        fi
    fi
    
    echo
}

check_network_security() {
    echo "=== Network Security ==="
    
    # Check firewall status
    if ufw status | grep -q "Status: active"; then
        print_status "PASS" "UFW firewall is active" 15
    elif iptables -L | grep -q "DROP"; then
        print_status "PASS" "Firewall rules are configured" 15
    else
        print_status "FAIL" "No firewall detected" 15
    fi
    
    # Check listening ports
    local listening_ports=$(netstat -tulpn | grep :8080 | wc -l)
    if [ "$listening_ports" -eq 1 ]; then
        print_status "PASS" "Trilium is listening on expected port only" 10
    else
        print_status "WARN" "Multiple services or unexpected ports detected" 10
    fi
    
    # Check for direct database access
    local db_ports=$(netstat -tulpn | grep -E ":1433|:3306|:5432" | wc -l)
    if [ "$db_ports" -eq 0 ]; then
        print_status "PASS" "No direct database ports exposed" 10
    else
        print_status "WARN" "Database ports may be exposed" 10
    fi
    
    echo
}

check_backup_security() {
    echo "=== Backup Security ==="
    
    # Check if backups exist
    if [ -d "/opt/trilium/backups" ] && [ "$(ls -A /opt/trilium/backups)" ]; then
        print_status "PASS" "Backup directory exists and contains files" 10
        
        # Check backup encryption
        local encrypted_backups=$(find /opt/trilium/backups -name "*.gpg" | wc -l)
        local total_backups=$(find /opt/trilium/backups -type f | wc -l)
        
        if [ "$encrypted_backups" -eq "$total_backups" ] && [ "$total_backups" -gt 0 ]; then
            print_status "PASS" "All backups are encrypted" 15
        elif [ "$encrypted_backups" -gt 0 ]; then
            print_status "WARN" "Some backups are encrypted ($encrypted_backups/$total_backups)" 15
        else
            print_status "FAIL" "No encrypted backups found" 15
        fi
    else
        print_status "FAIL" "No backup directory or backups found" 25
    fi
    
    echo
}

check_system_security() {
    echo "=== System Security ==="
    
    # Check system updates
    local updates_available=$(apt list --upgradable 2>/dev/null | grep -c "upgradable")
    if [ "$updates_available" -eq 0 ]; then
        print_status "PASS" "System is up to date" 10
    else
        print_status "WARN" "$updates_available updates available" 10
    fi
    
    # Check fail2ban
    if systemctl is-active --quiet fail2ban; then
        print_status "PASS" "Fail2ban is active" 10
    else
        print_status "WARN" "Fail2ban is not active" 10
    fi
    
    # Check SSH security
    if grep -q "PasswordAuthentication no" /etc/ssh/sshd_config 2>/dev/null; then
        print_status "PASS" "SSH password authentication disabled" 10
    else
        print_status "WARN" "SSH password authentication may be enabled" 10
    fi
    
    # Check for root login
    if grep -q "PermitRootLogin no" /etc/ssh/sshd_config 2>/dev/null; then
        print_status "PASS" "SSH root login disabled" 5
    else
        print_status "WARN" "SSH root login may be enabled" 5
    fi
    
    echo
}

check_database_security() {
    echo "=== Database Security ==="
    
    # Check database integrity
    local integrity_check=$(sqlite3 /opt/trilium/data/document.db "PRAGMA integrity_check;" 2>/dev/null)
    if [ "$integrity_check" = "ok" ]; then
        print_status "PASS" "Database integrity check passed" 15
    else
        print_status "FAIL" "Database integrity check failed" 15
    fi
    
    # Check for protected notes
    local protected_notes=$(sqlite3 /opt/trilium/data/document.db "SELECT COUNT(*) FROM notes WHERE isProtected = 1;" 2>/dev/null)
    if [ "$protected_notes" -gt 0 ]; then
        print_status "PASS" "Protected notes are configured" 10
    else
        print_status "WARN" "No protected notes found" 10
    fi
    
    # Check encryption settings
    local encryption_key=$(sqlite3 /opt/trilium/data/document.db "SELECT value FROM options WHERE name = 'encryptedDataKey';" 2>/dev/null)
    if [ -n "$encryption_key" ]; then
        print_status "PASS" "Encryption key is configured" 10
    else
        print_status "WARN" "No encryption key found" 10
    fi
    
    echo
}

check_log_security() {
    echo "=== Logging and Monitoring ==="
    
    # Check log directory
    if [ -d "/var/log/trilium" ]; then
        print_status "PASS" "Trilium log directory exists" 5
        
        # Check log permissions
        local log_perms=$(stat -c "%a" /var/log/trilium 2>/dev/null)
        if [ "$log_perms" = "750" ] || [ "$log_perms" = "755" ]; then
            print_status "PASS" "Log directory permissions are appropriate" 5
        else
            print_status "WARN" "Log directory permissions may be too restrictive or permissive" 5
        fi
    else
        print_status "WARN" "No dedicated Trilium log directory found" 10
    fi
    
    # Check for security event logging
    local security_events=$(sqlite3 /opt/trilium/data/document.db "SELECT COUNT(*) FROM security_events;" 2>/dev/null)
    if [ "$security_events" -gt 0 ]; then
        print_status "PASS" "Security events are being logged" 10
    else
        print_status "WARN" "No security events found in database" 10
    fi
    
    echo
}

generate_recommendations() {
    echo "=== Security Recommendations ==="
    
    if [ $SCORE -lt $((MAX_SCORE * 80 / 100)) ]; then
        echo "⚠️  Your Trilium installation has significant security issues that should be addressed immediately:"
        echo
        
        # Check specific issues and provide recommendations
        if ! curl -s -I https://localhost:8080 2>/dev/null | grep -q "HTTP/"; then
            echo "🔴 CRITICAL: Enable HTTPS immediately"
            echo "   - Configure SSL certificate"
            echo "   - Set up reverse proxy with HTTPS"
            echo "   - Redirect all HTTP traffic to HTTPS"
            echo
        fi
        
        local mfa_enabled=$(sqlite3 /opt/trilium/data/document.db "SELECT value FROM options WHERE name = 'mfaEnabled';" 2>/dev/null)
        if [ "$mfa_enabled" != "true" ]; then
            echo "🟡 HIGH: Enable Multi-Factor Authentication"
            echo "   - Go to Options → Security → Multi-Factor Authentication"
            echo "   - Generate TOTP secret and configure authenticator app"
            echo "   - Save recovery codes securely"
            echo
        fi
        
        if ! systemctl is-active --quiet fail2ban; then
            echo "🟡 MEDIUM: Install and configure fail2ban"
            echo "   - apt install fail2ban"
            echo "   - Configure jail rules for SSH and web services"
            echo "   - Monitor failed authentication attempts"
            echo
        fi
        
        if [ ! -d "/opt/trilium/backups" ] || [ ! "$(ls -A /opt/trilium/backups 2>/dev/null)" ]; then
            echo "🟡 HIGH: Set up encrypted backups"
            echo "   - Configure automated daily backups"
            echo "   - Encrypt backups with GPG"
            echo "   - Test backup restoration procedures"
            echo "   - Store backups in secure off-site location"
            echo
        fi
    fi
    
    echo "💡 General Security Best Practices:"
    echo "   - Keep system and Trilium updated"
    echo "   - Use strong, unique passwords"
    echo "   - Regularly review access logs"
    echo "   - Implement network segmentation"
    echo "   - Monitor for security events"
    echo "   - Maintain incident response procedures"
    echo
}

# Main assessment execution
{
    echo "TRILIUM SECURITY ASSESSMENT REPORT"
    echo "Generated: $(date -Iseconds)"
    echo "=========================================="
    echo
    
    check_https_configuration
    check_authentication_security
    check_file_permissions
    check_network_security
    check_backup_security
    check_system_security
    check_database_security
    check_log_security
    
    echo "=========================================="
    echo "ASSESSMENT SUMMARY"
    echo "=========================================="
    echo "Score: $SCORE / $MAX_SCORE ($(($SCORE * 100 / $MAX_SCORE))%)"
    echo
    
    if [ $SCORE -eq $MAX_SCORE ]; then
        echo "🎉 EXCELLENT: Your Trilium installation follows security best practices!"
    elif [ $SCORE -ge $((MAX_SCORE * 80 / 100)) ]; then
        echo "✅ GOOD: Your Trilium installation is well-secured with minor improvements needed."
    elif [ $SCORE -ge $((MAX_SCORE * 60 / 100)) ]; then
        echo "⚠️  FAIR: Your Trilium installation has some security issues that should be addressed."
    else
        echo "🚨 POOR: Your Trilium installation has significant security vulnerabilities."
    fi
    echo
    
    generate_recommendations
    
} | tee "$REPORT_FILE"

echo "Security assessment completed. Report saved to: $REPORT_FILE"

# Email report if configured
if [ -n "$ADMIN_EMAIL" ]; then
    mail -s "Trilium Security Assessment Report" "$ADMIN_EMAIL" < "$REPORT_FILE"
fi
```

### Security Checklist

#### Pre-Deployment Checklist

```markdown
# Trilium Security Pre-Deployment Checklist

## Infrastructure Security
- [ ] Server OS is updated and hardened
- [ ] Firewall rules are configured and tested
- [ ] SSH is properly secured (key-based auth, no root login)
- [ ] SSL certificates are valid and properly configured
- [ ] Reverse proxy is configured with security headers
- [ ] Intrusion detection system is installed and configured

## Application Security
- [ ] Trilium is updated to latest stable version
- [ ] Strong master password is set
- [ ] Multi-factor authentication is enabled
- [ ] Session timeouts are appropriately configured
- [ ] CSRF protection is enabled
- [ ] Content Security Policy headers are set
- [ ] API tokens are properly secured

## Data Protection
- [ ] Database file permissions are restrictive (600/640)
- [ ] Data directory permissions are secure (700/750)
- [ ] Encrypted backups are configured and tested
- [ ] Backup retention policy is defined
- [ ] File integrity monitoring is implemented
- [ ] Data loss prevention measures are in place

## Operational Security
- [ ] Security logging is enabled and configured
- [ ] Log rotation is properly set up
- [ ] Monitoring and alerting systems are operational
- [ ] Incident response procedures are documented
- [ ] Security assessment tools are installed
- [ ] Staff training is completed

## Compliance and Governance
- [ ] Security policies are documented
- [ ] Access control procedures are defined
- [ ] Audit requirements are identified
- [ ] Compliance standards are addressed
- [ ] Regular security reviews are scheduled
- [ ] Penetration testing is planned
```

This comprehensive security guide provides detailed procedures and best practices for securing Trilium installations across all environments. Regular review and updates of these procedures ensure ongoing security effectiveness as threats evolve.

Remember: Security is not a one-time configuration but an ongoing process requiring continuous monitoring, assessment, and improvement.