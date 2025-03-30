import OptionsWidget from "../options_widget.js";
import { TPL } from "./template.js";
import { t } from "../../../../services/i18n.js";
import type { FilterOptionsByType, OptionMap } from "../../../../../../services/options_interface.js";
import server from "../../../../services/server.js";
import toastService from "../../../../services/toast.js";
import type { EmbeddingStats, FailedEmbeddingNotes } from "./interfaces.js";
import { ProviderService } from "./providers.js";

export default class AiSettingsWidget extends OptionsWidget {
    private ollamaModelsRefreshed = false;
    private openaiModelsRefreshed = false;
    private anthropicModelsRefreshed = false;
    private statsRefreshInterval: NodeJS.Timeout | null = null;
    private indexRebuildRefreshInterval: NodeJS.Timeout | null = null;
    private readonly STATS_REFRESH_INTERVAL = 5000; // 5 seconds
    private providerService: ProviderService | null = null;

    doRender() {
        this.$widget = $(TPL);
        this.providerService = new ProviderService(this.$widget);

        // Setup event handlers for options
        this.setupEventHandlers();

        this.refreshEmbeddingStats();
        this.fetchFailedEmbeddingNotes();

        return this.$widget;
    }

    /**
     * Set up all event handlers for options
     */
    setupEventHandlers() {
        if (!this.$widget) return;

        // AI Enabled checkbox
        const $aiEnabled = this.$widget.find('.ai-enabled');
        $aiEnabled.on('change', async () => {
            await this.updateOption('aiEnabled', $aiEnabled.prop('checked') ? 'true' : 'false');
            // Display validation warnings after changing aiEnabled
            await this.displayValidationWarnings();
        });

        // Provider precedence
        const $aiProviderPrecedence = this.$widget.find('.ai-provider-precedence');
        $aiProviderPrecedence.on('change', async () => {
            await this.updateOption('aiProviderPrecedence', $aiProviderPrecedence.val() as string);
            // Display validation warnings after changing precedence list
            await this.displayValidationWarnings();
        });

        // Temperature
        const $aiTemperature = this.$widget.find('.ai-temperature');
        $aiTemperature.on('change', async () => {
            await this.updateOption('aiTemperature', $aiTemperature.val() as string);
        });

        // System prompt
        const $aiSystemPrompt = this.$widget.find('.ai-system-prompt');
        $aiSystemPrompt.on('change', async () => {
            await this.updateOption('aiSystemPrompt', $aiSystemPrompt.val() as string);
        });

        // OpenAI options
        const $openaiApiKey = this.$widget.find('.openai-api-key');
        $openaiApiKey.on('change', async () => {
            await this.updateOption('openaiApiKey', $openaiApiKey.val() as string);
            // Display validation warnings after changing API key
            await this.displayValidationWarnings();
        });

        const $openaiBaseUrl = this.$widget.find('.openai-base-url');
        $openaiBaseUrl.on('change', async () => {
            await this.updateOption('openaiBaseUrl', $openaiBaseUrl.val() as string);
            // Display validation warnings after changing URL
            await this.displayValidationWarnings();
        });

        const $openaiDefaultModel = this.$widget.find('.openai-default-model');
        $openaiDefaultModel.on('change', async () => {
            await this.updateOption('openaiDefaultModel', $openaiDefaultModel.val() as string);
        });

        const $openaiEmbeddingModel = this.$widget.find('.openai-embedding-model');
        $openaiEmbeddingModel.on('change', async () => {
            await this.updateOption('openaiEmbeddingModel', $openaiEmbeddingModel.val() as string);
        });

        // Anthropic options
        const $anthropicApiKey = this.$widget.find('.anthropic-api-key');
        $anthropicApiKey.on('change', async () => {
            await this.updateOption('anthropicApiKey', $anthropicApiKey.val() as string);
            // Display validation warnings after changing API key
            await this.displayValidationWarnings();
        });

        const $anthropicDefaultModel = this.$widget.find('.anthropic-default-model');
        $anthropicDefaultModel.on('change', async () => {
            await this.updateOption('anthropicDefaultModel', $anthropicDefaultModel.val() as string);
        });

        const $anthropicBaseUrl = this.$widget.find('.anthropic-base-url');
        $anthropicBaseUrl.on('change', async () => {
            await this.updateOption('anthropicBaseUrl', $anthropicBaseUrl.val() as string);
        });

        const $voyageApiKey = this.$widget.find('.voyage-api-key');
        $voyageApiKey.on('change', async () => {
            await this.updateOption('voyageApiKey', $voyageApiKey.val() as string);
        });

        const $voyageEmbeddingModel = this.$widget.find('.voyage-embedding-model');
        $voyageEmbeddingModel.on('change', async () => {
            await this.updateOption('voyageEmbeddingModel', $voyageEmbeddingModel.val() as string);
        });

        const $ollamaBaseUrl = this.$widget.find('.ollama-base-url');
        $ollamaBaseUrl.on('change', async () => {
            await this.updateOption('ollamaBaseUrl', $ollamaBaseUrl.val() as string);
        });

        const $ollamaDefaultModel = this.$widget.find('.ollama-default-model');
        $ollamaDefaultModel.on('change', async () => {
            await this.updateOption('ollamaDefaultModel', $ollamaDefaultModel.val() as string);
        });

        const $ollamaEmbeddingModel = this.$widget.find('.ollama-embedding-model');
        $ollamaEmbeddingModel.on('change', async () => {
            await this.updateOption('ollamaEmbeddingModel', $ollamaEmbeddingModel.val() as string);
        });

        const $refreshModels = this.$widget.find('.refresh-models');
        $refreshModels.on('click', async () => {
            this.ollamaModelsRefreshed = await this.providerService?.refreshOllamaModels(true, this.ollamaModelsRefreshed) || false;
        });

        // Add tab change handler for Ollama tab
        const $ollamaTab = this.$widget.find('#nav-ollama-tab');
        $ollamaTab.on('shown.bs.tab', async () => {
            // Only refresh the models if we haven't done it before
            this.ollamaModelsRefreshed = await this.providerService?.refreshOllamaModels(false, this.ollamaModelsRefreshed) || false;
        });

        // OpenAI models refresh button
        const $refreshOpenAIModels = this.$widget.find('.refresh-openai-models');
        $refreshOpenAIModels.on('click', async () => {
            this.openaiModelsRefreshed = await this.providerService?.refreshOpenAIModels(true, this.openaiModelsRefreshed) || false;
        });

        // Add tab change handler for OpenAI tab
        const $openaiTab = this.$widget.find('#nav-openai-tab');
        $openaiTab.on('shown.bs.tab', async () => {
            // Only refresh the models if we haven't done it before
            this.openaiModelsRefreshed = await this.providerService?.refreshOpenAIModels(false, this.openaiModelsRefreshed) || false;
        });

        // Anthropic models refresh button
        const $refreshAnthropicModels = this.$widget.find('.refresh-anthropic-models');
        $refreshAnthropicModels.on('click', async () => {
            this.anthropicModelsRefreshed = await this.providerService?.refreshAnthropicModels(true, this.anthropicModelsRefreshed) || false;
        });

        // Add tab change handler for Anthropic tab
        const $anthropicTab = this.$widget.find('#nav-anthropic-tab');
        $anthropicTab.on('shown.bs.tab', async () => {
            // Only refresh the models if we haven't done it before
            this.anthropicModelsRefreshed = await this.providerService?.refreshAnthropicModels(false, this.anthropicModelsRefreshed) || false;
        });

        // Embedding options event handlers
        const $embeddingAutoUpdateEnabled = this.$widget.find('.embedding-auto-update-enabled');
        $embeddingAutoUpdateEnabled.on('change', async () => {
            await this.updateOption('embeddingAutoUpdateEnabled', $embeddingAutoUpdateEnabled.prop('checked') ? "true" : "false");
        });

        const $enableAutomaticIndexing = this.$widget.find('.enable-automatic-indexing');
        $enableAutomaticIndexing.on('change', async () => {
            await this.updateOption('enableAutomaticIndexing', $enableAutomaticIndexing.prop('checked') ? "true" : "false");
        });

        const $embeddingSimilarityThreshold = this.$widget.find('.embedding-similarity-threshold');
        $embeddingSimilarityThreshold.on('change', async () => {
            await this.updateOption('embeddingSimilarityThreshold', $embeddingSimilarityThreshold.val() as string);
        });

        const $maxNotesPerLlmQuery = this.$widget.find('.max-notes-per-llm-query');
        $maxNotesPerLlmQuery.on('change', async () => {
            await this.updateOption('maxNotesPerLlmQuery', $maxNotesPerLlmQuery.val() as string);
        });

        const $embeddingDefaultProvider = this.$widget.find('.embedding-default-provider');
        $embeddingDefaultProvider.on('change', async () => {
            await this.updateOption('embeddingsDefaultProvider', $embeddingDefaultProvider.val() as string);
            // Display validation warnings after changing default provider
            await this.displayValidationWarnings();
        });

        const $embeddingDimensionStrategy = this.$widget.find('.embedding-dimension-strategy');
        $embeddingDimensionStrategy.on('change', async () => {
            await this.updateOption('embeddingDimensionStrategy', $embeddingDimensionStrategy.val() as string);
        });

        const $embeddingProviderPrecedence = this.$widget.find('.embedding-provider-precedence');
        $embeddingProviderPrecedence.on('change', async () => {
            await this.updateOption('embeddingProviderPrecedence', $embeddingProviderPrecedence.val() as string);
            // Display validation warnings after changing precedence list
            await this.displayValidationWarnings();
        });

        // Set up sortable behavior for the embedding provider precedence list
        this.setupEmbeddingProviderSortable();
        this.setupAiProviderSortable();

        // Embedding stats refresh button
        const $refreshStats = this.$widget.find('.embedding-refresh-stats');
        $refreshStats.on('click', async () => {
            await this.refreshEmbeddingStats();
            await this.fetchFailedEmbeddingNotes();
        });

        // Rebuild index button
        const $rebuildIndex = this.$widget.find('.rebuild-embeddings-index');
        $rebuildIndex.on('click', async () => {
            try {
                await server.post('embeddings/rebuild');
                toastService.showMessage(t("ai_llm.rebuild_index_started"));

                // Start progress polling
                this.pollIndexRebuildProgress();
            } catch (e) {
                console.error('Error starting index rebuild:', e);
                toastService.showError(t("ai_llm.rebuild_index_error"));
            }
        });
    }

