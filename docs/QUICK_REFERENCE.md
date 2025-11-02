# Trilium Technical Documentation - Quick Reference

> **Start here:** [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) - Complete index of all documentation

## 📖 Documentation Files

| Document | Description | Size | Lines |
|----------|-------------|------|-------|
| [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) | Main index and navigation hub | 13KB | 423 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Complete system architecture | 30KB | 1,016 |
| [DATABASE.md](DATABASE.md) | Database schema and operations | 19KB | 736 |
| [SYNCHRONIZATION.md](SYNCHRONIZATION.md) | Sync protocol and implementation | 14KB | 583 |
| [SCRIPTING.md](SCRIPTING.md) | User scripting system guide | 17KB | 734 |
| [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) | Security implementation details | 19KB | 834 |

**Total:** 112KB of comprehensive documentation across 4,326 lines!

## 🎯 Quick Access by Role

### 👤 End Users
- **Getting Started:** [User Guide](User%20Guide/User%20Guide/)
- **Scripting:** [SCRIPTING.md](SCRIPTING.md)
- **Sync Setup:** [SYNCHRONIZATION.md](SYNCHRONIZATION.md)

### 💻 Developers
- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Development Setup:** [Developer Guide](Developer%20Guide/Developer%20Guide/Environment%20Setup.md)
- **Database:** [DATABASE.md](DATABASE.md)

