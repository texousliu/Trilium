# Security Testing Guide

This comprehensive guide covers security testing methodologies, tools, and procedures for ensuring the security of Trilium's codebase and deployments.

## Security Testing Overview

### Testing Pyramid for Security

```
                    Manual Security Testing
                   (Penetration Testing, Code Review)
                 ┌─────────────────────────────┐
                │                             │
               │     Integration Security     │
              │       (API, E2E Tests)       │
             └─────────────────────────────┘
            ┌─────────────────────────────────┐
           │                                 │
          │        Unit Security Tests       │
         │     (Input Validation, Crypto)    │
        └─────────────────────────────────────┘
       ┌─────────────────────────────────────────┐
      │                                         │
     │           Static Analysis                │
    │      (SAST, Dependency Scanning)          │
   └─────────────────────────────────────────────┘
```

### Security Testing Goals

1. **Vulnerability Detection**: Identify security flaws before deployment
2. **Compliance Verification**: Ensure adherence to security standards
3. **Risk Assessment**: Evaluate potential security impact
4. **Defense Validation**: Verify security controls effectiveness

## Static Analysis Security Testing (SAST)

### Code Quality and Security Analysis

#### ESLint Security Rules

```json
{
  "extends": [
    "plugin:security/recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "security/detect-sql-injection": "error",
    "security/detect-xss": "error", 
    "security/detect-eval-with-expression": "error",
    "security/detect-non-literal-fs-filename": "warn",
    "security/detect-unsafe-regex": "error",
    "security/detect-buffer-noassert": "error",
    "security/detect-child-process": "warn",
    "security/detect-disable-mustache-escape": "error",
    "security/detect-no-csrf-before-method-override": "error",
    "security/detect-non-literal-require": "warn",
    "security/detect-possible-timing-attacks": "error",
    "security/detect-pseudoRandomBytes": "error"
  }
}
```

#### SonarQube Security Rules

```javascript
// Example sonar-project.properties configuration
sonar.projectKey=trilium-security
sonar.sources=src
sonar.exclusions=**/*.test.ts,**/*.spec.ts,**/node_modules/**
sonar.typescript.tsconfigPath=tsconfig.json

// Security-focused quality gates
sonar.qualitygate.wait=true
sonar.security.hotspots.maxAllowed=0
sonar.security.vulnerabilities.maxAllowed=0
```

#### Custom Security Linting Rules

```typescript
// Custom ESLint rule for Trilium-specific security patterns
module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Detect unencrypted storage of sensitive data"
        }
    },
    create(context) {
        return {
            CallExpression(node) {
                if (node.callee.name === 'setOption' && 
                    node.arguments[0].value.includes('password')) {
                    context.report({
                        node,
                        message: "Potential unencrypted password storage"
                    });
                }
            }
        };
    }
};
```

### Dependency Vulnerability Scanning

#### npm audit Integration

```bash
#!/bin/bash
# security-scan.sh - Comprehensive dependency scanning

echo "Running npm audit..."
npm audit --audit-level moderate

echo "Checking for known vulnerabilities..."
npm audit --json > audit-report.json

echo "Analyzing audit results..."
node scripts/analyze-audit.js audit-report.json

echo "Checking for outdated packages..."
npm outdated

echo "Running Snyk scan..."
npx snyk test --json > snyk-report.json

echo "Generating security report..."
node scripts/generate-security-report.js
```

#### Automated Vulnerability Monitoring

```typescript
// scripts/analyze-audit.js
interface VulnerabilityReport {
    advisories: Record<string, {
        severity: string;
        title: string;
        module_name: string;
        vulnerable_versions: string;
        patched_versions: string;
    }>;
}

function analyzeAuditReport(report: VulnerabilityReport): void {
    const criticalVulns = Object.values(report.advisories)
        .filter(vuln => vuln.severity === 'critical');
    
    if (criticalVulns.length > 0) {
        console.error(`Found ${criticalVulns.length} critical vulnerabilities`);
        process.exit(1);
    }
    
    const highVulns = Object.values(report.advisories)
        .filter(vuln => vuln.severity === 'high');
    
    if (highVulns.length > 5) {
        console.warn(`Found ${highVulns.length} high severity vulnerabilities`);
    }
}
```