    /**
     * Display warnings for validation issues with providers
     */
    async displayValidationWarnings() {
        if (!this.$widget) return;

        const $warningDiv = this.$widget.find('.provider-validation-warning');

        // Check if AI is enabled
        const aiEnabled = this.$widget.find('.ai-enabled').prop('checked');
        if (!aiEnabled) {
            $warningDiv.hide();
            return;
        }

        // Get provider precedence
        const providerPrecedence = (this.$widget.find('.ai-provider-precedence').val() as string || '').split(',');

        // Check for OpenAI configuration if it's in the precedence list
        const openaiWarnings = [];
        if (providerPrecedence.includes('openai')) {
            const openaiApiKey = this.$widget.find('.openai-api-key').val();
            if (!openaiApiKey) {
                openaiWarnings.push(t("ai_llm.warning_openai_missing_api_key"));
            }
        }

        // Check for Anthropic configuration if it's in the precedence list
        const anthropicWarnings = [];
        if (providerPrecedence.includes('anthropic')) {
            const anthropicApiKey = this.$widget.find('.anthropic-api-key').val();
            if (!anthropicApiKey) {
                anthropicWarnings.push(t("ai_llm.warning_anthropic_missing_api_key"));
            }
        }

        // Check for Voyage configuration if it's in the precedence list
        const voyageWarnings = [];
        if (providerPrecedence.includes('voyage')) {
            const voyageApiKey = this.$widget.find('.voyage-api-key').val();
            if (!voyageApiKey) {
                voyageWarnings.push(t("ai_llm.warning_voyage_missing_api_key"));
            }
        }

        // Check for Ollama configuration if it's in the precedence list
        const ollamaWarnings = [];
        if (providerPrecedence.includes('ollama')) {
            const ollamaBaseUrl = this.$widget.find('.ollama-base-url').val();
            if (!ollamaBaseUrl) {
                ollamaWarnings.push(t("ai_llm.warning_ollama_missing_url"));
            }
        }

        // Similar checks for embeddings
        const embeddingWarnings = [];
        const embeddingsEnabled = this.$widget.find('.enable-automatic-indexing').prop('checked');

        if (embeddingsEnabled) {
            const embeddingProviderPrecedence = (this.$widget.find('.embedding-provider-precedence').val() as string || '').split(',');

            if (embeddingProviderPrecedence.includes('openai') && !this.$widget.find('.openai-api-key').val()) {
                embeddingWarnings.push(t("ai_llm.warning_openai_embedding_missing_api_key"));
            }

            if (embeddingProviderPrecedence.includes('voyage') && !this.$widget.find('.voyage-api-key').val()) {
                embeddingWarnings.push(t("ai_llm.warning_voyage_embedding_missing_api_key"));
            }

            if (embeddingProviderPrecedence.includes('ollama') && !this.$widget.find('.ollama-base-url').val()) {
                embeddingWarnings.push(t("ai_llm.warning_ollama_embedding_missing_url"));
            }
        }

        // Combine all warnings
        const allWarnings = [
            ...openaiWarnings,
            ...anthropicWarnings,
            ...voyageWarnings,
            ...ollamaWarnings,
            ...embeddingWarnings
        ];

        // Show or hide warnings
        if (allWarnings.length > 0) {
            const warningHtml = '<strong>' + t("ai_llm.configuration_warnings") + '</strong><ul>' +
                allWarnings.map(warning => `<li>${warning}</li>`).join('') + '</ul>';
            $warningDiv.html(warningHtml).show();
        } else {
            $warningDiv.hide();
        }
    }

