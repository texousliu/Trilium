# Trilium Notes - Technical Documentation Index

Welcome to the comprehensive technical and architectural documentation for Trilium Notes. This index provides quick access to all technical documentation resources.

## 📚 Core Architecture Documentation

### [ARCHITECTURE.md](ARCHITECTURE.md)
**Main technical architecture document** covering the complete system design.

**Topics Covered:**
- High-level architecture overview
- Monorepo structure and organization
- Core architecture patterns (Becca, Froca, Shaca)
- Entity system and data model
- Widget-based UI architecture
- Frontend and backend architecture
- API architecture (Internal, ETAPI, WebSocket)
- Build system and tooling
- Testing strategy
- Security overview

**Audience:** Developers, architects, contributors

---

### [DATABASE.md](DATABASE.md)
**Complete database architecture and schema documentation.**

**Topics Covered:**
- SQLite database structure
- Entity tables (notes, branches, attributes, revisions, attachments, blobs)
- System tables (options, entity_changes, sessions)
- Data relationships and integrity
- Database access patterns
- Migrations and versioning
- Performance optimization
- Backup and maintenance
- Security considerations

**Audience:** Backend developers, database administrators

---

### [SYNCHRONIZATION.md](SYNCHRONIZATION.md)
**Detailed synchronization protocol and implementation.**

**Topics Covered:**
- Sync architecture overview
- Entity change tracking
- Sync protocol (handshake, pull, push)
- Conflict resolution strategies
- Protected notes synchronization
- Performance optimizations
- Error handling and retry logic
- Sync server configuration
- WebSocket real-time updates
- Troubleshooting guide

**Audience:** Advanced users, sync server administrators, contributors

---

### [SCRIPTING.md](SCRIPTING.md)
**Comprehensive guide to the Trilium scripting system.**

**Topics Covered:**
- Script types (frontend, backend, render)
- Frontend API reference
- Backend API reference
- Entity classes (FNote, BNote, etc.)
- Script examples and patterns
- Script storage and execution
- Security considerations
- Performance optimization
- Debugging techniques
- Advanced topics

**Audience:** Power users, script developers, plugin creators

---

### [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md)
**In-depth security architecture and implementation.**

**Topics Covered:**
- Security principles and threat model
- Authentication methods (password, TOTP, OpenID)
- Session management
- Authorization and protected sessions
- Encryption (notes, transport, backups)
- Input sanitization (XSS, SQL injection, CSRF)
- Network security (HTTPS, headers, rate limiting)
- Data security and secure deletion
- Dependency security
- Security best practices
- Incident response

**Audience:** Security engineers, administrators, auditors

---

## 🔧 Developer Documentation

### [Developer Guide](Developer%20Guide/Developer%20Guide/)
Collection of developer-focused documentation for contributing to Trilium.

**Key Documents:**
- [Environment Setup](Developer%20Guide/Developer%20Guide/Environment%20Setup.md) - Setting up development environment
- [Project Structure](Developer%20Guide/Developer%20Guide/Project%20Structure.md) - Monorepo organization
- [Development and Architecture](Developer%20Guide/Developer%20Guide/Development%20and%20architecture/) - Various development topics

**Topics Include:**
- Local development setup
- Building and deployment
- Adding new note types
- Database schema details
- Internationalization
- Icons and UI customization
- Docker development
- Troubleshooting

**Audience:** Contributors, developers

---

## 📖 User Documentation

### [User Guide](User%20Guide/User%20Guide/)
Comprehensive end-user documentation for using Trilium.

**Key Sections:**
- Installation & Setup
- Basic Concepts and Features
- Note Types
- Advanced Usage
- Synchronization
- Import/Export

**Audience:** End users, administrators

---

### [Script API](Script%20API/)
Complete API reference for user scripting.

**Coverage:**
- Frontend API methods
- Backend API methods
- Entity properties and methods
- Event handlers
- Utility functions

**Audience:** Script developers, power users

---

## 🚀 Quick Start Guides

### For Users
1. [Installation Guide](User%20Guide/User%20Guide/Installation%20&%20Setup/) - Get Trilium running
2. [Basic Concepts](User%20Guide/User%20Guide/Basic%20Concepts%20and%20Features/) - Learn the fundamentals
3. [Scripting Guide](SCRIPTING.md) - Extend Trilium with scripts

