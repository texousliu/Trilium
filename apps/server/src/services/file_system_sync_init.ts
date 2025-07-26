"use strict";

import log from "./log.js";
import fileSystemSync from "./file_system_sync.js";
import eventService from "./events.js";
import optionService from "./options.js";

/**
 * Initialization service for file system sync functionality
 */
class FileSystemSyncInit {
    private initialized = false;

    /**
     * Initialize file system sync if enabled
     */
    async init() {
        if (this.initialized) {
            return;
        }

        try {
            // Check if file system sync is enabled
            const isEnabled = optionService.getOption('fileSystemSyncEnabled') === 'true';
            
            if (!isEnabled) {
                log.info('File system sync is disabled');
                return;
            }

            log.info('Initializing file system sync...');
            
            // Initialize the sync engine
            await fileSystemSync.init();
            
            this.initialized = true;
            log.info('File system sync initialized successfully');

        } catch (error) {
            log.error(`Failed to initialize file system sync: ${error}`);
            throw error;
        }
    }

    /**
     * Shutdown file system sync
     */
    async shutdown() {
        if (!this.initialized) {
            return;
        }

        try {
            log.info('Shutting down file system sync...');
            
            await fileSystemSync.shutdown();
            
            this.initialized = false;
            log.info('File system sync shutdown complete');

        } catch (error) {
            log.error(`Error shutting down file system sync: ${error}`);
        }
    }

    /**
     * Check if file system sync is initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Get sync status
     */
    getStatus() {
        if (!this.initialized) {
            return { enabled: false, initialized: false };
        }

        return {
            enabled: true,
            initialized: true,
            status: fileSystemSync.getSyncStatus()
        };
    }

    /**
     * Enable file system sync
     */
    async enable() {
        optionService.setOption('fileSystemSyncEnabled', 'true');
        
        if (!this.initialized) {
            await this.init();
        }
        
        log.info('File system sync enabled');
    }

    /**
     * Disable file system sync
     */
    async disable() {
        optionService.setOption('fileSystemSyncEnabled', 'false');
        
        if (this.initialized) {
            await this.shutdown();
        }
        
        log.info('File system sync disabled');
    }

    /**
     * Perform full sync for a specific mapping
     */
    async fullSync(mappingId: string) {
        if (!this.initialized) {
            throw new Error('File system sync is not initialized');
        }

        return await fileSystemSync.fullSync(mappingId);
    }
}

// Create singleton instance
const fileSystemSyncInit = new FileSystemSyncInit();

export default fileSystemSyncInit;