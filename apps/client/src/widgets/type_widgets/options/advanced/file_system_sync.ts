import OptionsWidget from "../options_widget.js";
import server from "../../../../services/server.js";
import toastService from "../../../../services/toast.js";
import { t } from "../../../../services/i18n.js";
import type { OptionMap } from "@triliumnext/commons";

interface FileSystemMapping {
    mappingId: string;
    noteId: string;
    filePath: string;
    syncDirection: 'bidirectional' | 'trilium_to_disk' | 'disk_to_trilium';
    isActive: boolean;
    includeSubtree: boolean;
    preserveHierarchy: boolean;
    contentFormat: 'auto' | 'markdown' | 'html' | 'raw';
    excludePatterns: string[] | null;
    lastSyncTime: string | null;
    syncErrors: string[] | null;
    dateCreated: string;
    dateModified: string;
}

interface SyncStatus {
    enabled: boolean;
    initialized: boolean;
    status?: Record<string, any>;
}

// API Request/Response interfaces
interface PathValidationRequest {
    filePath: string;
}

interface PathValidationResponse {
    exists: boolean;
    stats?: {
        isDirectory: boolean;
        size: number;
        modified: string;
    };
}

interface CreateMappingRequest {
    noteId: string;
    filePath: string;
    syncDirection: 'bidirectional' | 'trilium_to_disk' | 'disk_to_trilium';
    contentFormat: 'auto' | 'markdown' | 'html' | 'raw';
    includeSubtree: boolean;
    preserveHierarchy: boolean;
    excludePatterns: string[] | null;
}

interface UpdateMappingRequest extends CreateMappingRequest {}

interface SyncMappingResponse {
    success: boolean;
    message?: string;
}

interface ApiResponse {
    success?: boolean;
    message?: string;
}

const TPL = /*html*/`
<style>
.modal-hidden {
    display: none !important;
}
.modal-visible {
    display: flex !important;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1050;
    align-items: center;
    justify-content: center;
}
.modal-content {
    background: white;
    border-radius: 0.5rem;
    max-width: 600px;
    width: 90%;
    max-height: 90%;
    overflow-y: auto;
}
</style>
<div class="options-section">
    <h4>File System Sync</h4>

    <div class="form-group">
        <label>
            <input type="checkbox" class="file-sync-enabled-checkbox">
            Enable file system synchronization
        </label>
        <div class="help-block">
            Allows bidirectional synchronization between Trilium notes and files on your local file system.
        </div>
    </div>

    <div class="file-sync-controls" style="display: none;">
        <div class="alert alert-info">
            <strong>Note:</strong> File system sync creates mappings between notes and files/directories.
            Changes in either location will be synchronized automatically when enabled.
        </div>

        <div class="sync-status-container">
            <h5>Sync Status</h5>
            <div class="sync-status-info">
                <div class="status-item">
                    <strong>Status:</strong> <span class="sync-status-text">Loading...</span>
                </div>
                <div class="active-mappings-count">
                    <strong>Active Mappings:</strong> <span class="mappings-count">0</span>
                </div>
            </div>
        </div>

        <div class="mappings-section">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5>File System Mappings</h5>
                <button class="btn btn-primary btn-sm create-mapping-button">
                    <i class="bx bx-plus"></i> Create Mapping
                </button>
            </div>

            <div class="mappings-list">
                <!-- Mappings will be populated here -->
            </div>
        </div>

        <div class="sync-actions mt-3">
            <button class="btn btn-secondary refresh-status-button">
                <i class="bx bx-refresh"></i> Refresh Status
            </button>
        </div>
    </div>
</div>

<!-- Create/Edit Mapping Modal -->
<div class="mapping-modal modal-hidden">
    <div class="modal-backdrop"></div>
    <div class="modal-content">
        <div class="modal-header">
            <h5 class="modal-title">Create File System Mapping</h5>
            <button type="button" class="modal-close" aria-label="Close">
                <i class="bx bx-x"></i>
            </button>
        </div>
        <div class="modal-body">
            <form class="mapping-form">
                <div class="form-group">
                    <label for="note-selector">Note:</label>
                    <input type="text" id="note-selector" class="form-control note-selector"
                           placeholder="Click to select a note..." readonly>
                    <input type="hidden" class="selected-note-id">
                    <div class="help-block">Select the note to map to the file system.</div>
                </div>

                <div class="form-group">
                    <label for="file-path">File/Directory Path:</label>
                    <div class="input-group">
                        <input type="text" id="file-path" class="form-control file-path-input"
                               placeholder="/path/to/file/or/directory">
                        <div class="input-group-append">
                            <button type="button" class="btn btn-secondary validate-path-button">
                                <i class="bx bx-search"></i> Validate
                            </button>
                        </div>
                    </div>
                    <div class="path-validation-result"></div>
                </div>

                <div class="form-group">
                    <label for="sync-direction">Sync Direction:</label>
                    <select id="sync-direction" class="form-control sync-direction-select">
                        <option value="bidirectional">Bidirectional (default)</option>
                        <option value="trilium_to_disk">Trilium → Disk only</option>
                        <option value="disk_to_trilium">Disk → Trilium only</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="content-format">Content Format:</label>
                    <select id="content-format" class="form-control content-format-select">
                        <option value="auto">Auto-detect (default)</option>
                        <option value="markdown">Markdown</option>
                        <option value="html">HTML</option>
                        <option value="raw">Raw/Binary</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>
                        <input type="checkbox" class="include-subtree-checkbox">
                        Include subtree
                    </label>
                    <div class="help-block">Map entire note subtree to directory structure.</div>
                </div>

                <div class="form-group subtree-options" style="display: none;">
                    <label>
                        <input type="checkbox" class="preserve-hierarchy-checkbox" checked>
                        Preserve directory hierarchy
                    </label>
                    <div class="help-block">Create subdirectories matching note hierarchy.</div>
                </div>

                <div class="form-group">
                    <label for="exclude-patterns">Exclude Patterns (one per line):</label>
                    <textarea id="exclude-patterns" class="form-control exclude-patterns-textarea"
                              rows="3" placeholder="*.tmp&#10;node_modules&#10;.git"></textarea>
                    <div class="help-block">Files/directories matching these patterns will be ignored.</div>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary cancel-mapping-button">Cancel</button>
            <button type="button" class="btn btn-primary save-mapping-button">Save Mapping</button>
        </div>
    </div>
</div>`;

