"use strict";

import express from "express";
import becca from "../../becca/becca.js";
import BFileSystemMapping from "../../becca/entities/bfile_system_mapping.js";
import fileSystemSyncInit from "../../services/file_system_sync_init.js";
import log from "../../services/log.js";
import ValidationError from "../../errors/validation_error.js";
import fs from "fs-extra";
import path from "path";

const router = express.Router();

interface FileStat {
    isFile: boolean;
    isDirectory: boolean;
    size: number;
    modified: string;
}

// Get all file system mappings
router.get("/mappings", (req, res) => {
    try {
        const mappings = Object.values(becca.fileSystemMappings || {}).map(mapping => ({
            mappingId: mapping.mappingId,
            noteId: mapping.noteId,
            filePath: mapping.filePath,
            syncDirection: mapping.syncDirection,
            isActive: mapping.isActive,
            includeSubtree: mapping.includeSubtree,
            preserveHierarchy: mapping.preserveHierarchy,
            contentFormat: mapping.contentFormat,
            excludePatterns: mapping.excludePatterns,
            lastSyncTime: mapping.lastSyncTime,
            syncErrors: mapping.syncErrors,
            dateCreated: mapping.dateCreated,
            dateModified: mapping.dateModified
        }));

        res.json(mappings);
    } catch (error) {
        log.error(`Error getting file system mappings: ${error}`);
        res.status(500).json({ error: "Failed to get file system mappings" });
    }
});

// Get a specific file system mapping
router.get("/mappings/:mappingId", (req, res) => {
    try {
        const { mappingId } = req.params;
        const mapping = becca.fileSystemMappings[mappingId];

        if (!mapping) {
            return res.status(404).json({ error: "Mapping not found" });
        }

        res.json({
            mappingId: mapping.mappingId,
            noteId: mapping.noteId,
            filePath: mapping.filePath,
            syncDirection: mapping.syncDirection,
            isActive: mapping.isActive,
            includeSubtree: mapping.includeSubtree,
            preserveHierarchy: mapping.preserveHierarchy,
            contentFormat: mapping.contentFormat,
            excludePatterns: mapping.excludePatterns,
            lastSyncTime: mapping.lastSyncTime,
            syncErrors: mapping.syncErrors,
            dateCreated: mapping.dateCreated,
            dateModified: mapping.dateModified
        });
    } catch (error) {
        log.error(`Error getting file system mapping: ${error}`);
        res.status(500).json({ error: "Failed to get file system mapping" });
    }
});