    /**
     * Poll for index rebuild progress
     */
    pollIndexRebuildProgress() {
        if (this.indexRebuildRefreshInterval) {
            clearInterval(this.indexRebuildRefreshInterval);
        }

        // Set up polling interval for index rebuild progress
        this.indexRebuildRefreshInterval = setInterval(async () => {
            await this.refreshEmbeddingStats();
        }, this.STATS_REFRESH_INTERVAL);

        // Stop polling after 5 minutes to avoid indefinite polling
        setTimeout(() => {
            if (this.indexRebuildRefreshInterval) {
                clearInterval(this.indexRebuildRefreshInterval);
                this.indexRebuildRefreshInterval = null;
            }
        }, 5 * 60 * 1000);
    }

    /**
     * Refresh embedding statistics
     */
    async refreshEmbeddingStats() {
        if (!this.$widget) return;

        try {
            const response = await server.get<EmbeddingStats>('embeddings/stats');

            if (response && response.success) {
                const stats = response.stats;

                // Update stats display
                this.$widget.find('.embedding-processed-notes').text(stats.embeddedNotesCount);
                this.$widget.find('.embedding-total-notes').text(stats.totalNotesCount);
                this.$widget.find('.embedding-queued-notes').text(stats.queuedNotesCount);
                this.$widget.find('.embedding-failed-notes').text(stats.failedNotesCount);

                if (stats.lastProcessedDate) {
                    const date = new Date(stats.lastProcessedDate);
                    this.$widget.find('.embedding-last-processed').text(date.toLocaleString());
                } else {
                    this.$widget.find('.embedding-last-processed').text('-');
                }

                // Update progress bar
                const $progressBar = this.$widget.find('.embedding-progress');
                const progressPercent = stats.percentComplete;
                $progressBar.css('width', `${progressPercent}%`);
                $progressBar.attr('aria-valuenow', progressPercent.toString());
                $progressBar.text(`${progressPercent}%`);

                // Update status text
                let statusText;
                if (stats.queuedNotesCount > 0) {
                    statusText = t("ai_llm.processing");
                } else if (stats.embeddedNotesCount === 0) {
                    statusText = t("ai_llm.not_started");
                } else if (stats.embeddedNotesCount === stats.totalNotesCount) {
                    statusText = t("ai_llm.complete");

                    // Clear polling interval if processing is complete
                    if (this.indexRebuildRefreshInterval) {
                        clearInterval(this.indexRebuildRefreshInterval);
                        this.indexRebuildRefreshInterval = null;
                    }
                } else {
                    statusText = t("ai_llm.partial");
                }

                this.$widget.find('.embedding-status-text').text(statusText);
            }
        } catch (e) {
            console.error('Error fetching embedding stats:', e);
        }
    }