### 🔒 Security Auditors
- **Security:** [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md)
- **Encryption:** [SECURITY_ARCHITECTURE.md#encryption](SECURITY_ARCHITECTURE.md#encryption)
- **Auth:** [SECURITY_ARCHITECTURE.md#authentication](SECURITY_ARCHITECTURE.md#authentication)

### 🏗️ System Architects
- **Overall Design:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Cache System:** [ARCHITECTURE.md#three-layer-cache-system](ARCHITECTURE.md#three-layer-cache-system)
- **Entity Model:** [ARCHITECTURE.md#entity-system](ARCHITECTURE.md#entity-system)

### 🔧 DevOps Engineers
- **Server Installation:** [User Guide - Server Installation](User%20Guide/User%20Guide/Installation%20&%20Setup/Server%20Installation.md)
- **Docker:** [Developer Guide - Docker](Developer%20Guide/Developer%20Guide/Development%20and%20architecture/Docker.md)
- **Sync Server:** [SYNCHRONIZATION.md#sync-server-configuration](SYNCHRONIZATION.md#sync-server-configuration)

### 📊 Database Administrators
- **Schema:** [DATABASE.md#database-schema](DATABASE.md#database-schema)
- **Maintenance:** [DATABASE.md#database-maintenance](DATABASE.md#database-maintenance)
- **Performance:** [DATABASE.md#performance-optimization](DATABASE.md#performance-optimization)

## 🔍 Quick Topic Finder

### Core Concepts
- **Becca Cache:** [ARCHITECTURE.md#1-becca-backend-cache](ARCHITECTURE.md#1-becca-backend-cache)
- **Froca Cache:** [ARCHITECTURE.md#2-froca-frontend-cache](ARCHITECTURE.md#2-froca-frontend-cache)
- **Entity System:** [ARCHITECTURE.md#entity-system](ARCHITECTURE.md#entity-system)
- **Widget System:** [ARCHITECTURE.md#widget-based-ui](ARCHITECTURE.md#widget-based-ui)

### Database
- **Schema Overview:** [DATABASE.md#schema-overview](DATABASE.md#schema-overview)
- **Notes Table:** [DATABASE.md#notes-table](DATABASE.md#notes-table)
- **Branches Table:** [DATABASE.md#branches-table](DATABASE.md#branches-table)
- **Migrations:** [DATABASE.md#database-migrations](DATABASE.md#database-migrations)

### Synchronization
- **Sync Protocol:** [SYNCHRONIZATION.md#sync-protocol](SYNCHRONIZATION.md#sync-protocol)
- **Conflict Resolution:** [SYNCHRONIZATION.md#conflict-resolution](SYNCHRONIZATION.md#conflict-resolution)
- **Entity Changes:** [SYNCHRONIZATION.md#entity-changes](SYNCHRONIZATION.md#entity-changes)

### Scripting
- **Frontend Scripts:** [SCRIPTING.md#frontend-scripts](SCRIPTING.md#frontend-scripts)
- **Backend Scripts:** [SCRIPTING.md#backend-scripts](SCRIPTING.md#backend-scripts)
- **Script Examples:** [SCRIPTING.md#script-examples](SCRIPTING.md#script-examples)
- **API Reference:** [SCRIPTING.md#script-api](SCRIPTING.md#script-api)

### Security
- **Authentication:** [SECURITY_ARCHITECTURE.md#authentication](SECURITY_ARCHITECTURE.md#authentication)
- **Encryption:** [SECURITY_ARCHITECTURE.md#encryption](SECURITY_ARCHITECTURE.md#encryption)
- **Input Sanitization:** [SECURITY_ARCHITECTURE.md#input-sanitization](SECURITY_ARCHITECTURE.md#input-sanitization)
- **Best Practices:** [SECURITY_ARCHITECTURE.md#security-best-practices](SECURITY_ARCHITECTURE.md#security-best-practices)

## 📚 Learning Paths

### New to Trilium Development
1. Read [ARCHITECTURE.md](ARCHITECTURE.md) - System overview
2. Setup environment: [Environment Setup](Developer%20Guide/Developer%20Guide/Environment%20Setup.md)
3. Explore [DATABASE.md](DATABASE.md) - Understand data model
4. Check [Developer Guide](Developer%20Guide/Developer%20Guide/)

### Want to Create Scripts
1. Read [SCRIPTING.md](SCRIPTING.md) - Complete guide
2. Check [Script API](Script%20API/) - API reference
3. Review examples: [SCRIPTING.md#script-examples](SCRIPTING.md#script-examples)
4. Explore [Advanced Showcases](https://triliumnext.github.io/Docs/Wiki/advanced-showcases)

### Setting Up Sync
1. Understand protocol: [SYNCHRONIZATION.md](SYNCHRONIZATION.md)
2. Configure server: [SYNCHRONIZATION.md#sync-server-configuration](SYNCHRONIZATION.md#sync-server-configuration)
3. Setup clients: [SYNCHRONIZATION.md#client-setup](SYNCHRONIZATION.md#client-setup)
4. Troubleshoot: [SYNCHRONIZATION.md#troubleshooting](SYNCHRONIZATION.md#troubleshooting)

### Security Review
1. Read threat model: [SECURITY_ARCHITECTURE.md#threat-model](SECURITY_ARCHITECTURE.md#threat-model)
2. Review authentication: [SECURITY_ARCHITECTURE.md#authentication](SECURITY_ARCHITECTURE.md#authentication)
3. Check encryption: [SECURITY_ARCHITECTURE.md#encryption](SECURITY_ARCHITECTURE.md#encryption)
4. Verify best practices: [SECURITY_ARCHITECTURE.md#security-best-practices](SECURITY_ARCHITECTURE.md#security-best-practices)

## 🗺️ Documentation Map

```
docs/
├── TECHNICAL_DOCUMENTATION.md  ← START HERE (Index)
│
├── Core Technical Docs
│   ├── ARCHITECTURE.md          (System design)
│   ├── DATABASE.md              (Data layer)
│   ├── SYNCHRONIZATION.md       (Sync system)
│   ├── SCRIPTING.md             (User scripting)
│   └── SECURITY_ARCHITECTURE.md (Security)
│
├── Developer Guide/
│   └── Developer Guide/         (Development setup)
│
├── User Guide/
│   └── User Guide/              (End-user docs)
│
└── Script API/                  (API reference)
```

## 💡 Tips for Reading Documentation

1. **Start with the index:** [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) provides an overview
2. **Use search:** Press Ctrl+F / Cmd+F to find specific topics
3. **Follow links:** Documents are cross-referenced for easy navigation
4. **Code examples:** Most docs include practical code examples
5. **See Also sections:** Check bottom of each doc for related resources

## 🔗 External Resources

- **Website:** https://triliumnotes.org
- **Online Docs:** https://docs.triliumnotes.org
- **GitHub:** https://github.com/TriliumNext/Trilium
- **Discussions:** https://github.com/TriliumNext/Trilium/discussions
- **Matrix Chat:** https://matrix.to/#/#triliumnext:matrix.org

## 🤝 Contributing to Documentation

Found an error or want to improve the docs? See:
- [Contributing Guide](../README.md#-contribute)
- [Documentation Standards](TECHNICAL_DOCUMENTATION.md#documentation-conventions)

---

**Version:** 0.99.3  
**Last Updated:** November 2025  
**Maintained by:** TriliumNext Team