// Create a new file system mapping
router.post("/mappings", async (req, res) => {
    try {
        const {
            noteId,
            filePath,
            syncDirection = 'bidirectional',
            isActive = true,
            includeSubtree = false,
            preserveHierarchy = true,
            contentFormat = 'auto',
            excludePatterns = null
        } = req.body;

        // Validate required fields
        if (!noteId || !filePath) {
            throw new ValidationError("noteId and filePath are required");
        }

        // Validate note exists
        const note = becca.notes[noteId];
        if (!note) {
            throw new ValidationError(`Note ${noteId} not found`);
        }

        // Check if mapping already exists for this note
        const existingMapping = becca.getFileSystemMappingByNoteId(noteId);
        if (existingMapping) {
            throw new ValidationError(`File system mapping already exists for note ${noteId}`);
        }

        // Validate file path exists
        const normalizedPath = path.resolve(filePath);
        if (!await fs.pathExists(normalizedPath)) {
            throw new ValidationError(`File path does not exist: ${normalizedPath}`);
        }

        // Validate sync direction
        const validDirections = ['bidirectional', 'trilium_to_disk', 'disk_to_trilium'];
        if (!validDirections.includes(syncDirection)) {
            throw new ValidationError(`Invalid sync direction. Must be one of: ${validDirections.join(', ')}`);
        }

        // Validate content format
        const validFormats = ['auto', 'markdown', 'html', 'raw'];
        if (!validFormats.includes(contentFormat)) {
            throw new ValidationError(`Invalid content format. Must be one of: ${validFormats.join(', ')}`);
        }

        // Create the mapping
        const mapping = new BFileSystemMapping({
            noteId,
            filePath: normalizedPath,
            syncDirection,
            isActive: isActive ? 1 : 0,
            includeSubtree: includeSubtree ? 1 : 0,
            preserveHierarchy: preserveHierarchy ? 1 : 0,
            contentFormat,
            excludePatterns: Array.isArray(excludePatterns) ? JSON.stringify(excludePatterns) : excludePatterns
        }).save();

        log.info(`Created file system mapping ${mapping.mappingId} for note ${noteId} -> ${normalizedPath}`);

        res.status(201).json({
            mappingId: mapping.mappingId,
            noteId: mapping.noteId,
            filePath: mapping.filePath,
            syncDirection: mapping.syncDirection,
            isActive: mapping.isActive,
            includeSubtree: mapping.includeSubtree,
            preserveHierarchy: mapping.preserveHierarchy,
            contentFormat: mapping.contentFormat,
            excludePatterns: mapping.excludePatterns
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
        } else {
            log.error(`Error creating file system mapping: ${error}`);
            res.status(500).json({ error: "Failed to create file system mapping" });
        }
    }
});

// Update a file system mapping
router.put("/mappings/:mappingId", async (req, res) => {
    try {
        const { mappingId } = req.params;
        const mapping = becca.fileSystemMappings[mappingId];

        if (!mapping) {
            return res.status(404).json({ error: "Mapping not found" });
        }

        const {
            filePath,
            syncDirection,
            isActive,
            includeSubtree,
            preserveHierarchy,
            contentFormat,
            excludePatterns
        } = req.body;

        // Update fields if provided
        if (filePath !== undefined) {
            const normalizedPath = path.resolve(filePath);
            if (!await fs.pathExists(normalizedPath)) {
                throw new ValidationError(`File path does not exist: ${normalizedPath}`);
            }
            mapping.filePath = normalizedPath;
        }

        if (syncDirection !== undefined) {
            const validDirections = ['bidirectional', 'trilium_to_disk', 'disk_to_trilium'];
            if (!validDirections.includes(syncDirection)) {
                throw new ValidationError(`Invalid sync direction. Must be one of: ${validDirections.join(', ')}`);
            }
            mapping.syncDirection = syncDirection;
        }

        if (isActive !== undefined) {
            mapping.isActive = !!isActive;
        }

        if (includeSubtree !== undefined) {
            mapping.includeSubtree = !!includeSubtree;
        }

        if (preserveHierarchy !== undefined) {
            mapping.preserveHierarchy = !!preserveHierarchy;
        }

        if (contentFormat !== undefined) {
            const validFormats = ['auto', 'markdown', 'html', 'raw'];
            if (!validFormats.includes(contentFormat)) {
                throw new ValidationError(`Invalid content format. Must be one of: ${validFormats.join(', ')}`);
            }
            mapping.contentFormat = contentFormat;
        }

        if (excludePatterns !== undefined) {
            mapping.excludePatterns = Array.isArray(excludePatterns) ? excludePatterns : null;
        }

        mapping.save();

        log.info(`Updated file system mapping ${mappingId}`);

        res.json({
            mappingId: mapping.mappingId,
            noteId: mapping.noteId,
            filePath: mapping.filePath,
            syncDirection: mapping.syncDirection,
            isActive: mapping.isActive,
            includeSubtree: mapping.includeSubtree,
            preserveHierarchy: mapping.preserveHierarchy,
            contentFormat: mapping.contentFormat,
            excludePatterns: mapping.excludePatterns
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
        } else {
            log.error(`Error updating file system mapping: ${error}`);
            res.status(500).json({ error: "Failed to update file system mapping" });
        }
    }
});

// Delete a file system mapping
router.delete("/mappings/:mappingId", (req, res) => {
    try {
        const { mappingId } = req.params;
        const mapping = becca.fileSystemMappings[mappingId];

        if (!mapping) {
            return res.status(404).json({ error: "Mapping not found" });
        }

        mapping.markAsDeleted();

        log.info(`Deleted file system mapping ${mappingId}`);

        res.json({ success: true });

    } catch (error) {
        log.error(`Error deleting file system mapping: ${error}`);
        res.status(500).json({ error: "Failed to delete file system mapping" });
    }
});

// Trigger full sync for a mapping
router.post("/mappings/:mappingId/sync", async (req, res) => {
    try {
        const { mappingId } = req.params;

        if (!fileSystemSyncInit.isInitialized()) {
            return res.status(503).json({ error: "File system sync is not initialized" });
        }

        const result = await fileSystemSyncInit.fullSync(mappingId);

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }

    } catch (error) {
        log.error(`Error triggering sync: ${error}`);
        res.status(500).json({ error: "Failed to trigger sync" });
    }
});

// Get sync status for all mappings
router.get("/status", (req, res) => {
    try {
        const status = fileSystemSyncInit.getStatus();
        res.json(status);
    } catch (error) {
        log.error(`Error getting sync status: ${error}`);
        res.status(500).json({ error: "Failed to get sync status" });
    }
});

// Enable/disable file system sync
router.post("/enable", async (req, res) => {
    try {
        await fileSystemSyncInit.enable();
        res.json({ success: true, message: "File system sync enabled" });
    } catch (error) {
        log.error(`Error enabling file system sync: ${error}`);
        res.status(500).json({ error: "Failed to enable file system sync" });
    }
});

router.post("/disable", async (req, res) => {
    try {
        await fileSystemSyncInit.disable();
        res.json({ success: true, message: "File system sync disabled" });
    } catch (error) {
        log.error(`Error disabling file system sync: ${error}`);
        res.status(500).json({ error: "Failed to disable file system sync" });
    }
});

// Validate file path
router.post("/validate-path", async (req, res) => {
    try {
        const { filePath } = req.body;

        if (!filePath) {
            throw new ValidationError("filePath is required");
        }

        const normalizedPath = path.resolve(filePath);
        const exists = await fs.pathExists(normalizedPath);

        let stats: FileStat | null = null;
        if (exists) {
            const fileStats = await fs.stat(normalizedPath);
            stats = {
                isFile: fileStats.isFile(),
                isDirectory: fileStats.isDirectory(),
                size: fileStats.size,
                modified: fileStats.mtime.toISOString()
            };
        }

        res.json({
            path: normalizedPath,
            exists,
            stats
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
        } else {
            log.error(`Error validating file path: ${error}`);
            res.status(500).json({ error: "Failed to validate file path" });
        }
    }
});

export default router;