    /**
     * Fetch failed embedding notes
     */
    async fetchFailedEmbeddingNotes() {
        if (!this.$widget) return;

        try {
            const response = await server.get<FailedEmbeddingNotes>('embeddings/failed-notes');

            if (response && response.success) {
                const failedNotes = response.failedNotes || [];
                const $failedNotesList = this.$widget.find('.embedding-failed-notes-list');

                if (failedNotes.length === 0) {
                    $failedNotesList.html(`<div class="alert alert-info">${t("ai_llm.no_failed_embeddings")}</div>`);
                    return;
                }

                // Create a table with failed notes
                let html = `
                <table class="table table-sm table-striped">
                    <thead>
                        <tr>
                            <th>${t("ai_llm.note_title")}</th>
                            <th>${t("ai_llm.error")}</th>
                            <th>${t("ai_llm.last_attempt")}</th>
                            <th>${t("ai_llm.actions")}</th>
                        </tr>
                    </thead>
                    <tbody>
                `;

                for (const note of failedNotes) {
                    const date = new Date(note.lastAttempt);
                    const isPermanent = note.isPermanent;
                    const noteTitle = note.title || note.noteId;

                    html += `
                    <tr data-note-id="${note.noteId}">
                        <td><a href="#" class="open-note">${noteTitle}</a></td>
                        <td>${note.error}</td>
                        <td>${date.toLocaleString()}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-secondary retry-embedding" ${isPermanent ? 'disabled' : ''}>
                                ${t("ai_llm.retry")}
                            </button>
                        </td>
                    </tr>
                    `;
                }

                html += `
                    </tbody>
                </table>
                `;

                $failedNotesList.html(html);

                // Add event handlers for retry buttons
                $failedNotesList.find('.retry-embedding').on('click', async function() {
                    const noteId = $(this).closest('tr').data('note-id');
                    try {
                        await server.post('embeddings/retry', { noteId });
                        toastService.showMessage(t("ai_llm.retry_queued"));
                        // Remove this row or update status
                        $(this).closest('tr').remove();
                    } catch (e) {
                        console.error('Error retrying embedding:', e);
                        toastService.showError(t("ai_llm.retry_failed"));
                    }
                });

                // Add event handlers for open note links
                $failedNotesList.find('.open-note').on('click', function(e) {
                    e.preventDefault();
                    const noteId = $(this).closest('tr').data('note-id');
                    window.open(`#${noteId}`, '_blank');
                });
            }
        } catch (e) {
            console.error('Error fetching failed embedding notes:', e);
        }
    }

