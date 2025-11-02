# Trilium Notes - Technical Architecture Documentation

> **Version:** 0.99.3  
> **Last Updated:** November 2025  
> **Maintainer:** TriliumNext Team

## Table of Contents

1. [Introduction](#introduction)
2. [High-Level Architecture](#high-level-architecture)
3. [Monorepo Structure](#monorepo-structure)
4. [Core Architecture Patterns](#core-architecture-patterns)
5. [Data Layer](#data-layer)
6. [Caching System](#caching-system)
7. [Frontend Architecture](#frontend-architecture)
8. [Backend Architecture](#backend-architecture)
9. [API Architecture](#api-architecture)
10. [Build System](#build-system)
11. [Testing Strategy](#testing-strategy)
12. [Security Architecture](#security-architecture)
13. [Related Documentation](#related-documentation)

---

## Introduction

Trilium Notes is a hierarchical note-taking application built as a TypeScript monorepo. It supports multiple deployment modes (desktop, server, mobile web) and features advanced capabilities including synchronization, scripting, encryption, and rich content editing.

### Key Characteristics

- **Monorepo Architecture**: Uses pnpm workspaces for dependency management
- **Multi-Platform**: Desktop (Electron), Server (Node.js/Express), and Mobile Web
- **TypeScript-First**: Strong typing throughout the codebase
- **Plugin-Based**: Extensible architecture for note types and UI components
- **Offline-First**: Full functionality without network connectivity
- **Synchronization-Ready**: Built-in sync protocol for multi-device usage

### Technology Stack

- **Runtime**: Node.js (backend), Browser/Electron (frontend)
- **Language**: TypeScript, JavaScript
- **Database**: SQLite (better-sqlite3)
- **Build Tools**: Vite, ESBuild, pnpm
- **UI Framework**: Custom widget-based system
- **Rich Text**: CKEditor 5 (customized)
- **Code Editing**: CodeMirror 6
- **Desktop**: Electron
- **Server**: Express.js

---

## High-Level Architecture

Trilium follows a **client-server architecture** even in desktop mode, where Electron runs both the backend server and frontend client within the same process.

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Widgets   │  │   Froca    │  │   UI       │            │
│  │  System    │  │   Cache    │  │  Services  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                         │                                    │
│                    WebSocket / REST API                      │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────────┐
│                    Backend Server                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Express   │  │   Becca    │  │   Script   │            │
│  │  Routes    │  │   Cache    │  │   Engine   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                         │                                    │
│                    ┌────┴─────┐                             │
│                    │  SQLite  │                             │
│                    │ Database │                             │
│                    └──────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Modes

1. **Desktop Application**
   - Electron wrapper running both frontend and backend
   - Local SQLite database
   - Full offline functionality
   - Cross-platform (Windows, macOS, Linux)

2. **Server Installation**
   - Node.js server exposing web interface
   - Multi-user capable
   - Can sync with desktop clients
   - Docker deployment supported

3. **Mobile Web**
   - Optimized responsive interface
   - Accessed via browser
   - Requires server installation

---

## Monorepo Structure

Trilium uses **pnpm workspaces** to manage its monorepo structure, with apps and packages clearly separated.

```
trilium/
├── apps/                    # Runnable applications
│   ├── client/             # Frontend application (shared by server & desktop)
│   ├── server/             # Node.js server with web interface
│   ├── desktop/            # Electron desktop application
│   ├── web-clipper/        # Browser extension for web content capture
│   ├── db-compare/         # Database comparison tool
│   ├── dump-db/            # Database export tool
│   ├── edit-docs/          # Documentation editing tool
│   ├── build-docs/         # Documentation build tool
│   └── website/            # Marketing website
│
├── packages/               # Shared libraries
│   ├── commons/           # Shared interfaces and utilities
│   ├── ckeditor5/         # Custom rich text editor
│   ├── codemirror/        # Code editor customizations
│   ├── highlightjs/       # Syntax highlighting
│   ├── ckeditor5-admonition/     # CKEditor plugin: admonitions
│   ├── ckeditor5-footnotes/      # CKEditor plugin: footnotes
│   ├── ckeditor5-keyboard-marker/# CKEditor plugin: keyboard shortcuts
│   ├── ckeditor5-math/           # CKEditor plugin: math equations
│   ├── ckeditor5-mermaid/        # CKEditor plugin: diagrams
│   ├── express-partial-content/  # HTTP partial content middleware
│   ├── share-theme/              # Shared note theme
│   ├── splitjs/                  # Split pane library
│   └── turndown-plugin-gfm/      # Markdown conversion
│
├── docs/                   # Documentation
├── scripts/                # Build and utility scripts
└── patches/                # Package patches (via pnpm)
```

### Package Dependencies

The monorepo uses workspace protocol (`workspace:*`) for internal dependencies:

```
desktop → client → commons
server  → client → commons
client  → ckeditor5, codemirror, highlightjs
ckeditor5 → ckeditor5-* plugins
```

---

## Core Architecture Patterns

### Three-Layer Cache System

Trilium implements a sophisticated **three-tier caching system** to optimize performance and enable offline functionality:

#### 1. Becca (Backend Cache)

Located at: `apps/server/src/becca/`

```typescript
// Becca caches all entities in memory
class Becca {
    notes: Record<string, BNote>
    branches: Record<string, BBranch>
    attributes: Record<string, BAttribute>
    attachments: Record<string, BAttachment>
    // ... other entity collections
}
```

**Responsibilities:**
- Server-side entity cache
- Maintains complete note tree in memory
- Handles entity relationships and integrity
- Provides fast lookups without database queries
- Manages entity lifecycle (create, update, delete)

**Key Files:**
- `becca.ts` - Main cache instance
- `becca_loader.ts` - Loads entities from database
- `becca_service.ts` - Cache management operations
- `entities/` - Entity classes (BNote, BBranch, etc.)

#### 2. Froca (Frontend Cache)

Located at: `apps/client/src/services/froca.ts`

```typescript
// Froca is a read-only mirror of backend data
class Froca {
    notes: Record<string, FNote>
    branches: Record<string, FBranch>
    attributes: Record<string, FAttribute>
    // ... other entity collections
}
```

**Responsibilities:**
- Frontend read-only cache
- Lazy loading of note tree
- Minimizes API calls
- Enables fast UI rendering
- Synchronizes with backend via WebSocket

**Loading Strategy:**
- Initial load: root notes and immediate children
- Lazy load: notes loaded when accessed
- When note is loaded, all parent and child branches load
- Deleted entities tracked via missing branches

#### 3. Shaca (Share Cache)

Located at: `apps/server/src/share/`

**Responsibilities:**
- Optimized cache for shared/published notes
- Handles public note access without authentication
- Performance-optimized for high-traffic scenarios
- Separate from main Becca to isolate concerns

### Entity System

Trilium's data model is based on five core entities:

```
┌──────────────────────────────────────────────────────────┐
│                      Note Tree                           │
│                                                          │
│    ┌─────────┐                                          │
│    │  Note   │                                          │
│    │ (BNote) │                                          │
│    └────┬────┘                                          │
│         │                                               │
│         │ linked by                                     │
│         ▼                                               │
│    ┌──────────┐         ┌─────────────┐               │
│    │ Branch   │◄────────│  Attribute  │               │
│    │(BBranch) │         │ (BAttribute)│               │
│    └──────────┘         └─────────────┘               │
│         │                                               │
│         │ creates                                       │
│         ▼                                               │
│    ┌──────────┐         ┌─────────────┐               │
│    │ Revision │         │ Attachment  │               │
│    │(BRevision│         │(BAttachment)│               │
│    └──────────┘         └─────────────┘               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### Entity Definitions

**1. BNote** (`apps/server/src/becca/entities/bnote.ts`)
- Represents a note with title, content, and metadata
- Type can be: text, code, file, image, canvas, mermaid, etc.
- Contains content via blob reference
- Can be protected (encrypted)
- Has creation and modification timestamps

**2. BBranch** (`apps/server/src/becca/entities/bbranch.ts`)
- Represents parent-child relationship between notes
- Enables note cloning (multiple parents)
- Contains positioning information
- Has optional prefix for customization
- Tracks expansion state in tree

**3. BAttribute** (`apps/server/src/becca/entities/battribute.ts`)
- Key-value metadata attached to notes
- Two types: labels (tags) and relations (links)
- Can be inheritable to child notes
- Used for search, organization, and scripting
- Supports promoted attributes (displayed prominently)

**4. BRevision** (`apps/server/src/becca/entities/brevision.ts`)
- Stores historical versions of note content
- Automatic versioning on edits
- Retains title, type, and content
- Enables note history browsing and restoration

**5. BAttachment** (`apps/server/src/becca/entities/battachment.ts`)
- File attachments linked to notes
- Has owner (note), role, and mime type
- Content stored in blobs
- Can be protected (encrypted)

**6. BBlob** (`apps/server/src/becca/entities/bblob.ts`)
- Binary large object storage
- Stores actual note content and attachments
- Referenced by notes, revisions, and attachments
- Supports encryption for protected content

### Widget-Based UI

The frontend uses a **widget system** for modular, reusable UI components.

Located at: `apps/client/src/widgets/`

```typescript
// Widget Hierarchy
BasicWidget
├── NoteContextAwareWidget (responds to note changes)
│   ├── RightPanelWidget (displayed in right sidebar)
│   └── Type-specific widgets
├── Container widgets (tabs, ribbons, etc.)
└── Specialized widgets (search, calendar, etc.)
```

**Base Classes:**

1. **BasicWidget** (`basic_widget.ts`)
   - Base class for all UI components
   - Lifecycle: construction → rendering → events → destruction
   - Handles DOM manipulation
   - Event subscription management
   - Child widget management

2. **NoteContextAwareWidget** (`note_context_aware_widget.ts`)
   - Extends BasicWidget
   - Automatically updates when active note changes
   - Accesses current note context
   - Used for note-dependent UI

3. **RightPanelWidget** 
   - Widgets displayed in right sidebar
   - Collapsible sections
   - Context-specific tools and information

**Type-Specific Widgets:**

Located at: `apps/client/src/widgets/type_widgets/`

Each note type has a dedicated widget:
- `text_type_widget.ts` - CKEditor integration
- `code_type_widget.ts` - CodeMirror integration
- `file_type_widget.ts` - File preview and download
- `image_type_widget.ts` - Image display and editing
- `canvas_type_widget.ts` - Excalidraw integration
- `mermaid_type_widget.ts` - Diagram rendering
- And more...

---

## Data Layer

### Database Schema

Trilium uses **SQLite** as its database engine, managed via `better-sqlite3`.

Schema location: `apps/server/src/assets/db/schema.sql`

**Core Tables:**

```sql
-- Notes: Core content storage
notes (
    noteId, title, isProtected, type, mime, 
    blobId, isDeleted, dateCreated, dateModified
)

-- Branches: Tree relationships
branches (
    branchId, noteId, parentNoteId, notePosition,
    prefix, isExpanded, isDeleted
)

-- Attributes: Metadata
attributes (
    attributeId, noteId, type, name, value,
    position, isInheritable, isDeleted
)

-- Revisions: Version history
revisions (
    revisionId, noteId, type, mime, title,
    blobId, utcDateLastEdited
)

-- Attachments: File attachments
attachments (
    attachmentId, ownerId, role, mime, title,
    blobId, isProtected, isDeleted
)

-- Blobs: Binary content
blobs (
    blobId, content, dateModified
)

-- Options: Application settings
options (
    name, value, isSynced
)

-- Entity Changes: Sync tracking
entity_changes (
    entityName, entityId, hash, changeId,
    isSynced, utcDateChanged
)
```

### Data Access Patterns

**Direct SQL:**
```typescript
// apps/server/src/services/sql.ts
sql.getRows("SELECT * FROM notes WHERE type = ?", ['text'])
sql.execute("UPDATE notes SET title = ? WHERE noteId = ?", [title, noteId])
```

**Through Becca:**
```typescript
// Recommended approach - uses cache
const note = becca.getNote('noteId')
note.title = 'New Title'
note.save()
```

**Through Froca (Frontend):**
```typescript
// Read-only access
const note = froca.getNote('noteId')
console.log(note.title)
```

### Database Migrations

Migration system: `apps/server/src/migrations/`

- Sequential numbered files (e.g., `XXXX_migration_name.sql`)
- Automatic execution on version upgrade
- Schema version tracked in options table
- Both SQL and JavaScript migrations supported

---

## Caching System

### Cache Initialization

**Backend (Becca):**
```typescript
// On server startup
await becca_loader.load() // Loads all entities into memory
becca.loaded = true
```

**Frontend (Froca):**
```typescript
// On app initialization
await froca.loadInitialTree() // Loads root and visible notes
// Lazy load on demand
const note = await froca.getNote(noteId) // Triggers load if not cached
```

### Cache Invalidation

**Server-Side:**
- Entities automatically update cache on save
- WebSocket broadcasts changes to all clients
- Synchronization updates trigger cache refresh

**Client-Side:**
- WebSocket listeners update Froca
- Manual reload via `froca.loadSubTree(noteId)`
- Full reload on protected session changes

### Cache Consistency

**Entity Change Tracking:**
```typescript
// Every entity modification tracked
entity_changes (
    entityName: 'notes',
    entityId: 'note123',
    hash: 'abc...',
    changeId: 'change456',
    utcDateChanged: '2025-11-02...'
)
```

**Sync Protocol:**
1. Client requests changes since last sync
2. Server returns entity_changes records
3. Client applies changes to Froca
4. Client sends local changes to server
5. Server updates Becca and database

---

## Frontend Architecture

### Application Entry Point

**Desktop:** `apps/client/src/desktop.ts`
**Web:** `apps/client/src/index.ts`

### Service Layer

Located at: `apps/client/src/services/`

Key services:
- `froca.ts` - Frontend cache
- `server.ts` - API communication
- `ws.ts` - WebSocket connection
- `tree_service.ts` - Note tree management
- `note_context.ts` - Active note tracking
- `protected_session.ts` - Encryption key management
- `link.ts` - Note linking and navigation
- `export.ts` - Note export functionality

### UI Components

**Main Layout:**
```
┌──────────────────────────────────────────────────────┐
│                    Title Bar                          │
├──────────┬────────────────────────┬──────────────────┤
│          │                        │                  │
│   Note   │    Note Detail         │  Right Panel    │
│   Tree   │    Editor              │  (Info, Links)  │
│          │                        │                  │
│          │                        │                  │
├──────────┴────────────────────────┴──────────────────┤
│                  Status Bar                          │
└──────────────────────────────────────────────────────┘
```

**Component Locations:**
- `widgets/containers/` - Layout containers
- `widgets/buttons/` - Toolbar buttons
- `widgets/dialogs/` - Modal dialogs
- `widgets/ribbon_widgets/` - Tab widgets
- `widgets/type_widgets/` - Note type editors

### Event System

**Application Events:**
```typescript
// Subscribe to events
appContext.addBeforeUnloadListener(() => {
    // Cleanup before page unload
})

// Trigger events
appContext.trigger('noteTreeLoaded')
```

**Note Context Events:**
```typescript
// NoteContextAwareWidget automatically receives:
- noteSwitched()
- noteChanged()
- refresh()
```

### State Management

Trilium uses **custom state management** rather than Redux/MobX:

- `note_context.ts` - Active note and context
- `froca.ts` - Entity cache
- Component local state
- URL parameters for shareable state

---

## Backend Architecture

### Application Entry Point

Location: `apps/server/src/main.ts`

**Startup Sequence:**
1. Load configuration
2. Initialize database
3. Run migrations
4. Load Becca cache
5. Start Express server
6. Initialize WebSocket
7. Start scheduled tasks

### Service Layer

Located at: `apps/server/src/services/`

**Core Services:**

- **Notes Management**
  - `notes.ts` - CRUD operations
  - `note_contents.ts` - Content handling
  - `note_types.ts` - Type-specific logic
  - `cloning.ts` - Note cloning/multi-parent

- **Tree Operations**
  - `tree.ts` - Tree structure management
  - `branches.ts` - Branch operations
  - `consistency_checks.ts` - Tree integrity

- **Search**
  - `search/search.ts` - Main search engine
  - `search/expressions/` - Search expression parsing
  - `search/services/` - Search utilities

- **Sync**
  - `sync.ts` - Synchronization protocol
  - `sync_update.ts` - Update handling
  - `sync_mutex.ts` - Concurrency control

- **Scripting**
  - `backend_script_api.ts` - Backend script API
  - `script_context.ts` - Script execution context

- **Import/Export**
  - `import/` - Various import formats
  - `export/` - Export to different formats
  - `zip.ts` - Archive handling

- **Security**
  - `encryption.ts` - Note encryption
  - `protected_session.ts` - Session management
  - `password.ts` - Password handling

### Route Structure

Located at: `apps/server/src/routes/`

```
routes/
├── index.ts              # Route registration
├── api/                  # REST API endpoints
│   ├── notes.ts
│   ├── branches.ts
│   ├── attributes.ts
│   ├── search.ts
│   ├── login.ts
│   └── ...
└── custom/               # Special endpoints
    ├── setup.ts
    ├── share.ts
    └── ...
```

**API Endpoint Pattern:**
```typescript
router.get('/api/notes/:noteId', (req, res) => {
    const noteId = req.params.noteId
    const note = becca.getNote(noteId)
    res.json(note.getPojoWithContent())
})
```

### Middleware

Key middleware components:
- `auth.ts` - Authentication
- `csrf.ts` - CSRF protection
- `request_context.ts` - Request-scoped data
- `error_handling.ts` - Error responses

---

## API Architecture

### Internal API

**REST Endpoints** (`/api/*`)

Used by the frontend for all operations:

**Note Operations:**
- `GET /api/notes/:noteId` - Get note
- `POST /api/notes/:noteId/content` - Update content
- `PUT /api/notes/:noteId` - Update metadata
- `DELETE /api/notes/:noteId` - Delete note

**Tree Operations:**
- `GET /api/tree` - Get note tree
- `POST /api/branches` - Create branch
- `PUT /api/branches/:branchId` - Update branch
- `DELETE /api/branches/:branchId` - Delete branch

**Search:**
- `GET /api/search?query=...` - Search notes
- `GET /api/search-note/:noteId` - Execute search note

### ETAPI (External API)

Located at: `apps/server/src/etapi/`

**Purpose:** Third-party integrations and automation

**Authentication:** Token-based (ETAPI tokens)

**OpenAPI Spec:** Auto-generated

**Key Endpoints:**
- `/etapi/notes` - Note CRUD
- `/etapi/branches` - Branch management
- `/etapi/attributes` - Attribute operations
- `/etapi/attachments` - Attachment handling

**Example:**
```bash
curl -H "Authorization: YOUR_TOKEN" \
  https://trilium.example.com/etapi/notes/noteId
```

### WebSocket API

Located at: `apps/server/src/services/ws.ts`

**Purpose:** Real-time updates and synchronization

**Protocol:** WebSocket (Socket.IO-like custom protocol)

**Message Types:**
- `sync` - Synchronization request
- `entity-change` - Entity update notification
- `refresh-tree` - Tree structure changed
- `open-note` - Open note in UI

**Client Subscribe:**
```typescript
ws.subscribe('entity-change', (data) => {
    froca.processEntityChange(data)
})
```

---

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

---

**Document Maintainer:** TriliumNext Team  
**Last Review:** November 2025  
**Next Review:** When major architectural changes occur