const MAPPING_ITEM_TPL = /*html*/`
<div class="mapping-item card mb-2" data-mapping-id="">
    <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
            <div class="mapping-info">
                <div class="mapping-path">
                    <strong class="file-path"></strong>
                </div>
                <div class="mapping-details text-muted">
                    <span class="note-title"></span> •
                    <span class="sync-direction-text"></span> •
                    <span class="content-format-text"></span>
                </div>
                <div class="mapping-status">
                    <span class="status-badge"></span>
                    <span class="last-sync"></span>
                </div>
            </div>
            <div class="mapping-actions">
                <button class="btn btn-sm btn-secondary sync-mapping-button" title="Sync now">
                    <i class="bx bx-refresh"></i>
                </button>
                <button class="btn btn-sm btn-secondary edit-mapping-button" title="Edit">
                    <i class="bx bx-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-mapping-button" title="Delete">
                    <i class="bx bx-trash"></i>
                </button>
            </div>
        </div>
        <div class="sync-errors" style="display: none;">
            <div class="alert alert-warning mt-2">
                <strong>Sync Errors:</strong>
                <ul class="error-list mb-0"></ul>
            </div>
        </div>
    </div>
</div>`;

export default class FileSystemSyncOptions extends OptionsWidget {
    private $fileSyncEnabledCheckbox!: JQuery<HTMLElement>;
    private $fileSyncControls!: JQuery<HTMLElement>;
    private $syncStatusText!: JQuery<HTMLElement>;
    private $mappingsCount!: JQuery<HTMLElement>;
    private $mappingsList!: JQuery<HTMLElement>;
    private $createMappingButton!: JQuery<HTMLElement>;
    private $refreshStatusButton!: JQuery<HTMLElement>;

    // Modal elements
    private $mappingModal!: JQuery<HTMLElement>;
    private $modalTitle!: JQuery<HTMLElement>;
    private $noteSelector!: JQuery<HTMLElement>;
    private $selectedNoteId!: JQuery<HTMLElement>;
    private $filePathInput!: JQuery<HTMLElement>;
    private $validatePathButton!: JQuery<HTMLElement>;
    private $pathValidationResult!: JQuery<HTMLElement>;
    private $syncDirectionSelect!: JQuery<HTMLElement>;
    private $contentFormatSelect!: JQuery<HTMLElement>;
    private $includeSubtreeCheckbox!: JQuery<HTMLElement>;
    private $preserveHierarchyCheckbox!: JQuery<HTMLElement>;
    private $subtreeOptions!: JQuery<HTMLElement>;
    private $excludePatternsTextarea!: JQuery<HTMLElement>;
    private $saveMappingButton!: JQuery<HTMLElement>;
    private $cancelMappingButton!: JQuery<HTMLElement>;
    private $modalClose!: JQuery<HTMLElement>;

