CREATE TABLE IF NOT EXISTS "entity_changes" (
                                                `id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                                                `entityName`	TEXT NOT NULL,
                                                `entityId`	TEXT NOT NULL,
                                                `hash`	TEXT NOT NULL,
                                                `isErased` INT NOT NULL,
                                                `changeId` TEXT NOT NULL,
                                                `componentId` TEXT NOT NULL,
                                                `instanceId` TEXT NOT NULL,
                                                `isSynced` INTEGER NOT NULL,
                                                `utcDateChanged` TEXT NOT NULL
                                                );
CREATE TABLE IF NOT EXISTS "etapi_tokens"
(
    etapiTokenId TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    tokenHash TEXT NOT NULL,
    utcDateCreated TEXT NOT NULL,
    utcDateModified TEXT NOT NULL,
    isDeleted INT NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS "branches" (
                                          `branchId`	TEXT NOT NULL,
                                          `noteId`	TEXT NOT NULL,
                                          `parentNoteId`	TEXT NOT NULL,
                                          `notePosition`	INTEGER NOT NULL,
                                          `prefix`	TEXT,
                                          `isExpanded`	INTEGER NOT NULL DEFAULT 0,
                                          `isDeleted`	INTEGER NOT NULL DEFAULT 0,
                                          `deleteId`    TEXT DEFAULT NULL,
                                          `utcDateModified`	TEXT NOT NULL,
                                          PRIMARY KEY(`branchId`));
CREATE TABLE IF NOT EXISTS "notes" (
                                       `noteId`	TEXT NOT NULL,
                                       `title`	TEXT NOT NULL DEFAULT "note",
                                       `isProtected`	INT NOT NULL DEFAULT 0,
                                       `type` TEXT NOT NULL DEFAULT 'text',
                                       `mime` TEXT NOT NULL DEFAULT 'text/html',
                                       blobId TEXT DEFAULT NULL,
                                       `isDeleted`	INT NOT NULL DEFAULT 0,
                                       `deleteId`   TEXT DEFAULT NULL,
                                       `dateCreated`	TEXT NOT NULL,
                                       `dateModified`	TEXT NOT NULL,
                                       `utcDateCreated`	TEXT NOT NULL,
                                       `utcDateModified`	TEXT NOT NULL,
                                       PRIMARY KEY(`noteId`));
CREATE TABLE IF NOT EXISTS "revisions" (`revisionId`	TEXT NOT NULL PRIMARY KEY,
                                             `noteId`	TEXT NOT NULL,
                                             type TEXT DEFAULT '' NOT NULL,
                                             mime TEXT DEFAULT '' NOT NULL,
                                             `title`	TEXT NOT NULL,
                                             `isProtected`	INT NOT NULL DEFAULT 0,
                                            blobId TEXT DEFAULT NULL,
                                             `utcDateLastEdited` TEXT NOT NULL,
                                             `utcDateCreated` TEXT NOT NULL,
                                             `utcDateModified` TEXT NOT NULL,
                                             `dateLastEdited` TEXT NOT NULL,
                                             `dateCreated` TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS "options"
(
    name TEXT not null PRIMARY KEY,
    value TEXT not null,
    isSynced INTEGER default 0 not null,
    utcDateModified TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "attributes"
(
    attributeId      TEXT not null primary key,
    noteId       TEXT not null,
    type         TEXT not null,
    name         TEXT not null,
    value        TEXT default '' not null,
    position     INT  default 0 not null,
    utcDateModified TEXT not null,
    isDeleted    INT  not null,
    `deleteId`    TEXT DEFAULT NULL,
    isInheritable int DEFAULT 0 NULL);
CREATE UNIQUE INDEX `IDX_entityChanges_entityName_entityId` ON "entity_changes" (
                                                                                 `entityName`,
                                                                                 `entityId`
    );
CREATE INDEX `IDX_branches_noteId_parentNoteId` ON `branches` (`noteId`,`parentNoteId`);
CREATE INDEX IDX_branches_parentNoteId ON branches (parentNoteId);
CREATE INDEX `IDX_notes_title` ON `notes` (`title`);
CREATE INDEX `IDX_notes_type` ON `notes` (`type`);
CREATE INDEX `IDX_notes_dateCreated` ON `notes` (`dateCreated`);
CREATE INDEX `IDX_notes_dateModified` ON `notes` (`dateModified`);
CREATE INDEX `IDX_notes_utcDateModified` ON `notes` (`utcDateModified`);
CREATE INDEX `IDX_notes_utcDateCreated` ON `notes` (`utcDateCreated`);
CREATE INDEX `IDX_revisions_noteId` ON `revisions` (`noteId`);
CREATE INDEX `IDX_revisions_utcDateCreated` ON `revisions` (`utcDateCreated`);
CREATE INDEX `IDX_revisions_utcDateLastEdited` ON `revisions` (`utcDateLastEdited`);
CREATE INDEX `IDX_revisions_dateCreated` ON `revisions` (`dateCreated`);
CREATE INDEX `IDX_revisions_dateLastEdited` ON `revisions` (`dateLastEdited`);
CREATE INDEX `IDX_entity_changes_changeId` ON `entity_changes` (`changeId`);
CREATE INDEX IDX_attributes_name_value
    on attributes (name, value);
CREATE INDEX IDX_attributes_noteId_index
    on attributes (noteId);
CREATE INDEX IDX_attributes_value_index
    on attributes (value);
CREATE TABLE IF NOT EXISTS "recent_notes"
(
    noteId TEXT not null primary key,
    notePath TEXT not null,
    utcDateCreated TEXT not null
);
CREATE TABLE IF NOT EXISTS "blobs" (
                                               `blobId`	TEXT NOT NULL,
                                               `content`	TEXT NULL DEFAULT NULL,
                                               `dateModified` TEXT NOT NULL,
                                               `utcDateModified` TEXT NOT NULL,
                                               PRIMARY KEY(`blobId`)
);
CREATE TABLE IF NOT EXISTS "attachments"
(
    attachmentId      TEXT not null primary key,
    ownerId       TEXT not null,
    role         TEXT not null,
    mime         TEXT not null,
    title         TEXT not null,
    isProtected    INT  not null DEFAULT 0,
    position     INT  default 0 not null,
    blobId    TEXT DEFAULT null,
    dateModified TEXT NOT NULL,
    utcDateModified TEXT not null,
    utcDateScheduledForErasureSince TEXT DEFAULT NULL,
    isDeleted    INT  not null,
    deleteId    TEXT DEFAULT NULL);
CREATE TABLE IF NOT EXISTS "user_data"
(
    tmpID INT,
    username TEXT,
    email TEXT,
    userIDEncryptedDataKey TEXT,
    userIDVerificationHash TEXT,
    salt TEXT,
    derivedKey TEXT,
    isSetup TEXT DEFAULT "false",
    UNIQUE (tmpID),
    PRIMARY KEY (tmpID)
);
CREATE INDEX IDX_attachments_ownerId_role
    on attachments (ownerId, role);

CREATE INDEX IDX_notes_blobId on notes (blobId);
CREATE INDEX IDX_revisions_blobId on revisions (blobId);
CREATE INDEX IDX_attachments_blobId on attachments (blobId);

-- Strategic Performance Indexes from migration 234
-- NOTES TABLE INDEXES
CREATE INDEX IDX_notes_search_composite 
ON notes (isDeleted, type, mime, dateModified DESC);

CREATE INDEX IDX_notes_metadata_covering 
ON notes (noteId, isDeleted, type, mime, title, dateModified, isProtected);

CREATE INDEX IDX_notes_protected_deleted 
ON notes (isProtected, isDeleted) 
WHERE isProtected = 1;

-- BRANCHES TABLE INDEXES  
CREATE INDEX IDX_branches_tree_traversal 
ON branches (parentNoteId, isDeleted, notePosition);

CREATE INDEX IDX_branches_covering 
ON branches (noteId, parentNoteId, isDeleted, notePosition, prefix);

CREATE INDEX IDX_branches_note_parents 
ON branches (noteId, isDeleted) 
WHERE isDeleted = 0;

-- ATTRIBUTES TABLE INDEXES
CREATE INDEX IDX_attributes_search_composite 
ON attributes (name, value, isDeleted);

CREATE INDEX IDX_attributes_covering 
ON attributes (noteId, name, value, type, isDeleted, position);

CREATE INDEX IDX_attributes_inheritable 
ON attributes (isInheritable, isDeleted) 
WHERE isInheritable = 1 AND isDeleted = 0;

CREATE INDEX IDX_attributes_labels 
ON attributes (type, name, value) 
WHERE type = 'label' AND isDeleted = 0;

CREATE INDEX IDX_attributes_relations 
ON attributes (type, name, value) 
WHERE type = 'relation' AND isDeleted = 0;

-- BLOBS TABLE INDEXES
CREATE INDEX IDX_blobs_content_size 
ON blobs (blobId, LENGTH(content));

-- ATTACHMENTS TABLE INDEXES
CREATE INDEX IDX_attachments_composite 
ON attachments (ownerId, role, isDeleted, position);

-- REVISIONS TABLE INDEXES
CREATE INDEX IDX_revisions_note_date 
ON revisions (noteId, utcDateCreated DESC);

-- ENTITY_CHANGES TABLE INDEXES
CREATE INDEX IDX_entity_changes_sync 
ON entity_changes (isSynced, utcDateChanged);

CREATE INDEX IDX_entity_changes_component 
ON entity_changes (componentId, utcDateChanged DESC);

-- RECENT_NOTES TABLE INDEXES
CREATE INDEX IDX_recent_notes_date 
ON recent_notes (utcDateCreated DESC);


CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    data TEXT,
    expires INTEGER
);

-- FTS5 Full-Text Search Support
-- Optimized FTS5 virtual table with advanced configuration for millions of notes
CREATE VIRTUAL TABLE notes_fts USING fts5(
    noteId UNINDEXED,
    title,
    content,
    tokenize = 'porter unicode61',
    prefix = '2 3 4',      -- Index prefixes of 2, 3, and 4 characters for faster prefix searches
    columnsize = 0,        -- Reduce index size by not storing column sizes (saves ~25% space)
    detail = full          -- Keep full detail for snippet generation
);

-- Optimized triggers to keep FTS table synchronized with notes
-- Consolidated from 7 triggers to 4 for better performance and maintainability

-- Smart trigger for INSERT operations on notes
-- Handles: INSERT, INSERT OR REPLACE, INSERT OR IGNORE, and upsert scenarios
CREATE TRIGGER notes_fts_insert 
AFTER INSERT ON notes
WHEN NEW.type IN ('text', 'code', 'mermaid', 'canvas', 'mindMap') 
    AND NEW.isDeleted = 0
    AND NEW.isProtected = 0
BEGIN
    INSERT OR REPLACE INTO notes_fts (noteId, title, content)
    SELECT 
        NEW.noteId,
        NEW.title,
        COALESCE(b.content, '')
    FROM (SELECT NEW.noteId) AS note_select
    LEFT JOIN blobs b ON b.blobId = NEW.blobId;
END;

-- Smart trigger for UPDATE operations on notes table
-- Only fires when relevant fields actually change to reduce unnecessary work
CREATE TRIGGER notes_fts_update 
AFTER UPDATE ON notes
WHEN (OLD.title != NEW.title OR OLD.type != NEW.type OR OLD.blobId != NEW.blobId OR 
      OLD.isDeleted != NEW.isDeleted OR OLD.isProtected != NEW.isProtected)
    AND NEW.type IN ('text', 'code', 'mermaid', 'canvas', 'mindMap')
BEGIN
    -- Remove old entry
    DELETE FROM notes_fts WHERE noteId = NEW.noteId;
    
    -- Add new entry if eligible
    INSERT OR REPLACE INTO notes_fts (noteId, title, content)
    SELECT 
        NEW.noteId,
        NEW.title,
        COALESCE(b.content, '')
    FROM (SELECT NEW.noteId) AS note_select
    LEFT JOIN blobs b ON b.blobId = NEW.blobId
    WHERE NEW.isDeleted = 0 AND NEW.isProtected = 0;
END;

-- Smart trigger for UPDATE operations on blobs
-- Only fires when content actually changes
CREATE TRIGGER notes_fts_blob_update 
AFTER UPDATE ON blobs
WHEN OLD.content != NEW.content
BEGIN
    -- Update FTS table for all notes sharing this blob
    INSERT OR REPLACE INTO notes_fts (noteId, title, content)
    SELECT 
        n.noteId,
        n.title,
        NEW.content
    FROM notes n
    WHERE n.blobId = NEW.blobId
        AND n.type IN ('text', 'code', 'mermaid', 'canvas', 'mindMap')
        AND n.isDeleted = 0
        AND n.isProtected = 0;
END;

-- Trigger for DELETE operations (handles both hard delete and cleanup)
CREATE TRIGGER notes_fts_delete 
AFTER DELETE ON notes
BEGIN
    DELETE FROM notes_fts WHERE noteId = OLD.noteId;
END;