    /**
     * Helper to get display name for providers
     */
    getProviderDisplayName(provider: string): string {
        switch(provider) {
            case 'openai': return 'OpenAI';
            case 'anthropic': return 'Anthropic';
            case 'ollama': return 'Ollama';
            case 'voyage': return 'Voyage';
            case 'local': return 'Local';
            default: return provider.charAt(0).toUpperCase() + provider.slice(1);
        }
    }

    /**
     * Setup sortable behavior for embedding provider precedence
     */
    setupEmbeddingProviderSortable() {
        if (!this.$widget) return;

        const $embeddingProviderPrecedence = this.$widget.find('.embedding-provider-precedence');
        const $sortableList = this.$widget.find('.embedding-provider-sortable');
        const $items = $sortableList.find('li');

        // Make list items draggable
        $items.each((index, item) => this.setupEmbeddingProviderItemDragHandlers($(item)));

        // Setup the remove buttons
        this.setupEmbeddingProviderRemoveHandlers();

        // Setup disabled providers list restore handlers
        this.$widget.find('.embedding-provider-disabled li').each((index, item) => {
            this.setupEmbeddingProviderRestoreHandler($(item));
        });

        // Initialize the order based on saved value
        this.initializeEmbeddingProviderOrder();
    }

    /**
     * Setup sortable behavior for AI provider precedence
     */
    setupAiProviderSortable() {
        if (!this.$widget) return;

        const $aiProviderPrecedence = this.$widget.find('.ai-provider-precedence');
        const $sortableList = this.$widget.find('.provider-sortable');
        const $items = $sortableList.find('li');

        // Make list items draggable
        $items.each((index, item) => this.setupAiItemDragHandlers($(item)));

        // Setup the remove buttons
        this.setupAiProviderRemoveHandlers();

        // Setup disabled providers list restore handlers
        this.$widget.find('.provider-disabled li').each((index, item) => {
            this.setupAiProviderRestoreHandler($(item));
        });

        // Initialize the order based on saved value
        this.initializeAiProviderOrder();
    }

    /**
     * Setup drag handlers for an embedding provider list item
     */
    setupEmbeddingProviderItemDragHandlers($item: JQuery) {
        if (!this.$widget) return;

        const self = this;
        const $embeddingProviderPrecedence = this.$widget.find('.embedding-provider-precedence');
        const $embeddingSortableList = this.$widget.find('.embedding-provider-sortable');

        // Setup dragstart handler
        $item.on('dragstart', function(e: JQuery.DragStartEvent) {
            $(this).addClass('dragging');
            e.originalEvent?.dataTransfer?.setData('text/plain', '');
        });

        // Setup dragend handler
        $item.on('dragend', function() {
            $(this).removeClass('dragging');

            // Update the hidden input value
            const providers = $embeddingSortableList.find('li').map(function() {
                return $(this).data('provider');
            }).get().join(',');

            // Only update if we have providers or if the current value isn't empty
            // This prevents setting an empty string when all providers are removed
            if (providers || $embeddingProviderPrecedence.val()) {
                $embeddingProviderPrecedence.val(providers);
                $embeddingProviderPrecedence.trigger('change');
            }
        });

        // Additional drag event handlers ...

        // All other drag event handlers would be implemented here
    }