    private currentEditingMappingId: string | null = null;
    private mappings: FileSystemMapping[] = [];

    doRender() {
        this.$widget = $(TPL);
        this.initializeElements();
        // Ensure modal is hidden on initialization
        this.$mappingModal.addClass('modal-hidden').removeClass('modal-visible');
        this.setupEventHandlers();
    }

    private initializeElements() {
        this.$fileSyncEnabledCheckbox = this.$widget.find(".file-sync-enabled-checkbox");
        this.$fileSyncControls = this.$widget.find(".file-sync-controls");
        this.$syncStatusText = this.$widget.find(".sync-status-text");
        this.$mappingsCount = this.$widget.find(".mappings-count");
        this.$mappingsList = this.$widget.find(".mappings-list");
        this.$createMappingButton = this.$widget.find(".create-mapping-button");
        this.$refreshStatusButton = this.$widget.find(".refresh-status-button");

        // Modal elements
        this.$mappingModal = this.$widget.find(".mapping-modal");
        this.$modalTitle = this.$mappingModal.find(".modal-title");
        this.$noteSelector = this.$mappingModal.find(".note-selector");
        this.$selectedNoteId = this.$mappingModal.find(".selected-note-id");
        this.$filePathInput = this.$mappingModal.find(".file-path-input");
        this.$validatePathButton = this.$mappingModal.find(".validate-path-button");
        this.$pathValidationResult = this.$mappingModal.find(".path-validation-result");
        this.$syncDirectionSelect = this.$mappingModal.find(".sync-direction-select");
        this.$contentFormatSelect = this.$mappingModal.find(".content-format-select");
        this.$includeSubtreeCheckbox = this.$mappingModal.find(".include-subtree-checkbox");
        this.$preserveHierarchyCheckbox = this.$mappingModal.find(".preserve-hierarchy-checkbox");
        this.$subtreeOptions = this.$mappingModal.find(".subtree-options");
        this.$excludePatternsTextarea = this.$mappingModal.find(".exclude-patterns-textarea");
        this.$saveMappingButton = this.$mappingModal.find(".save-mapping-button");
        this.$cancelMappingButton = this.$mappingModal.find(".cancel-mapping-button");
        this.$modalClose = this.$mappingModal.find(".modal-close");
    }

    private setupEventHandlers() {
        this.$fileSyncEnabledCheckbox.on("change", async () => {
            const isEnabled = this.$fileSyncEnabledCheckbox.prop("checked");

            try {
                if (isEnabled) {
                    await server.post<ApiResponse>("file-system-sync/enable");
                } else {
                    await server.post<ApiResponse>("file-system-sync/disable");
                }

                this.toggleControls(isEnabled);
                if (isEnabled) {
                    await this.refreshStatus();
                }

                toastService.showMessage(`File system sync ${isEnabled ? 'enabled' : 'disabled'}`);
            } catch (error) {
                toastService.showError(`Failed to ${isEnabled ? 'enable' : 'disable'} file system sync`);
                // Revert checkbox state
                this.$fileSyncEnabledCheckbox.prop("checked", !isEnabled);
            }
        });

        this.$createMappingButton.on("click", () => {
            this.showMappingModal();
        });

        this.$refreshStatusButton.on("click", () => {
            this.refreshStatus();
        });

        this.$validatePathButton.on("click", () => {
            this.validatePath();
        });

        this.$includeSubtreeCheckbox.on("change", () => {
            const isChecked = this.$includeSubtreeCheckbox.prop("checked");
            this.$subtreeOptions.toggle(isChecked);
        });

        // Modal handlers
        this.$saveMappingButton.on("click", () => {
            this.saveMapping();
        });

        this.$cancelMappingButton.on("click", () => {
            this.hideMappingModal();
        });

        this.$modalClose.on("click", () => {
            this.hideMappingModal();
        });

        this.$mappingModal.find(".modal-backdrop").on("click", () => {
            this.hideMappingModal();
        });

        // Note selector (simplified - in real implementation would integrate with note picker)
        this.$noteSelector.on("click", () => {
            // TODO: Integrate with Trilium's note picker dialog
            toastService.showMessage("Note picker integration needed");
        });
    }

