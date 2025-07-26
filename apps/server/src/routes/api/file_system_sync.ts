"use strict";

import becca from "../../becca/becca.js";
import BFileSystemMapping from "../../becca/entities/bfile_system_mapping.js";
import fileSystemSyncInit from "../../services/file_system_sync_init.js";
import log from "../../services/log.js";
import ValidationError from "../../errors/validation_error.js";
import fs from "fs-extra";
import path from "path";
import { router, asyncApiRoute, apiRoute } from "../route_api.js";

interface FileStat {
    isFile: boolean;
    isDirectory: boolean;
    size: number;
    modified: string;
}

// Get all file system mappings
apiRoute("get", "/mappings", () => {
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

    return mappings;
});

// Get a specific file system mapping
apiRoute("get", "/mappings/:mappingId", (req) => {
    const { mappingId } = req.params;
    const mapping = becca.fileSystemMappings[mappingId];

    if (!mapping) {
        return [404, { error: "Mapping not found" }];
    }

    return {
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
    };
});

// Create a new file system mapping
asyncApiRoute("post", "/mappings", async (req) => {
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

    return [201, {
        mappingId: mapping.mappingId,
        noteId: mapping.noteId,
        filePath: mapping.filePath,
        syncDirection: mapping.syncDirection,
        isActive: mapping.isActive,
        includeSubtree: mapping.includeSubtree,
        preserveHierarchy: mapping.preserveHierarchy,
        contentFormat: mapping.contentFormat,
        excludePatterns: mapping.excludePatterns
    }];
});

// Update a file system mapping
asyncApiRoute("put", "/mappings/:mappingId", async (req) => {
    const { mappingId } = req.params;
    const mapping = becca.fileSystemMappings[mappingId];

    if (!mapping) {
        return [404, { error: "Mapping not found" }];
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

    return {
        mappingId: mapping.mappingId,
        noteId: mapping.noteId,
        filePath: mapping.filePath,
        syncDirection: mapping.syncDirection,
        isActive: mapping.isActive,
        includeSubtree: mapping.includeSubtree,
        preserveHierarchy: mapping.preserveHierarchy,
        contentFormat: mapping.contentFormat,
        excludePatterns: mapping.excludePatterns
    };
});

// Delete a file system mapping
apiRoute("delete", "/mappings/:mappingId", (req) => {
    const { mappingId } = req.params;
    const mapping = becca.fileSystemMappings[mappingId];

    if (!mapping) {
        return [404, { error: "Mapping not found" }];
    }

    mapping.markAsDeleted();

    log.info(`Deleted file system mapping ${mappingId}`);

    return { success: true };
});

// Trigger full sync for a mapping
asyncApiRoute("post", "/mappings/:mappingId/sync", async (req) => {
    const { mappingId } = req.params;

    if (!fileSystemSyncInit.isInitialized()) {
        return [503, { error: "File system sync is not initialized" }];
    }

    const result = await fileSystemSyncInit.fullSync(mappingId);

    if (result.success) {
        return result;
    } else {
        return [400, result];
    }
});

// Get sync status for all mappings
apiRoute("get", "/status", () => {
    return fileSystemSyncInit.getStatus();
});

// Enable file system sync
asyncApiRoute("post", "/enable", async () => {
    await fileSystemSyncInit.enable();
    return { success: true, message: "File system sync enabled" };
});

// Disable file system sync
asyncApiRoute("post", "/disable", async () => {
    await fileSystemSyncInit.disable();
    return { success: true, message: "File system sync disabled" };
});

// Validate file path
asyncApiRoute("post", "/validate-path", async (req) => {
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

    return {
        path: normalizedPath,
        exists,
        stats
    };
});

export default router;