    /**
     * Setup event handlers for embedding provider remove buttons
     */
    setupEmbeddingProviderRemoveHandlers() {
        if (!this.$widget) return;

        const self = this;
        const $embeddingProviderPrecedence = this.$widget.find('.embedding-provider-precedence');
        const $embeddingSortableList = this.$widget.find('.embedding-provider-sortable');

        // Remove any existing handlers to prevent duplicates
        this.$widget.find('.remove-provider').off('click');

        // Add handlers
        this.$widget.find('.remove-provider').on('click', function() {
            const $item = $(this).closest('li');
            const provider = $item.data('provider');
            const providerName = self.getProviderDisplayName(provider);

            // Create a new item for the disabled list
            const $disabledItem = $(`
                <li class="standard-list-item d-flex align-items-center" data-provider="${provider}">
                    <strong class="flex-grow-1">${providerName}</strong>
                    <button class="icon-action restore-provider" title="${t("ai_llm.restore_provider")}">
                        <span class="bx bx-plus"></span>
                    </button>
                </li>
            `);

            // Move to disabled list
            self.$widget?.find('.embedding-provider-disabled').append($disabledItem);
            self.setupEmbeddingProviderRestoreHandler($disabledItem);
            $item.remove();

            // Update the precedence value
            const providers = $embeddingSortableList.find('li').map(function() {
                return $(this).data('provider');
            }).get().join(',');
            $embeddingProviderPrecedence.val(providers);
            $embeddingProviderPrecedence.trigger('change');

            // Show disabled providers container
            self.$widget?.find('.disabled-providers-container').show();
        });
    }

    /**
     * Setup event handler for embedding provider restore button
     */
    setupEmbeddingProviderRestoreHandler($item: JQuery) {
        if (!this.$widget) return;

        const self = this;
        const $embeddingProviderPrecedence = this.$widget.find('.embedding-provider-precedence');
        const $embeddingSortableList = this.$widget.find('.embedding-provider-sortable');

        // Remove any existing handlers to prevent duplicates
        $item.find('.restore-provider').off('click');

        // Add handlers
        $item.find('.restore-provider').on('click', function() {
            const $disabledItem = $(this).closest('li');
            const provider = $disabledItem.data('provider');
            const providerName = self.getProviderDisplayName(provider);

            // Create a new item for the active list
            const $activeItem = $(`
                <li class="standard-list-item d-flex align-items-center" data-provider="${provider}" draggable="true">
                    <span class="drag-handle bx bx-dots-vertical-rounded me-2"></span>
                    <strong class="flex-grow-1">${providerName}</strong>
                    <button class="icon-action remove-provider" title="${t("ai_llm.remove_provider")}">
                        <span class="bx bx-x"></span>
                    </button>
                </li>
            `);

            // Move to active list
            $embeddingSortableList.append($activeItem);
            self.setupEmbeddingProviderItemDragHandlers($activeItem);
            self.setupEmbeddingProviderRemoveHandlers();
            $disabledItem.remove();

            // Update the precedence value
            const providers = $embeddingSortableList.find('li').map(function() {
                return $(this).data('provider');
            }).get().join(',');
            $embeddingProviderPrecedence.val(providers);
            $embeddingProviderPrecedence.trigger('change');

            // Hide disabled providers container if it's now empty
            if (self.$widget?.find('.embedding-provider-disabled li').length === 0) {
                self.$widget?.find('.disabled-providers-container').hide();
            }
        });
    }