### For Developers
1. [Environment Setup](Developer%20Guide/Developer%20Guide/Environment%20Setup.md) - Setup development environment
2. [Architecture Overview](ARCHITECTURE.md) - Understand the system
3. [Contributing Guide](../README.md#-contribute) - Start contributing

### For Administrators
1. [Server Installation](User%20Guide/User%20Guide/Installation%20&%20Setup/Server%20Installation.md) - Deploy Trilium server
2. [Synchronization Setup](SYNCHRONIZATION.md) - Configure sync
3. [Security Best Practices](SECURITY_ARCHITECTURE.md#security-best-practices) - Secure your installation

---

## 🔍 Documentation by Topic

### Architecture & Design
- [Overall Architecture](ARCHITECTURE.md)
- [Monorepo Structure](ARCHITECTURE.md#monorepo-structure)
- [Three-Layer Cache System](ARCHITECTURE.md#three-layer-cache-system)
- [Entity System](ARCHITECTURE.md#entity-system)
- [Widget-Based UI](ARCHITECTURE.md#widget-based-ui)

### Data & Storage
- [Database Architecture](DATABASE.md)
- [Entity Tables](DATABASE.md#entity-tables)
- [Data Relationships](DATABASE.md#data-relationships)
- [Blob Storage](DATABASE.md#blobs-table)
- [Database Migrations](DATABASE.md#database-migrations)

### Synchronization
- [Sync Architecture](SYNCHRONIZATION.md#sync-architecture)
- [Sync Protocol](SYNCHRONIZATION.md#sync-protocol)
- [Conflict Resolution](SYNCHRONIZATION.md#conflict-resolution)
- [Protected Notes Sync](SYNCHRONIZATION.md#protected-notes-sync)
- [WebSocket Sync](SYNCHRONIZATION.md#websocket-sync-updates)

### Security
- [Authentication](SECURITY_ARCHITECTURE.md#authentication)
- [Encryption](SECURITY_ARCHITECTURE.md#encryption)
- [Input Sanitization](SECURITY_ARCHITECTURE.md#input-sanitization)
- [Network Security](SECURITY_ARCHITECTURE.md#network-security)
- [Security Best Practices](SECURITY_ARCHITECTURE.md#security-best-practices)

### Scripting & Extensibility
- [Script Types](SCRIPTING.md#script-types)
- [Frontend API](SCRIPTING.md#frontend-api)
- [Backend API](SCRIPTING.md#backend-api)
- [Script Examples](SCRIPTING.md#script-examples)
- [Custom Widgets](SCRIPTING.md#render-scripts)

### Frontend
- [Client Architecture](ARCHITECTURE.md#frontend-architecture)
- [Widget System](ARCHITECTURE.md#widget-based-ui)
- [Event System](ARCHITECTURE.md#event-system)
- [Froca Cache](ARCHITECTURE.md#2-froca-frontend-cache)
- [UI Components](ARCHITECTURE.md#ui-components)

### Backend
- [Server Architecture](ARCHITECTURE.md#backend-architecture)
- [Service Layer](ARCHITECTURE.md#service-layer)
- [Route Structure](ARCHITECTURE.md#route-structure)
- [Becca Cache](ARCHITECTURE.md#1-becca-backend-cache)
- [Middleware](ARCHITECTURE.md#middleware)

### Build & Deploy
- [Build System](ARCHITECTURE.md#build-system)
- [Package Manager](ARCHITECTURE.md#package-manager-pnpm)
- [Build Tools](ARCHITECTURE.md#build-tools)
- [Docker](Developer%20Guide/Developer%20Guide/Development%20and%20architecture/Docker.md)
- [Deployment](Developer%20Guide/Developer%20Guide/Building%20and%20deployment/)

### Testing
- [Testing Strategy](ARCHITECTURE.md#testing-strategy)
- [Test Organization](ARCHITECTURE.md#test-organization)
- [E2E Testing](ARCHITECTURE.md#e2e-testing)

---

## 📋 Reference Documentation

### File Locations
```
trilium/
├── apps/
│   ├── client/         # Frontend application
│   ├── server/         # Backend server
│   ├── desktop/        # Electron app
│   └── ...
├── packages/
│   ├── commons/        # Shared code
│   ├── ckeditor5/      # Rich text editor
│   └── ...
├── docs/
│   ├── ARCHITECTURE.md           # Main architecture doc
│   ├── DATABASE.md              # Database documentation
│   ├── SYNCHRONIZATION.md       # Sync documentation
│   ├── SCRIPTING.md             # Scripting guide
│   ├── SECURITY_ARCHITECTURE.md # Security documentation
│   ├── Developer Guide/         # Developer docs
│   ├── User Guide/             # User docs
│   └── Script API/             # API reference
└── ...
```

### Key Source Files
- **Backend Entry:** `apps/server/src/main.ts`
- **Frontend Entry:** `apps/client/src/desktop.ts` / `apps/client/src/index.ts`
- **Becca Cache:** `apps/server/src/becca/becca.ts`
- **Froca Cache:** `apps/client/src/services/froca.ts`
- **Database Schema:** `apps/server/src/assets/db/schema.sql`
- **Backend API:** `apps/server/src/services/backend_script_api.ts`
- **Frontend API:** `apps/client/src/services/frontend_script_api.ts`

### Important Directories
- **Entities:** `apps/server/src/becca/entities/`
- **Widgets:** `apps/client/src/widgets/`
- **Services:** `apps/server/src/services/`
- **Routes:** `apps/server/src/routes/`
- **Migrations:** `apps/server/src/migrations/`
- **Tests:** Various `*.spec.ts` files throughout

---

## 🎯 Common Tasks

### Understanding the Codebase
1. Read [ARCHITECTURE.md](ARCHITECTURE.md) for overview
2. Explore [Monorepo Structure](ARCHITECTURE.md#monorepo-structure)
3. Review [Entity System](ARCHITECTURE.md#entity-system)
4. Check [Key Files](ARCHITECTURE.md#key-files-for-understanding-architecture)

### Adding Features
1. Review relevant architecture documentation
2. Check [Developer Guide](Developer%20Guide/Developer%20Guide/)
3. Follow existing patterns in codebase
4. Write tests
5. Update documentation

### Debugging Issues
1. Check [Troubleshooting](Developer%20Guide/Developer%20Guide/Troubleshooting/)
2. Review [Database](DATABASE.md) for data issues
3. Check [Synchronization](SYNCHRONIZATION.md) for sync issues
4. Review [Security](SECURITY_ARCHITECTURE.md) for auth issues

### Performance Optimization
1. [Database Performance](DATABASE.md#performance-optimization)
2. [Cache Optimization](ARCHITECTURE.md#caching-system)
3. [Build Optimization](ARCHITECTURE.md#build-system)
4. [Script Performance](SCRIPTING.md#performance-considerations)

---

## 🔗 External Resources

### Official Links
- **Website:** https://triliumnotes.org
- **Documentation:** https://docs.triliumnotes.org
- **GitHub:** https://github.com/TriliumNext/Trilium
- **Discussions:** https://github.com/TriliumNext/Trilium/discussions
- **Matrix Chat:** https://matrix.to/#/#triliumnext:matrix.org

### Community Resources
- **Awesome Trilium:** https://github.com/Nriver/awesome-trilium
- **TriliumRocks:** https://trilium.rocks/
- **Wiki:** https://triliumnext.github.io/Docs/Wiki/

### Related Projects
- **TriliumDroid:** https://github.com/FliegendeWurst/TriliumDroid
- **Web Clipper:** Included in main repository

---

## 📝 Documentation Conventions

### Document Structure
- Overview section
- Table of contents
- Main content with headings
- Code examples where relevant
- "See Also" references

### Code Examples
```typescript
// TypeScript examples with comments
const example = 'value'
```

```sql
-- SQL examples with formatting
SELECT * FROM notes WHERE noteId = ?
```

### Cross-References
- Use relative links: `[text](path/to/file.md)`
- Reference sections: `[text](file.md#section)`
- External links: Full URLs

### Maintenance
- Review on major releases
- Update for architectural changes
- Add examples for new features
- Keep API references current

---

## 🤝 Contributing to Documentation

### What to Document
- New features and APIs
- Architecture changes
- Migration guides
- Performance tips
- Security considerations

### How to Contribute
1. Edit markdown files in `docs/`
2. Follow existing structure and style
3. Include code examples
4. Test links and formatting
5. Submit pull request

### Documentation Standards
- Clear, concise language
- Complete code examples
- Proper markdown formatting
- Cross-references to related docs
- Updated version numbers

---

## 📅 Version Information

- **Documentation Version:** 0.99.3
- **Last Updated:** November 2025
- **Trilium Version:** 0.99.3+
- **Next Review:** When major architectural changes occur

---

## 💡 Getting Help

### For Users
- [User Guide](User%20Guide/User%20Guide/)
- [GitHub Discussions](https://github.com/TriliumNext/Trilium/discussions)
- [Matrix Chat](https://matrix.to/#/#triliumnext:matrix.org)

### For Developers
- [Developer Guide](Developer%20Guide/Developer%20Guide/)
- [Architecture Docs](ARCHITECTURE.md)
- [GitHub Issues](https://github.com/TriliumNext/Trilium/issues)

### For Contributors
- [Contributing Guidelines](../README.md#-contribute)
- [Code of Conduct](../CODE_OF_CONDUCT)
- [Developer Setup](Developer%20Guide/Developer%20Guide/Environment%20Setup.md)

---

**Maintained by:** TriliumNext Team  
**License:** AGPL-3.0-only  
**Repository:** https://github.com/TriliumNext/Trilium