    private toggleControls(enabled: boolean) {
        this.$fileSyncControls.toggle(enabled);
    }

    private async refreshStatus() {
        try {
            const status = await server.get<SyncStatus>("file-system-sync/status");

            this.$syncStatusText.text(status.initialized ? "Active" : "Inactive");

            if (status.initialized) {
                await this.loadMappings();
            }
        } catch (error) {
            this.$syncStatusText.text("Error");
            toastService.showError("Failed to get sync status");
        }
    }

    private async loadMappings() {
        try {
            this.mappings = await server.get<FileSystemMapping[]>("file-system-sync/mappings");
            this.renderMappings();
            this.$mappingsCount.text(this.mappings.length.toString());
        } catch (error) {
            toastService.showError("Failed to load mappings");
        }
    }

    private renderMappings() {
        this.$mappingsList.empty();

        for (const mapping of this.mappings) {
            const $item = $(MAPPING_ITEM_TPL);
            $item.attr("data-mapping-id", mapping.mappingId);

            $item.find(".file-path").text(mapping.filePath);
            $item.find(".note-title").text(`Note: ${mapping.noteId}`); // TODO: Get actual note title
            $item.find(".sync-direction-text").text(this.formatSyncDirection(mapping.syncDirection));
            $item.find(".content-format-text").text(mapping.contentFormat);

            // Status badge
            const $statusBadge = $item.find(".status-badge");
            if (mapping.syncErrors && mapping.syncErrors.length > 0) {
                $statusBadge.addClass("badge badge-danger").text("Error");
                const $errorsDiv = $item.find(".sync-errors");
                const $errorList = $errorsDiv.find(".error-list");
                mapping.syncErrors.forEach(error => {
                    $errorList.append(`<li>${error}</li>`);
                });
                $errorsDiv.show();
            } else if (mapping.isActive) {
                $statusBadge.addClass("badge badge-success").text("Active");
            } else {
                $statusBadge.addClass("badge badge-secondary").text("Inactive");
            }

            // Last sync time
            if (mapping.lastSyncTime) {
                const lastSync = new Date(mapping.lastSyncTime).toLocaleString();
                $item.find(".last-sync").text(`Last sync: ${lastSync}`);
            } else {
                $item.find(".last-sync").text("Never synced");
            }

            // Action handlers
            $item.find(".sync-mapping-button").on("click", () => {
                this.syncMapping(mapping.mappingId);
            });

            $item.find(".edit-mapping-button").on("click", () => {
                this.editMapping(mapping);
            });

            $item.find(".delete-mapping-button").on("click", () => {
                this.deleteMapping(mapping.mappingId);
            });

            this.$mappingsList.append($item);
        }
    }

    private formatSyncDirection(direction: string): string {
        switch (direction) {
            case 'bidirectional': return 'Bidirectional';
            case 'trilium_to_disk': return 'Trilium → Disk';
            case 'disk_to_trilium': return 'Disk → Trilium';
            default: return direction;
        }
    }

    private showMappingModal(mapping?: FileSystemMapping) {
        this.currentEditingMappingId = mapping?.mappingId || null;

        if (mapping) {
            this.$modalTitle.text("Edit File System Mapping");
            this.populateMappingForm(mapping);
        } else {
            this.$modalTitle.text("Create File System Mapping");
            this.clearMappingForm();
        }

        this.$mappingModal.removeClass('modal-hidden').addClass('modal-visible');
    }

    private hideMappingModal() {
        this.$mappingModal.removeClass('modal-visible').addClass('modal-hidden');
        this.clearMappingForm();
        this.currentEditingMappingId = null;
    }

    private populateMappingForm(mapping: FileSystemMapping) {
        this.$selectedNoteId.val(mapping.noteId);
        this.$noteSelector.val(`Note: ${mapping.noteId}`); // TODO: Show actual note title
        this.$filePathInput.val(mapping.filePath);
        this.$syncDirectionSelect.val(mapping.syncDirection);
        this.$contentFormatSelect.val(mapping.contentFormat);
        this.$includeSubtreeCheckbox.prop("checked", mapping.includeSubtree);
        this.$preserveHierarchyCheckbox.prop("checked", mapping.preserveHierarchy);
        this.$subtreeOptions.toggle(mapping.includeSubtree);

        if (mapping.excludePatterns) {
            this.$excludePatternsTextarea.val(mapping.excludePatterns.join('\n'));
        }
    }

