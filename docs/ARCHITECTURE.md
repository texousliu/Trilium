## API Architecture

## Build System

### Package Manager: pnpm

**Why pnpm:**
- Fast, disk-efficient
- Strict dependency isolation
- Native monorepo support via workspaces
- Patch package support

**Workspace Configuration:**
```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Build Tools

**Vite** (Development & Production)
- Fast HMR for development
- Optimized production builds
- Asset handling
- Plugin ecosystem

**ESBuild** (TypeScript compilation)
- Fast TypeScript transpilation
- Bundling support
- Minification

**TypeScript**
- Project references for monorepo
- Strict type checking
- Shared `tsconfig.base.json`

### Build Scripts

**Root `package.json` scripts:**
```json
{
  "server:start": "pnpm run --filter server dev",
  "server:build": "pnpm run --filter server build",
  "client:build": "pnpm run --filter client build",
  "desktop:build": "pnpm run --filter desktop build",
  "test:all": "pnpm test:parallel && pnpm test:sequential"
}
```

### Build Process

**Development:**
```bash
pnpm install            # Install dependencies
pnpm server:start       # Start dev server (port 8080)
# or
pnpm desktop:start      # Start Electron dev
```

**Production (Server):**
```bash
pnpm server:build       # Build server + client
node apps/server/dist/main.js
```

**Production (Desktop):**
```bash
pnpm desktop:build      # Build Electron app
# Creates distributable in apps/desktop/out/make/
```

**Docker:**
```bash
docker build -t trilium .
docker run -p 8080:8080 trilium
```

### Asset Pipeline

**Client Assets:**
- Entry: `apps/client/src/index.html`
- Bundled by Vite
- Output: `apps/client/dist/`

**Server Static:**
- Serves client assets in production
- Public directory: `apps/server/public/`

**Desktop:**
- Packages client assets
- Electron main process: `apps/desktop/src/main.ts`
- Electron renderer: loads client app

---

## Testing Strategy

### Test Organization

**Parallel Tests** (can run simultaneously):
- Client tests
- Package tests
- E2E tests (isolated databases)

**Sequential Tests** (shared resources):
- Server tests (shared database)
- CKEditor plugin tests

### Test Frameworks

- **Vitest** - Unit and integration tests
- **Playwright** - E2E tests
- **Happy-DOM** - DOM testing environment

### Running Tests

```bash
pnpm test:all          # All tests
pnpm test:parallel     # Fast parallel tests
pnpm test:sequential   # Sequential tests only
pnpm coverage          # With coverage reports
```

### Test Locations

```
apps/
├── server/
│   └── src/**/*.spec.ts       # Server tests
├── client/
│   └── src/**/*.spec.ts       # Client tests
└── server-e2e/
    └── tests/**/*.spec.ts     # E2E tests
```

### E2E Testing

**Server E2E:**
- Tests full REST API
- Tests WebSocket functionality
- Tests sync protocol

**Desktop E2E:**
- Playwright with Electron
- Tests full desktop app
- Screenshot comparison

---

## Security Architecture

### Encryption System

**Per-Note Encryption:**
- Notes can be individually protected
- AES-256 encryption
- Password-derived encryption key (PBKDF2)
- Separate protected session management

**Protected Session:**
- Time-limited access to protected notes
- Automatic timeout
- Re-authentication required
- Frontend: `protected_session.ts`
- Backend: `protected_session.ts`

### Authentication

**Password Auth:**
- PBKDF2 key derivation
- Salt per installation
- Hash verification

**OpenID Connect:**
- External identity provider support
- OAuth 2.0 flow
- Configurable providers

**TOTP (2FA):**
- Time-based one-time passwords
- QR code setup
- Backup codes

### Authorization

**Single-User Model:**
- Desktop: single user (owner)
- Server: single user per installation

**Share Notes:**
- Public access without authentication
- Separate Shaca cache
- Read-only access

### CSRF Protection

**CSRF Tokens:**
- Required for state-changing operations
- Token in header or cookie
- Validation middleware

### Input Sanitization

**XSS Prevention:**
- DOMPurify for HTML sanitization
- CKEditor content filtering
- CSP headers

**SQL Injection:**
- Parameterized queries only
- Better-sqlite3 prepared statements
- No string concatenation in SQL

### Dependency Security

**Vulnerability Scanning:**
- Renovate bot for updates
- npm audit integration
- Override vulnerable sub-dependencies

---

## Related Documentation

### User Documentation
- [User Guide](User%20Guide/User%20Guide/) - End-user features and usage
- [Installation Guide](User%20Guide/User%20Guide/Installation%20&%20Setup/)
- [Basic Concepts](User%20Guide/User%20Guide/Basic%20Concepts%20and%20Features/)

### Developer Documentation
- [Developer Guide](Developer%20Guide/Developer%20Guide/) - Development setup
- [Environment Setup](Developer%20Guide/Developer%20Guide/Environment%20Setup.md)
- [Project Structure](Developer%20Guide/Developer%20Guide/Project%20Structure.md)
- [Adding Note Types](Developer%20Guide/Developer%20Guide/Development%20and%20architecture/Adding%20a%20new%20note%20type/)
- [Database Schema](Developer%20Guide/Developer%20Guide/Development%20and%20architecture/Database/)

### API Documentation
- [Script API](Script%20API/) - User scripting API
- [ETAPI Documentation](https://triliumnext.github.io/Docs/Wiki/etapi) - External API

### Additional Resources
- [CLAUDE.md](../CLAUDE.md) - AI assistant guidance
- [README.md](../README.md) - Project overview
- [SECURITY.md](../SECURITY.md) - Security policy

---

## Appendices

### Glossary

- **Becca**: Backend Cache - server-side entity cache
- **Froca**: Frontend Cache - client-side entity mirror
- **Shaca**: Share Cache - cache for public shared notes
- **ETAPI**: External API for third-party integrations
- **Protected Note**: Encrypted note requiring password
- **Clone**: Note with multiple parent branches
- **Branch**: Parent-child relationship between notes
- **Attribute**: Metadata (label or relation) attached to note
- **Blob**: Binary large object containing note content

### File Naming Conventions

- `BEntity` - Backend entity (e.g., BNote, BBranch)
- `FEntity` - Frontend entity (e.g., FNote, FBranch)
- `*_widget.ts` - Widget classes
- `*_service.ts` - Service modules
- `*.spec.ts` - Test files
- `XXXX_*.sql` - Migration files

### Architecture Decision Records

For historical context on major architectural decisions, see:
- Migration to TypeScript monorepo
- Adoption of pnpm workspaces
- CKEditor 5 upgrade
- Entity change tracking system