## Dynamic Application Security Testing (DAST)

### Automated Security Scanning

#### OWASP ZAP Integration

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * 1' # Weekly scan

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Start application
      run: npm start &
      
    - name: Wait for application
      run: sleep 30
      
    - name: Run OWASP ZAP scan
      uses: zaproxy/action-full-scan@v0.4.0
      with:
        target: 'http://localhost:8080'
        rules_file_name: '.zap/rules.tsv'
        cmd_options: '-a'
        
    - name: Upload ZAP results
      uses: actions/upload-artifact@v3
      with:
        name: zap-report
        path: report_html.html
```

#### Custom Security Test Suite

```typescript
// test/security/security.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Security Tests', () => {
    describe('XSS Protection', () => {
        test('should sanitize script tags in note content', async () => {
            const maliciousContent = '<script>alert("XSS")</script>Hello';
            
            const response = await request(app)
                .post('/api/notes')
                .send({
                    title: 'Test Note',
                    content: maliciousContent
                })
                .expect(200);
            
            expect(response.body.content).not.toContain('<script>');
            expect(response.body.content).toContain('Hello');
        });
        
        test('should set appropriate security headers', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);
            
            expect(response.headers['x-frame-options']).toBe('DENY');
            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['x-xss-protection']).toBe('1; mode=block');
        });
    });
    
    describe('SQL Injection Protection', () => {
        test('should reject SQL injection attempts', async () => {
            const sqlInjection = "'; DROP TABLE notes; --";
            
            const response = await request(app)
                .get(`/api/search?query=${encodeURIComponent(sqlInjection)}`)
                .expect(400);
            
            expect(response.body.error).toContain('Invalid query');
        });
    });
    
    describe('Authentication Security', () => {
        test('should require authentication for protected endpoints', async () => {
            await request(app)
                .get('/api/notes')
                .expect(401);
        });
        
        test('should validate session tokens', async () => {
            await request(app)
                .get('/api/notes')
                .set('Cookie', 'session=invalid-token')
                .expect(401);
        });
    });
    
    describe('CSRF Protection', () => {
        test('should require CSRF token for state-changing operations', async () => {
            const session = await createAuthenticatedSession();
            
            await request(app)
                .post('/api/notes')
                .set('Cookie', session.cookie)
                // Missing CSRF token
                .send({ title: 'Test' })
                .expect(403);
        });
        
        test('should accept valid CSRF tokens', async () => {
            const session = await createAuthenticatedSession();
            
            await request(app)
                .post('/api/notes')
                .set('Cookie', session.cookie)
                .set('X-CSRF-Token', session.csrfToken)
                .send({ title: 'Test' })
                .expect(201);
        });
    });
});
```

### Performance Security Testing

#### Rate Limiting Tests

```typescript
describe('Rate Limiting Security', () => {
    test('should rate limit login attempts', async () => {
        const loginData = { password: 'wrong-password' };
        
        // Attempt multiple failed logins
        const promises = Array(10).fill(null).map(() =>
            request(app)
                .post('/api/login')
                .send(loginData)
        );
        
        const responses = await Promise.all(promises);
        const rateLimited = responses.filter(r => r.status === 429);
        
        expect(rateLimited.length).toBeGreaterThan(0);
    });
    
    test('should rate limit API requests per IP', async () => {
        const session = await createAuthenticatedSession();
        
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

#### DoS Protection Tests

```typescript
describe('DoS Protection', () => {
    test('should limit request payload size', async () => {
        const largePayload = 'x'.repeat(10 * 1024 * 1024); // 10MB
        
        await request(app)
            .post('/api/notes')
            .send({ title: 'Test', content: largePayload })
            .expect(413); // Payload too large
    });
    
    test('should timeout long-running requests', async () => {
        const start = Date.now();
        
        try {
            await request(app)
                .get('/api/export/large-dataset')
                .timeout(5000);
        } catch (error) {
            const duration = Date.now() - start;
            expect(duration).toBeGreaterThan(5000);
        }
    });
});
```

## Cryptographic Security Testing

### Encryption Algorithm Tests

```typescript
describe('Encryption Security', () => {
    describe('AES-128-CBC Implementation', () => {
        test('should use different IVs for each encryption', () => {
            const key = crypto.randomBytes(16);
            const plaintext = 'sensitive data';
            
            const encrypted1 = dataEncryption.encrypt(key, plaintext);
            const encrypted2 = dataEncryption.encrypt(key, plaintext);
            
            expect(encrypted1).not.toBe(encrypted2);
        });
        
        test('should detect tampered ciphertext', () => {
            const key = crypto.randomBytes(16);
            const plaintext = 'important data';
            
            const encrypted = dataEncryption.encrypt(key, plaintext);
            
            // Tamper with the ciphertext
            const tamperedEncrypted = encrypted.slice(0, -4) + '0000';
            
            expect(() => {
                dataEncryption.decrypt(key, tamperedEncrypted);
            }).toThrow();
        });
        
        test('should fail gracefully with wrong key', () => {
            const key1 = crypto.randomBytes(16);
            const key2 = crypto.randomBytes(16);
            const plaintext = 'secret information';
            
            const encrypted = dataEncryption.encrypt(key1, plaintext);
            const result = dataEncryption.decrypt(key2, encrypted);
            
            expect(result).toBe(false);
        });
    });
    
    describe('Key Derivation (Scrypt)', () => {
        test('should use sufficient work factor', () => {
            const password = 'test-password';
            const salt = crypto.randomBytes(32);
            
            const start = Date.now();
            const derivedKey = myScrypt.getScryptHash(password, salt);
            const duration = Date.now() - start;
            
            // Should take at least 100ms (adjust based on requirements)
            expect(duration).toBeGreaterThan(100);
            expect(derivedKey).toHaveLength(32);
        });
        
        test('should produce different outputs with different salts', () => {
            const password = 'same-password';
            const salt1 = crypto.randomBytes(32);
            const salt2 = crypto.randomBytes(32);
            
            const hash1 = myScrypt.getScryptHash(password, salt1);
            const hash2 = myScrypt.getScryptHash(password, salt2);
            
            expect(hash1).not.toEqual(hash2);
        });
    });
    
    describe('Random Number Generation', () => {
        test('should use cryptographically secure randomness', () => {
            const random1 = crypto.randomBytes(32);
            const random2 = crypto.randomBytes(32);
            
            expect(random1).not.toEqual(random2);
            expect(random1).toHaveLength(32);
            expect(random2).toHaveLength(32);
        });
        
        test('should have sufficient entropy', () => {
            const samples = Array(1000).fill(null).map(() => 
                crypto.randomBytes(4).readUInt32BE(0)
            );
            
            // Basic entropy test - check for duplicates
            const uniqueValues = new Set(samples);
            const uniqueRatio = uniqueValues.size / samples.length;
            
            expect(uniqueRatio).toBeGreaterThan(0.99);
        });
    });
});
```

### TOTP Security Tests

```typescript
describe('TOTP Security', () => {
    test('should generate valid TOTP secrets', () => {
        const secret = totpService.createSecret();
        
        expect(secret.success).toBe(true);
        expect(secret.message).toMatch(/^[A-Z2-7]{32}$/); // Base32 format
    });
    
    test('should validate correct TOTP codes', () => {
        const secret = 'JBSWY3DPEHPK3PXP'; // Test secret
        const code = Totp.generate({ secret, time: Date.now() });
        
        const isValid = totpService.validateTOTP(code);
        expect(isValid).toBe(true);
    });
    
    test('should reject expired TOTP codes', () => {
        const secret = 'JBSWY3DPEHPK3PXP';
        const oldTime = Date.now() - (2 * 30 * 1000); // 2 time steps ago
        const oldCode = Totp.generate({ secret, time: oldTime });
        
        const isValid = totpService.validateTOTP(oldCode);
        expect(isValid).toBe(false);
    });
    
    test('should prevent timing attacks', () => {
        const validSecret = totpService.createSecret().message;
        const validCode = Totp.generate({ secret: validSecret });
        const invalidCode = '000000';
        
        // Measure timing for valid vs invalid codes
        const times = [];
        
        for (let i = 0; i < 100; i++) {
            const start = process.hrtime.bigint();
            totpService.validateTOTP(i % 2 === 0 ? validCode : invalidCode);
            const end = process.hrtime.bigint();
            times.push(Number(end - start));
        }
        
        const validTimes = times.filter((_, i) => i % 2 === 0);
        const invalidTimes = times.filter((_, i) => i % 2 === 1);
        
        const avgValidTime = validTimes.reduce((a, b) => a + b) / validTimes.length;
        const avgInvalidTime = invalidTimes.reduce((a, b) => a + b) / invalidTimes.length;
        
        // Timing difference should be minimal
        const timingDiff = Math.abs(avgValidTime - avgInvalidTime);
        expect(timingDiff).toBeLessThan(avgValidTime * 0.1); // Less than 10% difference
    });
});
```

## Penetration Testing

### Automated Penetration Testing

#### Nuclei Security Scanner

```yaml
# .nuclei/config.yaml
projectfile: .nuclei/project.yaml
templatesDirectory: /nuclei-templates

# .nuclei/project.yaml
name: "trilium-security-scan"
authors: ["security-team"]
tags: ["web", "api", "auth"]
```

```bash
#!/bin/bash
# penetration-test.sh

echo "Starting penetration testing..."

# Install nuclei if not present
if ! command -v nuclei &> /dev/null; then
    echo "Installing nuclei..."
    go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest
fi

# Update templates
nuclei -update-templates

# Run security scans
echo "Running nuclei security scan..."
nuclei -u http://localhost:8080 \
    -t /nuclei-templates/cves/ \
    -t /nuclei-templates/vulnerabilities/ \
    -t /nuclei-templates/security-misconfiguration/ \
    -o nuclei-report.txt

# Custom Trilium-specific tests
echo "Running custom security tests..."
nuclei -u http://localhost:8080 \
    -t .nuclei/trilium-tests/ \
    -o custom-security-report.txt

echo "Penetration testing completed."
```

#### Custom Nuclei Templates

```yaml
# .nuclei/trilium-tests/trilium-auth-bypass.yaml
id: trilium-auth-bypass

info:
  name: Trilium Authentication Bypass
  author: security-team
  severity: critical
  description: Test for authentication bypass vulnerabilities
  tags: trilium,auth

requests:
  - method: GET
    path:
      - "{{BaseURL}}/api/notes"
      - "{{BaseURL}}/api/options"
      - "{{BaseURL}}/api/search"
    
    matchers-condition: and
    matchers:
      - type: status
        status:
          - 200
      
      - type: word
        words:
          - "noteId"
          - "notes"
        condition: or
```

### Manual Security Testing

#### Security Test Scenarios

```typescript
// Manual security testing checklist
interface SecurityTestScenario {
    category: string;
    description: string;
    steps: string[];
    expectedResult: string;
    risk: 'low' | 'medium' | 'high' | 'critical';
}

const securityTestScenarios: SecurityTestScenario[] = [
    {
        category: 'Authentication',
        description: 'Test password brute force protection',
        steps: [
            'Navigate to login page',
            'Attempt 10 failed login attempts',
            'Verify account lockout occurs',
            'Wait for lockout period to expire',
            'Verify legitimate login works after lockout'
        ],
        expectedResult: 'Account should be locked after failed attempts',
        risk: 'high'
    },
    {
        category: 'Session Management',
        description: 'Test session hijacking resistance',
        steps: [
            'Login and capture session cookie',
            'Attempt to use session from different IP',
            'Verify session validation',
            'Test session timeout functionality'
        ],
        expectedResult: 'Session should be invalidated or require additional verification',
        risk: 'high'
    },
    {
        category: 'Input Validation',
        description: 'Test for XSS vulnerabilities',
        steps: [
            'Create note with script payload: <script>alert("XSS")</script>',
            'Save and view the note',
            'Check if script executes',
            'Verify content is properly sanitized'
        ],
        expectedResult: 'Script should not execute, content should be sanitized',
        risk: 'medium'
    }
];
```

#### Security Checklist

```typescript
interface SecurityChecklist {
    item: string;
    status: 'pass' | 'fail' | 'not_applicable';
    notes?: string;
}

const securityChecklist: SecurityChecklist[] = [
    {
        item: 'HTTPS enforced in production',
        status: 'pass'
    },
    {
        item: 'Security headers properly configured',
        status: 'pass'
    },
    {
        item: 'Input validation on all endpoints',
        status: 'pass'
    },
    {
        item: 'SQL injection protection implemented',
        status: 'pass'
    },
    {
        item: 'XSS protection mechanisms active',
        status: 'pass'
    },
    {
        item: 'CSRF protection enabled',
        status: 'pass'
    },
    {
        item: 'Strong password policy enforced',
        status: 'pass'
    },
    {
        item: 'MFA available and working',
        status: 'pass'
    },
    {
        item: 'Session management secure',
        status: 'pass'
    },
    {
        item: 'Rate limiting implemented',
        status: 'pass'
    },
    {
        item: 'Error messages dont leak information',
        status: 'pass'
    },
    {
        item: 'File upload restrictions in place',
        status: 'pass'
    },
    {
        item: 'Sensitive data encrypted at rest',
        status: 'pass'
    },
    {
        item: 'Audit logging comprehensive',
        status: 'pass'
    },
    {
        item: 'Dependencies up to date',
        status: 'pass'
    }
];
```

## Security Test Automation

### CI/CD Security Pipeline

```yaml
# .github/workflows/security-pipeline.yml
name: Security Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  static-analysis:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run ESLint security rules
      run: npm run lint:security
      
    - name: Run dependency vulnerability scan
      run: npm audit --audit-level moderate
      
    - name: Run Snyk scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high

  unit-security-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run security unit tests
      run: npm run test:security
      
    - name: Generate coverage report
      run: npm run coverage:security

  integration-security-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Start test database
      run: npm run db:test
      
    - name: Run integration security tests
      run: npm run test:security:integration
      
    - name: Cleanup
      run: npm run db:cleanup

  dynamic-security-scan:
    runs-on: ubuntu-latest
    needs: [static-analysis, unit-security-tests]
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Start application
      run: |
        npm run build
        npm start &
        sleep 30
        
    - name: Run OWASP ZAP scan
      uses: zaproxy/action-full-scan@v0.4.0
      with:
        target: 'http://localhost:8080'
        
    - name: Upload security reports
      uses: actions/upload-artifact@v3
      with:
        name: security-reports
        path: |
          report_html.html
          report_json.json
```

### Security Metrics and Reporting

```typescript
// scripts/security-metrics.ts
interface SecurityMetrics {
    vulnerabilities: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    testCoverage: {
        securityTests: number;
        totalTests: number;
        percentage: number;
    };
    dependencies: {
        total: number;
        outdated: number;
        vulnerable: number;
    };
    scanResults: {
        lastScan: Date;
        passed: boolean;
        findings: number;
    };
}

function generateSecurityReport(metrics: SecurityMetrics): void {
    const report = `
# Security Report - ${new Date().toISOString()}

## Vulnerability Summary
- Critical: ${metrics.vulnerabilities.critical}
- High: ${metrics.vulnerabilities.high}
- Medium: ${metrics.vulnerabilities.medium}
- Low: ${metrics.vulnerabilities.low}

## Test Coverage
- Security Tests: ${metrics.testCoverage.securityTests}
- Total Tests: ${metrics.testCoverage.totalTests}
- Coverage: ${metrics.testCoverage.percentage}%

## Dependencies
- Total Dependencies: ${metrics.dependencies.total}
- Outdated: ${metrics.dependencies.outdated}
- Vulnerable: ${metrics.dependencies.vulnerable}

## Last Security Scan
- Date: ${metrics.scanResults.lastScan}
- Status: ${metrics.scanResults.passed ? 'PASSED' : 'FAILED'}
- Findings: ${metrics.scanResults.findings}
    `;
    
    console.log(report);
    
    // Fail build if critical issues found
    if (metrics.vulnerabilities.critical > 0) {
        process.exit(1);
    }
}
```

This comprehensive security testing guide ensures that Trilium maintains a robust security posture through automated and manual testing procedures. Regular execution of these tests helps identify and remediate security issues before they can be exploited.