    private clearMappingForm() {
        this.$selectedNoteId.val('');
        this.$noteSelector.val('');
        this.$filePathInput.val('');
        this.$syncDirectionSelect.val('bidirectional');
        this.$contentFormatSelect.val('auto');
        this.$includeSubtreeCheckbox.prop("checked", false);
        this.$preserveHierarchyCheckbox.prop("checked", true);
        this.$subtreeOptions.hide();
        this.$excludePatternsTextarea.val('');
        this.$pathValidationResult.empty();
    }

    private async validatePath() {
        const filePath = this.$filePathInput.val() as string;
        if (!filePath) {
            this.$pathValidationResult.html('<div class="text-danger">Please enter a file path</div>');
            return;
        }

        try {
            const result = await server.post<PathValidationResponse>("file-system-sync/validate-path", { filePath } as PathValidationRequest);

            if (result.exists && result.stats) {
                const type = result.stats.isDirectory ? 'directory' : 'file';
                this.$pathValidationResult.html(
                    `<div class="text-success">✓ Valid ${type} (${result.stats.size} bytes, modified ${new Date(result.stats.modified).toLocaleString()})</div>`
                );
            } else {
                this.$pathValidationResult.html('<div class="text-warning">⚠ Path does not exist</div>');
            }
        } catch (error) {
            this.$pathValidationResult.html('<div class="text-danger">✗ Invalid path</div>');
        }
    }

    private async saveMapping() {
        const noteId = this.$selectedNoteId.val() as string;
        const filePath = this.$filePathInput.val() as string;
        const syncDirection = this.$syncDirectionSelect.val() as string;
        const contentFormat = this.$contentFormatSelect.val() as string;
        const includeSubtree = this.$includeSubtreeCheckbox.prop("checked");
        const preserveHierarchy = this.$preserveHierarchyCheckbox.prop("checked");
        const excludePatternsText = this.$excludePatternsTextarea.val() as string;

        // Validation
        if (!noteId) {
            toastService.showError("Please select a note");
            return;
        }

        if (!filePath) {
            toastService.showError("Please enter a file path");
            return;
        }

        const excludePatterns = excludePatternsText.trim()
            ? excludePatternsText.split('\n').map(p => p.trim()).filter(p => p)
            : null;

        const mappingData: CreateMappingRequest = {
            noteId,
            filePath,
            syncDirection: syncDirection as 'bidirectional' | 'trilium_to_disk' | 'disk_to_trilium',
            contentFormat: contentFormat as 'auto' | 'markdown' | 'html' | 'raw',
            includeSubtree,
            preserveHierarchy,
            excludePatterns
        };

        try {
            if (this.currentEditingMappingId) {
                await server.put<ApiResponse>(`file-system-sync/mappings/${this.currentEditingMappingId}`, mappingData as UpdateMappingRequest);
                toastService.showMessage("Mapping updated successfully");
            } else {
                await server.post<ApiResponse>("file-system-sync/mappings", mappingData);
                toastService.showMessage("Mapping created successfully");
            }

            this.hideMappingModal();
            await this.loadMappings();
        } catch (error) {
            toastService.showError("Failed to save mapping");
        }
    }

    private async syncMapping(mappingId: string) {
        try {
            const result = await server.post<SyncMappingResponse>(`file-system-sync/mappings/${mappingId}/sync`);
            if (result.success) {
                toastService.showMessage("Sync completed successfully");
            } else {
                toastService.showError(`Sync failed: ${result.message}`);
            }
            await this.loadMappings();
        } catch (error) {
            toastService.showError("Failed to trigger sync");
        }
    }

    private editMapping(mapping: FileSystemMapping) {
        this.showMappingModal(mapping);
    }

    private async deleteMapping(mappingId: string) {
        if (!confirm("Are you sure you want to delete this mapping?")) {
            return;
        }

        try {
            await server.delete<ApiResponse>(`file-system-sync/mappings/${mappingId}`);
            toastService.showMessage("Mapping deleted successfully");
            await this.loadMappings();
        } catch (error) {
            toastService.showError("Failed to delete mapping");
        }
    }

    async optionsLoaded(options: OptionMap) {
        const isEnabled = options.fileSystemSyncEnabled === "true";
        this.$fileSyncEnabledCheckbox.prop("checked", isEnabled);
        this.toggleControls(isEnabled);

        if (isEnabled) {
            await this.refreshStatus();
        }
    }
}