    /**
     * Initialize the embedding provider precedence order based on saved values
     */
    initializeEmbeddingProviderOrder() {
        if (!this.$widget) return;

        const $embeddingProviderPrecedence = this.$widget.find('.embedding-provider-precedence');
        const $sortableList = this.$widget.find('.embedding-provider-sortable');

        // Get the current value
        const savedValue = $embeddingProviderPrecedence.val() as string;
        // If no saved value, don't proceed with initialization to avoid triggering the "empty" change
        if (!savedValue) return;

        // Get all available providers
        const allProviders = ['openai', 'voyage', 'ollama', 'local'];
        const savedProviders = savedValue.split(',');

        // Clear all items from the disabled list first to avoid duplicates
        this.$widget.find('.embedding-provider-disabled').empty();

        // Find disabled providers (providers in allProviders but not in savedProviders)
        const disabledProviders = allProviders.filter(p => !savedProviders.includes(p));

        // Move saved providers to the end in the correct order
        savedProviders.forEach(provider => {
            const $item = $sortableList.find(`li[data-provider="${provider}"]`);
            if ($item.length) {
                $sortableList.append($item); // Move to the end in the correct order
            }
        });

        // Setup remove click handlers first to ensure they work when simulating clicks
        this.setupEmbeddingProviderRemoveHandlers();

        // Move disabled providers to the disabled list
        disabledProviders.forEach(provider => {
            const $item = $sortableList.find(`li[data-provider="${provider}"]`);
            if ($item.length) {
                // Simulate clicking the remove button to move it to the disabled list
                $item.find('.remove-provider').trigger('click');
            } else {
                // If it's not in the active list already, manually create it in the disabled list
                const providerName = this.getProviderDisplayName(provider);
                const $disabledItem = $(`
                    <li class="standard-list-item d-flex align-items-center" data-provider="${provider}">
                        <strong class="flex-grow-1">${providerName}</strong>
                        <button class="icon-action restore-provider" title="${t("ai_llm.restore_provider")}">
                            <span class="bx bx-plus"></span>
                        </button>
                    </li>
                `);
                this.$widget.find('.embedding-provider-disabled').append($disabledItem);

                // Add restore button handler
                this.setupEmbeddingProviderRestoreHandler($disabledItem);
            }
        });

        // Show/hide the disabled providers container
        const $disabledContainer = this.$widget.find('.disabled-providers-container');
        const hasDisabledProviders = this.$widget.find('.embedding-provider-disabled li').length > 0;
        $disabledContainer.toggle(hasDisabledProviders);
    }

    /**
     * Setup drag handlers for an AI provider list item
     */
    setupAiItemDragHandlers($item: JQuery) {
        if (!this.$widget) return;

        const self = this;
        const $aiProviderPrecedence = this.$widget.find('.ai-provider-precedence');
        const $aiSortableList = this.$widget.find('.provider-sortable');

        // Setup dragstart handler
        $item.on('dragstart', function(e: JQuery.DragStartEvent) {
            $(this).addClass('dragging');
            e.originalEvent?.dataTransfer?.setData('text/plain', '');
        });

        // Setup dragend handler
        $item.on('dragend', function() {
            $(this).removeClass('dragging');

            // Update the hidden input value
            const providers = $aiSortableList.find('li').map(function() {
                return $(this).data('provider');
            }).get().join(',');

            $aiProviderPrecedence.val(providers);
            $aiProviderPrecedence.trigger('change');
        });

        // Additional drag event handlers would go here...
    }

    /**
     * Initialize the AI provider precedence order based on saved values
     */
    initializeAiProviderOrder() {
        if (!this.$widget) return;

        const $aiProviderPrecedence = this.$widget.find('.ai-provider-precedence');
        const $aiSortableList = this.$widget.find('.provider-sortable');

        // Get the current value
        const savedValue = $aiProviderPrecedence.val() as string;
        if (!savedValue) return;

        // Get all available providers
        const allProviders = ['openai', 'anthropic', 'ollama', 'voyage'];
        const savedProviders = savedValue.split(',');

        // Clear all items from the disabled list first to avoid duplicates
        this.$widget.find('.provider-disabled').empty();

        // Find disabled providers (providers in allProviders but not in savedProviders)
        const disabledProviders = allProviders.filter(p => !savedProviders.includes(p));

        // Move saved providers to the end in the correct order
        savedProviders.forEach(provider => {
            const $item = $aiSortableList.find(`li[data-provider="${provider}"]`);
            if ($item.length) {
                $aiSortableList.append($item); // Move to the end in the correct order
            }
        });

        // Setup remove click handlers first to ensure they work when simulating clicks
        this.setupAiProviderRemoveHandlers();

        // Move disabled providers to the disabled list
        disabledProviders.forEach(provider => {
            const $item = $aiSortableList.find(`li[data-provider="${provider}"]`);
            if ($item.length) {
                // Simulate clicking the remove button to move it to the disabled list
                $item.find('.remove-ai-provider').trigger('click');
            } else {
                // If it's not in the active list already, manually create it in the disabled list
                const providerName = this.getProviderDisplayName(provider);
                const $disabledItem = $(`
                    <li class="standard-list-item d-flex align-items-center" data-provider="${provider}">
                        <strong class="flex-grow-1">${providerName}</strong>
                        <button class="icon-action restore-ai-provider" title="${t("ai_llm.restore_provider")}">
                            <span class="bx bx-plus"></span>
                        </button>
                    </li>
                `);
                this.$widget.find('.provider-disabled').append($disabledItem);

                // Add restore button handler
                this.setupAiProviderRestoreHandler($disabledItem);
            }
        });

        // Show/hide the disabled providers container
        const $disabledContainer = this.$widget.find('.disabled-ai-providers-container');
        const hasDisabledProviders = this.$widget.find('.provider-disabled li').length > 0;
        $disabledContainer.toggle(hasDisabledProviders);
    }

    /**
     * Setup event handlers for AI provider remove buttons
     */
    setupAiProviderRemoveHandlers() {
        if (!this.$widget) return;

        // Implementation would go here...
    }

    /**
     * Setup event handler for AI provider restore button
     */
    setupAiProviderRestoreHandler($item: JQuery) {
        if (!this.$widget) return;

        // Implementation would go here...
    }

    /**
     * Called when the options have been loaded from the server
     */
    optionsLoaded(options: OptionMap) {
        if (!this.$widget) return;

        // AI Options
        this.$widget.find('.ai-enabled').prop('checked', options.aiEnabled !== 'false');
        this.$widget.find('.ai-temperature').val(options.aiTemperature || '0.7');
        this.$widget.find('.ai-system-prompt').val(options.aiSystemPrompt || '');
        this.$widget.find('.ai-provider-precedence').val(options.aiProviderPrecedence || 'openai,anthropic,ollama');

        // OpenAI Section
        this.$widget.find('.openai-api-key').val(options.openaiApiKey || '');
        this.$widget.find('.openai-base-url').val(options.openaiBaseUrl || 'https://api.openai.com/v1');
        this.$widget.find('.openai-default-model').val(options.openaiDefaultModel || 'gpt-4o');
        this.$widget.find('.openai-embedding-model').val(options.openaiEmbeddingModel || 'text-embedding-3-small');

        // Anthropic Section
        this.$widget.find('.anthropic-api-key').val(options.anthropicApiKey || '');
        this.$widget.find('.anthropic-base-url').val(options.anthropicBaseUrl || 'https://api.anthropic.com');
        this.$widget.find('.anthropic-default-model').val(options.anthropicDefaultModel || 'claude-3-opus-20240229');

        // Voyage Section
        this.$widget.find('.voyage-api-key').val(options.voyageApiKey || '');
        this.$widget.find('.voyage-embedding-model').val(options.voyageEmbeddingModel || 'voyage-2');

        // Ollama Section
        this.$widget.find('.ollama-base-url').val(options.ollamaBaseUrl || 'http://localhost:11434');
        this.$widget.find('.ollama-default-model').val(options.ollamaDefaultModel || 'llama3');
        this.$widget.find('.ollama-embedding-model').val(options.ollamaEmbeddingModel || 'nomic-embed-text');

        // Embedding Options
        this.$widget.find('.embedding-provider-precedence').val(options.embeddingProviderPrecedence || 'openai,voyage,ollama,local');
        this.$widget.find('.embedding-auto-update-enabled').prop('checked', options.embeddingAutoUpdateEnabled !== 'false');
        this.$widget.find('.enable-automatic-indexing').prop('checked', options.enableAutomaticIndexing !== 'false');
        this.$widget.find('.embedding-similarity-threshold').val(options.embeddingSimilarityThreshold || '0.75');
        this.$widget.find('.max-notes-per-llm-query').val(options.maxNotesPerLlmQuery || '3');
        this.$widget.find('.embedding-dimension-strategy').val(options.embeddingDimensionStrategy || 'auto');

        // Initialize sortable lists
        this.initializeEmbeddingProviderOrder();
        this.initializeAiProviderOrder();

        // Display validation warnings
        this.displayValidationWarnings();
    }

    cleanup() {
        // Clear intervals
        if (this.statsRefreshInterval) {
            clearInterval(this.statsRefreshInterval);
            this.statsRefreshInterval = null;
        }

        if (this.indexRebuildRefreshInterval) {
            clearInterval(this.indexRebuildRefreshInterval);
            this.indexRebuildRefreshInterval = null;
        }
    }
}