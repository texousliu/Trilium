import OptionsWidget from "./options_widget.js";
import { t } from "../../../services/i18n.js";
import type { FilterOptionsByType, OptionMap } from "../../../../../services/options_interface.js";
import server from "../../../services/server.js";
import toastService from "../../../services/toast.js";

// Interface for the Ollama model response
interface OllamaModelResponse {
    success: boolean;
    models: Array<{
        name: string;
        model: string;
        details?: {
            family?: string;
            parameter_size?: string;
        }
    }>;
}

// Interface for embedding statistics
interface EmbeddingStats {
    success: boolean;
    stats: {
        totalNotesCount: number;
        embeddedNotesCount: number;
        queuedNotesCount: number;
        failedNotesCount: number;
        lastProcessedDate: string | null;
        percentComplete: number;
    }
}

// Interface for failed embedding notes
interface FailedEmbeddingNotes {
    success: boolean;
    failedNotes: Array<{
        noteId: string;
        title?: string;
        operation: string;
        attempts: number;
        lastAttempt: string;
        error: string;
        failureType: string;
        chunks: number;
        isPermanent: boolean;
    }>;
}

export default class AiSettingsWidget extends OptionsWidget {
    private statsRefreshInterval: NodeJS.Timeout | null = null;
    private indexRebuildRefreshInterval: NodeJS.Timeout | null = null;
    private readonly STATS_REFRESH_INTERVAL = 5000; // 5 seconds

    doRender() {
        this.$widget = $(`
        <div class="options-section">
            <h4>${t("ai_llm.title")}</h4>

            <div class="form-group">
                <label>
                    <input class="ai-enabled" type="checkbox">
                    ${t("ai_llm.enable_ai_features")}
                </label>
                <div class="help-text">${t("ai_llm.enable_ai_description")}</div>
            </div>
        </div>

        <div class="ai-providers-section options-section">
            <h4>${t("ai_llm.provider_configuration")}</h4>

            <div class="form-group">
                <label>${t("ai_llm.provider_precedence")}</label>
                <input class="ai-provider-precedence form-control" type="text">
                <div class="help-text">${t("ai_llm.provider_precedence_description")}</div>
            </div>

            <div class="form-group">
                <label>${t("ai_llm.temperature")}</label>
                <input class="ai-temperature form-control" type="number" min="0" max="2" step="0.1">
                <div class="help-text">${t("ai_llm.temperature_description")}</div>
            </div>

            <div class="form-group">
                <label>${t("ai_llm.system_prompt")}</label>
                <textarea class="ai-system-prompt form-control" rows="3"></textarea>
                <div class="help-text">${t("ai_llm.system_prompt_description")}</div>
            </div>
        </div>

        <div class="options-section">
            <nav>
                <div class="nav nav-tabs" id="nav-tab" role="tablist">
                    <button class="nav-link active" id="nav-openai-tab" data-bs-toggle="tab" data-bs-target="#nav-openai" type="button" role="tab" aria-controls="nav-openai" aria-selected="true">OpenAI</button>
                    <button class="nav-link" id="nav-anthropic-tab" data-bs-toggle="tab" data-bs-target="#nav-anthropic" type="button" role="tab" aria-controls="nav-anthropic" aria-selected="false">Anthropic</button>
                    <button class="nav-link" id="nav-ollama-tab" data-bs-toggle="tab" data-bs-target="#nav-ollama" type="button" role="tab" aria-controls="nav-ollama" aria-selected="false">Ollama</button>
                </div>
            </nav>
            <div class="tab-content" id="nav-tabContent">
                <div class="tab-pane fade show active" id="nav-openai" role="tabpanel" aria-labelledby="nav-openai-tab">
                    <div class="ai-provider">
                        <h5>${t("ai_llm.openai_configuration")}</h5>

                        <div class="form-group">
                            <label>${t("ai_llm.api_key")}</label>
                            <input class="openai-api-key form-control" type="password">
                        </div>

                        <div class="form-group">
                            <label>${t("ai_llm.default_model")}</label>
                            <input class="openai-default-model form-control" type="text">
                            <div class="help-text">${t("ai_llm.openai_model_description")}</div>
                        </div>

                        <div class="form-group">
                            <label>${t("ai_llm.base_url")}</label>
                            <input class="openai-base-url form-control" type="text">
                            <div class="help-text">${t("ai_llm.openai_url_description")}</div>
                        </div>
                    </div>
                </div>
                <div class="tab-pane fade" id="nav-anthropic" role="tabpanel" aria-labelledby="nav-anthropic-tab">
                    <div class="ai-provider">
                        <h5>${t("ai_llm.anthropic_configuration")}</h5>

                        <div class="form-group">
                            <label>${t("ai_llm.api_key")}</label>
                            <input class="anthropic-api-key form-control" type="password">
                        </div>

                        <div class="form-group">
                            <label>${t("ai_llm.default_model")}</label>
                            <input class="anthropic-default-model form-control" type="text">
                            <div class="help-text">${t("ai_llm.anthropic_model_description")}</div>
                        </div>

                        <div class="form-group">
                            <label>${t("ai_llm.base_url")}</label>
                            <input class="anthropic-base-url form-control" type="text">
                            <div class="help-text">${t("ai_llm.anthropic_url_description")}</div>
                        </div>
                    </div>
                </div>
                <div class="tab-pane fade" id="nav-ollama" role="tabpanel" aria-labelledby="nav-ollama-tab">
                    <div class="ai-provider">
                        <h5>${t("ai_llm.ollama_configuration")}</h5>

                        <div class="form-group">
                            <label>
                                <input class="ollama-enabled" type="checkbox">
                                ${t("ai_llm.enable_ollama")}
                            </label>
                            <div class="help-text">${t("ai_llm.enable_ollama_description")}</div>
                        </div>

                        <div class="form-group">
                            <label>${t("ai_llm.ollama_url")}</label>
                            <input class="ollama-base-url form-control" type="text">
                            <div class="help-text">${t("ai_llm.ollama_url_description")}</div>
                        </div>

                        <div class="form-group">
                            <label>${t("ai_llm.ollama_model")}</label>
                            <input class="ollama-default-model form-control" type="text">
                            <div class="help-text">${t("ai_llm.ollama_model_description")}</div>
                        </div>

                        <div class="form-group">
                            <label>${t("ai_llm.ollama_embedding_model")}</label>
                            <select class="ollama-embedding-model form-control">
                                <option value="nomic-embed-text">nomic-embed-text (recommended)</option>
                                <option value="mxbai-embed-large">mxbai-embed-large</option>
                                <option value="llama3">llama3</option>
                            </select>
                            <div class="help-text">${t("ai_llm.ollama_embedding_model_description")}</div>
                            <button class="btn btn-sm btn-outline-secondary refresh-models">${t("ai_llm.refresh_models")}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="embedding-section options-section">
            <h4>${t("ai_llm.embedding_configuration")}</h4>

            <div class="form-group">
                <label>${t("ai_llm.embedding_default_provider")}</label>
                <select class="embedding-default-provider form-control">
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="ollama">Ollama</option>
                    <option value="local">Local</option>
                </select>
                <div class="help-text">${t("ai_llm.embedding_default_provider_description")}</div>
            </div>

            <div class="form-group">
                <label>${t("ai_llm.embedding_generation_location")}</label>
                <select class="embedding-generation-location form-control">
                    <option value="client">${t("ai_llm.embedding_generation_location_client")}</option>
                    <option value="sync_server">${t("ai_llm.embedding_generation_location_sync_server")}</option>
                </select>
                <div class="help-text">${t("ai_llm.embedding_generation_location_description")}</div>
            </div>

            <div class="form-group">
                <label>
                    <input class="embedding-auto-update-enabled" type="checkbox">
                    ${t("ai_llm.enable_auto_update_embeddings")}
                </label>
                <div class="help-text">${t("ai_llm.enable_auto_update_embeddings_description")}</div>
            </div>

            <div class="form-group">
                <label>
                    <input class="enable-automatic-indexing" type="checkbox">
                    ${t("ai_llm.enable_automatic_indexing")}
                </label>
                <div class="help-text">${t("ai_llm.enable_automatic_indexing_description")}</div>
            </div>

            <div class="form-group">
                <label>${t("ai_llm.similarity_threshold")}</label>
                <input class="embedding-similarity-threshold form-control" type="number" min="0" max="1" step="0.01">
                <div class="help-text">${t("ai_llm.similarity_threshold_description")}</div>
            </div>

            <div class="form-group">
                <label>${t("ai_llm.max_notes_per_llm_query")}</label>
                <input class="max-notes-per-llm-query form-control" type="number" min="1" max="50">
                <div class="help-text">${t("ai_llm.max_notes_per_llm_query_description")}</div>
            </div>

            <div class="form-group">
                <label>${t("ai_llm.embedding_batch_size")}</label>
                <input class="embedding-batch-size form-control" type="number" min="1" max="50">
                <div class="help-text">${t("ai_llm.embedding_batch_size_description")}</div>
            </div>

            <div class="form-group">
                <label>${t("ai_llm.embedding_update_interval")}</label>
                <input class="embedding-update-interval form-control" type="number" min="1000" step="1000">
                <div class="help-text">${t("ai_llm.embedding_update_interval_description")}</div>
            </div>

            <div class="form-group">
                <label>${t("ai_llm.embedding_default_dimension")}</label>
                <input class="embedding-default-dimension form-control" type="number" min="128">
                <div class="help-text">${t("ai_llm.embedding_default_dimension_description")}</div>
            </div>

            <div class="form-group">
                <button class="btn btn-sm btn-primary embedding-reprocess-all">
                    ${t("ai_llm.reprocess_all_embeddings")}
                </button>
                <div class="help-text">${t("ai_llm.reprocess_all_embeddings_description")}</div>
            </div>

            <div class="form-group">
                <button class="btn btn-sm btn-primary reprocess-index">
                    ${t("ai_llm.reprocess_index")}
                </button>
                <div class="help-text">${t("ai_llm.reprocess_index_description")}</div>

                <!-- Index rebuild progress tracking -->
                <div class="index-rebuild-progress-container mt-2" style="display: none;">
                    <div class="mt-2">
                        <strong>${t("ai_llm.index_rebuild_progress")}:</strong> <span class="index-rebuild-status-text">-</span>
                    </div>
                    <div class="progress mt-1" style="height: 10px;">
                        <div class="progress-bar index-rebuild-progress" role="progressbar" style="width: 0%;"
                            aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="options-section">
            <h4>${t("ai_llm.embedding_statistics")}</h4>
            <div class="embedding-stats-container">
                <div class="embedding-stats">
                    <div><strong>${t("ai_llm.total_notes")}:</strong> <span class="embedding-total-notes">-</span></div>
                    <div><strong>${t("ai_llm.processed_notes")}:</strong> <span class="embedding-processed-notes">-</span></div>
                    <div><strong>${t("ai_llm.queued_notes")}:</strong> <span class="embedding-queued-notes">-</span></div>
                    <div><strong>${t("ai_llm.failed_notes")}:</strong> <span class="embedding-failed-notes">-</span></div>
                    <div><strong>${t("ai_llm.last_processed")}:</strong> <span class="embedding-last-processed">-</span></div>
                    <div class="mt-2">
                        <strong>${t("ai_llm.progress")}:</strong> <span class="embedding-status-text">-</span>
                    </div>
                    <div class="progress mt-1" style="height: 10px;">
                        <div class="progress-bar embedding-progress" role="progressbar" style="width: 0%;"
                            aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
                    </div>
                </div>
                <div class="mt-2">
                    <button class="btn btn-sm btn-outline-secondary embedding-refresh-stats">
                        ${t("ai_llm.refresh_stats")}
                    </button>
                </div>
            </div>
        </div>

        <!-- Failed embeddings section -->
        <div class="options-section">
            <h4>${t("ai_llm.failed_notes")}</h4>
            <div class="form-group mt-4">
                <div class="embedding-failed-notes-container">
                    <div class="embedding-failed-notes-list">
                        <div class="alert alert-info">${t("ai_llm.no_failed_embeddings")}</div>
                    </div>
                </div>
            </div>
        </div>
        `);

        const $aiEnabled = this.$widget.find('.ai-enabled');
        $aiEnabled.on('change', async () => {
            await this.updateOption('aiEnabled', $aiEnabled.prop('checked') ? "true" : "false");
            this.updateAiSectionVisibility();
        });

        const $ollamaEnabled = this.$widget.find('.ollama-enabled');
        $ollamaEnabled.on('change', async () => {
            await this.updateOption('ollamaEnabled', $ollamaEnabled.prop('checked') ? "true" : "false");
        });

        const $aiProviderPrecedence = this.$widget.find('.ai-provider-precedence');
        $aiProviderPrecedence.on('change', async () => {
            await this.updateOption('aiProviderPrecedence', $aiProviderPrecedence.val() as string);
        });

        const $aiTemperature = this.$widget.find('.ai-temperature');
        $aiTemperature.on('change', async () => {
            await this.updateOption('aiTemperature', $aiTemperature.val() as string);
        });

        const $aiSystemPrompt = this.$widget.find('.ai-system-prompt');
        $aiSystemPrompt.on('change', async () => {
            await this.updateOption('aiSystemPrompt', $aiSystemPrompt.val() as string);
        });

        const $openaiApiKey = this.$widget.find('.openai-api-key');
        $openaiApiKey.on('change', async () => {
            await this.updateOption('openaiApiKey', $openaiApiKey.val() as string);
        });

        const $openaiDefaultModel = this.$widget.find('.openai-default-model');
        $openaiDefaultModel.on('change', async () => {
            await this.updateOption('openaiDefaultModel', $openaiDefaultModel.val() as string);
        });

        const $openaiBaseUrl = this.$widget.find('.openai-base-url');
        $openaiBaseUrl.on('change', async () => {
            await this.updateOption('openaiBaseUrl', $openaiBaseUrl.val() as string);
        });

        const $anthropicApiKey = this.$widget.find('.anthropic-api-key');
        $anthropicApiKey.on('change', async () => {
            await this.updateOption('anthropicApiKey', $anthropicApiKey.val() as string);
        });

        const $anthropicDefaultModel = this.$widget.find('.anthropic-default-model');
        $anthropicDefaultModel.on('change', async () => {
            await this.updateOption('anthropicDefaultModel', $anthropicDefaultModel.val() as string);
        });

        const $anthropicBaseUrl = this.$widget.find('.anthropic-base-url');
        $anthropicBaseUrl.on('change', async () => {
            await this.updateOption('anthropicBaseUrl', $anthropicBaseUrl.val() as string);
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
            $refreshModels.prop('disabled', true);
            $refreshModels.text(t("ai_llm.refreshing_models"));

            try {
                const ollamaBaseUrl = this.$widget.find('.ollama-base-url').val() as string;
                const response = await server.post<OllamaModelResponse>('ollama/list-models', { baseUrl: ollamaBaseUrl });

                if (response && response.success && response.models && response.models.length > 0) {
                    const $embedModelSelect = this.$widget.find('.ollama-embedding-model');
                    const currentValue = $embedModelSelect.val();

                    // Clear existing options
                    $embedModelSelect.empty();

                    // Add embedding-specific models first
                    const embeddingModels = response.models.filter(model =>
                        model.name.includes('embed') || model.name.includes('bert'));

                    embeddingModels.forEach(model => {
                        $embedModelSelect.append(`<option value="${model.name}">${model.name}</option>`);
                    });

                    // Add separator if we have both types
                    if (embeddingModels.length > 0) {
                        $embedModelSelect.append(`<option disabled>───────────</option>`);
                    }

                    // Add other models (LLMs can also generate embeddings)
                    const otherModels = response.models.filter(model =>
                        !model.name.includes('embed') && !model.name.includes('bert'));

                    otherModels.forEach(model => {
                        $embedModelSelect.append(`<option value="${model.name}">${model.name}</option>`);
                    });

                    // Restore previous selection if possible
                    if (currentValue) {
                        $embedModelSelect.val(currentValue);
                    }

                    toastService.showMessage("Models refreshed successfully");
                } else {
                    toastService.showError("No models found from Ollama server");
                }
            } catch (error: any) {
                console.error("Error refreshing Ollama models:", error);
                toastService.showError(`Error refreshing models: ${error.message || 'Unknown error'}`);
            } finally {
                $refreshModels.prop('disabled', false);
                $refreshModels.text(t("ai_llm.refresh_models"));
            }
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
        });

        const $embeddingGenerationLocation = this.$widget.find('.embedding-generation-location');
        $embeddingGenerationLocation.on('change', async () => {
            await this.updateOption('embeddingGenerationLocation', $embeddingGenerationLocation.val() as string);
        });

        const $embeddingBatchSize = this.$widget.find('.embedding-batch-size');
        $embeddingBatchSize.on('change', async () => {
            await this.updateOption('embeddingBatchSize', $embeddingBatchSize.val() as string);
        });

        const $embeddingUpdateInterval = this.$widget.find('.embedding-update-interval');
        $embeddingUpdateInterval.on('change', async () => {
            await this.updateOption('embeddingUpdateInterval', $embeddingUpdateInterval.val() as string);
        });

        const $embeddingDefaultDimension = this.$widget.find('.embedding-default-dimension');
        $embeddingDefaultDimension.on('change', async () => {
            await this.updateOption('embeddingDefaultDimension', $embeddingDefaultDimension.val() as string);
        });

        const $embeddingReprocessAll = this.$widget.find('.embedding-reprocess-all');
        $embeddingReprocessAll.on('click', async () => {
            $embeddingReprocessAll.prop('disabled', true);
            $embeddingReprocessAll.text(t("ai_llm.reprocessing_embeddings"));

            try {
                await server.post('embeddings/reprocess');
                toastService.showMessage(t("ai_llm.reprocess_started"));
                // Refresh stats after reprocessing starts
                await this.refreshEmbeddingStats();
            } catch (error) {
                console.error("Error reprocessing embeddings:", error);
                toastService.showError(t("ai_llm.reprocess_error"));
            } finally {
                $embeddingReprocessAll.prop('disabled', false);
                $embeddingReprocessAll.text(t("ai_llm.reprocess_all_embeddings"));
            }
        });

        const $reprocessIndex = this.$widget.find('.reprocess-index');
        $reprocessIndex.on('click', async () => {
            $reprocessIndex.prop('disabled', true);
            $reprocessIndex.text(t("ai_llm.reprocessing_index"));

            try {
                await server.post('embeddings/rebuild-index');
                toastService.showMessage(t("ai_llm.reprocess_index_started"));
                // Start tracking index rebuild progress
                await this.refreshIndexRebuildStatus();

                // Also refresh embedding stats since they'll update as embeddings are processed
                await this.refreshEmbeddingStats();
            } catch (error) {
                console.error("Error rebuilding index:", error);
                toastService.showError(t("ai_llm.reprocess_index_error"));
            } finally {
                $reprocessIndex.prop('disabled', false);
                $reprocessIndex.text(t("ai_llm.reprocess_index"));
            }
        });

        const $embeddingRefreshStats = this.$widget.find('.embedding-refresh-stats');
        $embeddingRefreshStats.on('click', async () => {
            await this.refreshEmbeddingStats();
        });

        // Initial fetch of embedding stats
        setTimeout(async () => {
            await this.refreshEmbeddingStats();
            // Start polling for stats updates
            this.startStatsPolling();
        }, 500);

        return this.$widget;
    }

    optionsLoaded(options: OptionMap) {
        if (!this.$widget) return;

        this.setCheckboxState(this.$widget.find('.ai-enabled'), options.aiEnabled || 'false');
        this.setCheckboxState(this.$widget.find('.ollama-enabled'), options.ollamaEnabled || 'false');

        this.$widget.find('.ai-provider-precedence').val(options.aiProviderPrecedence || 'openai,anthropic,ollama');
        this.$widget.find('.ai-temperature').val(options.aiTemperature || '0.7');
        this.$widget.find('.ai-system-prompt').val(options.aiSystemPrompt || '');

        this.$widget.find('.openai-api-key').val(options.openaiApiKey || '');
        this.$widget.find('.openai-default-model').val(options.openaiDefaultModel || 'gpt-4o');
        this.$widget.find('.openai-base-url').val(options.openaiBaseUrl || 'https://api.openai.com/v1');

        this.$widget.find('.anthropic-api-key').val(options.anthropicApiKey || '');
        this.$widget.find('.anthropic-default-model').val(options.anthropicDefaultModel || 'claude-3-opus-20240229');
        this.$widget.find('.anthropic-base-url').val(options.anthropicBaseUrl || 'https://api.anthropic.com/v1');

        this.$widget.find('.ollama-base-url').val(options.ollamaBaseUrl || 'http://localhost:11434');
        this.$widget.find('.ollama-default-model').val(options.ollamaDefaultModel || 'llama3');
        this.$widget.find('.ollama-embedding-model').val(options.ollamaEmbeddingModel || 'nomic-embed-text');

        // Load embedding options
        this.$widget.find('.embedding-default-provider').val(options.embeddingsDefaultProvider || 'openai');
        this.$widget.find('.embedding-generation-location').val(options.embeddingGenerationLocation || 'client');
        this.setCheckboxState(this.$widget.find('.embedding-auto-update-enabled'), options.embeddingAutoUpdateEnabled || 'true');
        this.setCheckboxState(this.$widget.find('.enable-automatic-indexing'), options.enableAutomaticIndexing || 'true');
        this.$widget.find('.embedding-similarity-threshold').val(options.embeddingSimilarityThreshold || '0.65');
        this.$widget.find('.max-notes-per-llm-query').val(options.maxNotesPerLlmQuery || '10');
        this.$widget.find('.embedding-batch-size').val(options.embeddingBatchSize || '10');
        this.$widget.find('.embedding-update-interval').val(options.embeddingUpdateInterval || '5000');
        this.$widget.find('.embedding-default-dimension').val(options.embeddingDefaultDimension || '1536');

        this.updateAiSectionVisibility();
    }

    updateAiSectionVisibility() {
        if (!this.$widget) return;

        const aiEnabled = this.$widget.find('.ai-enabled').prop('checked');
        this.$widget.find('.ai-providers-section').toggle(aiEnabled);
        this.$widget.find('.ai-provider').toggle(aiEnabled);
        this.$widget.find('.embedding-section').toggle(aiEnabled);
        this.$widget.find('hr').toggle(aiEnabled);

        // Start or stop polling based on visibility
        if (aiEnabled && this.$widget.find('.embedding-section').is(':visible')) {
            this.startStatsPolling();
        } else {
            this.stopStatsPolling();
        }
    }

    /**
     * Start automatic polling for embedding statistics
     */
    startStatsPolling() {
        // Clear any existing interval first
        this.stopStatsPolling();

        // Set up new polling interval
        this.statsRefreshInterval = setInterval(async () => {
            // Only refresh if this widget is still visible
            if (this.$widget && this.$widget.is(':visible') &&
                this.$widget.find('.embedding-section').is(':visible')) {
                await this.refreshEmbeddingStats(true);

                // Also check index rebuild status
                await this.refreshIndexRebuildStatus(true);

                // Also update failed embeddings list periodically
                await this.updateFailedEmbeddingsList();
            }
        }, this.STATS_REFRESH_INTERVAL);
    }

    /**
     * Stop automatic polling for embedding statistics
     */
    stopStatsPolling() {
        if (this.statsRefreshInterval) {
            clearInterval(this.statsRefreshInterval);
            this.statsRefreshInterval = null;
        }

        if (this.indexRebuildRefreshInterval) {
            clearInterval(this.indexRebuildRefreshInterval);
            this.indexRebuildRefreshInterval = null;
        }
    }

    // Clean up when the widget is removed
    cleanup() {
        this.stopStatsPolling();
        super.cleanup();
    }

    /**
     * Get embedding stats from the server
     */
    async getEmbeddingStats(): Promise<EmbeddingStats | null> {
        try {
            return await server.get('embeddings/stats') as EmbeddingStats;
        } catch (error) {
            console.error('Error fetching embedding stats:', error);
            return null;
        }
    }

    /**
     * Get failed embedding notes from the server
     */
    async getFailedEmbeddingNotes(): Promise<FailedEmbeddingNotes | null> {
        try {
            return await server.get('embeddings/failed') as FailedEmbeddingNotes;
        } catch (error) {
            console.error('Error fetching failed embedding notes:', error);
            return null;
        }
    }

    /**
     * Retry a specific failed embedding
     */
    async retryFailedEmbedding(noteId: string): Promise<boolean> {
        try {
            const result = await server.post(`embeddings/retry/${noteId}`) as {success: boolean};
            return result.success;
        } catch (error) {
            console.error('Error retrying failed embedding:', error);
            return false;
        }
    }

    /**
     * Retry all failed embeddings
     */
    async retryAllFailedEmbeddings(): Promise<boolean> {
        try {
            const result = await server.post('embeddings/retry-all-failed') as {success: boolean};
            return result.success;
        } catch (error) {
            console.error('Error retrying all failed embeddings:', error);
            return false;
        }
    }

    async refreshEmbeddingStats(silent = false) {
        if (!this.$widget) return;

        try {
            const $refreshButton = this.$widget.find('.embedding-refresh-stats');

            // Only update button state if not in silent mode
            if (!silent) {
                $refreshButton.prop('disabled', true);
                $refreshButton.text(t("ai_llm.refreshing"));
            }

            const response = await this.getEmbeddingStats();

            if (response && response.success) {
                const stats = response.stats;

                this.$widget.find('.embedding-total-notes').text(stats.totalNotesCount);
                this.$widget.find('.embedding-processed-notes').text(stats.embeddedNotesCount);
                this.$widget.find('.embedding-queued-notes').text(stats.queuedNotesCount);
                this.$widget.find('.embedding-failed-notes').text(stats.failedNotesCount);

                const lastProcessed = stats.lastProcessedDate
                    ? new Date(stats.lastProcessedDate).toLocaleString()
                    : t("ai_llm.never");
                this.$widget.find('.embedding-last-processed').text(lastProcessed);

                const $progressBar = this.$widget.find('.embedding-progress');
                $progressBar.css('width', `${stats.percentComplete}%`);
                $progressBar.attr('aria-valuenow', stats.percentComplete.toString());
                $progressBar.text(`${stats.percentComplete}%`);

                // Update status text based on state
                const $statusText = this.$widget.find('.embedding-status-text');
                if (stats.queuedNotesCount > 0) {
                    $statusText.text(t("ai_llm.processing", { percentage: stats.percentComplete }));
                } else if (stats.percentComplete < 100) {
                    $statusText.text(t("ai_llm.incomplete", { percentage: stats.percentComplete }));
                } else {
                    $statusText.text(t("ai_llm.complete"));
                }

                // Change progress bar color based on state
                if (stats.queuedNotesCount > 0) {
                    // Processing in progress - use animated progress bar
                    $progressBar.addClass('progress-bar-striped progress-bar-animated bg-info');
                    $progressBar.removeClass('bg-success');
                } else if (stats.percentComplete < 100) {
                    // Incomplete - use standard progress bar
                    $progressBar.removeClass('progress-bar-striped progress-bar-animated bg-info bg-success');
                } else {
                    // Complete - show success color
                    $progressBar.removeClass('progress-bar-striped progress-bar-animated bg-info');
                    $progressBar.addClass('bg-success');
                }

                // Update failed embeddings list if there are failures
                if (stats.failedNotesCount > 0 && !silent) {
                    await this.updateFailedEmbeddingsList();
                }

                // Also check index rebuild status if not in silent mode
                if (!silent) {
                    await this.refreshIndexRebuildStatus(silent);
                }
            }
        } catch (error) {
            console.error("Error fetching embedding stats:", error);
            if (!silent) {
                toastService.showError(t("ai_llm.stats_error"));
            }
        } finally {
            // Only update button state if not in silent mode
            if (!silent) {
                const $refreshButton = this.$widget.find('.embedding-refresh-stats');
                $refreshButton.prop('disabled', false);
                $refreshButton.text(t("ai_llm.refresh_stats"));
            }
        }
    }

    /**
     * Refresh the index rebuild status
     */
    async refreshIndexRebuildStatus(silent = false) {
        if (!this.$widget) return;

        try {
            // Get the current status of index rebuilding
            const response = await server.get('embeddings/index-rebuild-status') as {
                success: boolean,
                status: {
                    inProgress: boolean,
                    progress: number,
                    total: number,
                    current: number
                }
            };

            if (response && response.success) {
                const status = response.status;
                const $progressContainer = this.$widget.find('.index-rebuild-progress-container');
                const $progressBar = this.$widget.find('.index-rebuild-progress');
                const $statusText = this.$widget.find('.index-rebuild-status-text');

                // Only show the progress container if rebuild is in progress
                if (status.inProgress) {
                    $progressContainer.show();
                } else if (status.progress === 100) {
                    // Show for 10 seconds after completion, then hide
                    $progressContainer.show();
                    setTimeout(() => {
                        $progressContainer.fadeOut('slow');
                    }, 10000);
                } else if (status.progress === 0) {
                    // Hide if no rebuild has been started
                    $progressContainer.hide();
                }

                // Update progress bar
                $progressBar.css('width', `${status.progress}%`);
                $progressBar.attr('aria-valuenow', status.progress.toString());
                $progressBar.text(`${status.progress}%`);

                // Update status text
                if (status.inProgress) {
                    $statusText.text(t("ai_llm.index_rebuilding", { percentage: status.progress }));

                    // Apply animated style for active progress
                    $progressBar.addClass('progress-bar-striped progress-bar-animated bg-info');
                    $progressBar.removeClass('bg-success');
                } else if (status.progress === 100) {
                    $statusText.text(t("ai_llm.index_rebuild_complete"));

                    // Apply success style for completed progress
                    $progressBar.removeClass('progress-bar-striped progress-bar-animated bg-info');
                    $progressBar.addClass('bg-success');
                }

                // Start a refresh interval if in progress
                if (status.inProgress && !this.indexRebuildRefreshInterval) {
                    this.indexRebuildRefreshInterval = setInterval(() => {
                        this.refreshIndexRebuildStatus(true);
                    }, this.STATS_REFRESH_INTERVAL);
                } else if (!status.inProgress && this.indexRebuildRefreshInterval) {
                    // Clear the interval if rebuild is complete
                    clearInterval(this.indexRebuildRefreshInterval);
                    this.indexRebuildRefreshInterval = null;
                }
            }
        } catch (error) {
            console.error("Error fetching index rebuild status:", error);
            if (!silent) {
                toastService.showError(t("ai_llm.index_rebuild_status_error"));
            }
        }
    }

    async updateFailedEmbeddingsList() {
        if (!this.$widget) return;

        const failedResult = await this.getFailedEmbeddingNotes();
        if (!failedResult || !failedResult.failedNotes.length) {
            // Use consistent styling with the rest of the application
            this.$widget.find('.embedding-failed-notes-list').html(
                `<div class="alert alert-info">${t("ai_llm.no_failed_embeddings")}</div>`
            );
            return;
        }

        // Create header with count and retry all button
        const $header = $(`
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">Failed Embeddings (${failedResult.failedNotes.length})</h6>
                <button class="btn btn-sm btn-primary retry-all-btn">Retry All</button>
            </div>
        `);

        // Create list container using the application's native note-list class
        const $failedList = $('<div class="note-list mb-3">');

        for (const note of failedResult.failedNotes) {
            // Determine if this is a full note failure or just failed chunks
            const isFullFailure = note.failureType === 'full';
            const isPermanentlyFailed = note.isPermanent === true;

            // Use Bootstrap 4 badge classes
            let badgeText = isFullFailure ? 'Full Note' : `Chunks Failed`;
            let badgeClass = 'badge-warning';

            if (isPermanentlyFailed) {
                badgeClass = 'badge-danger';
                if (isFullFailure) {
                    badgeText = 'Permanently Failed';
                } else {
                    badgeText = 'Partially Failed';
                }
            }

            // Use the application's native note-list-item styling without custom font styles
            const $item = $(`
                <div class="note-list-item">
                    <div class="note-book-card p-2">
                        <div class="note-book-content">
                            <div class="note-book-title">
                                <span class="note-title">${note.title || note.noteId}</span>
                                <span class="badge ${badgeClass} ml-2">${badgeText}</span>
                            </div>
                            <div class="note-book-excerpt">
                                <div class="note-detail-field">
                                    <span class="note-detail-label">${isPermanentlyFailed ? 'Status:' : 'Attempts:'}</span>
                                    <span class="note-detail-value">${isPermanentlyFailed ? 'Permanently failed' : note.attempts}</span>
                                </div>
                                <div class="note-detail-field">
                                    <span class="note-detail-label">Last attempt:</span>
                                    <span class="note-detail-value">${note.lastAttempt.substring(0, 19)}</span>
                                </div>
                                <div class="note-detail-field">
                                    <span class="note-detail-label">Error:</span>
                                    <span class="note-detail-value">${(note.error || 'Unknown error').substring(0, 100)}${(note.error && note.error.length > 100) ? '...' : ''}</span>
                                </div>
                            </div>
                        </div>
                        <div class="note-book-actions">
                            <button class="btn btn-sm btn-outline-secondary retry-btn" data-note-id="${note.noteId}">
                                <i class="fas fa-redo-alt"></i> Retry
                            </button>
                        </div>
                    </div>
                </div>
            `);

            $failedList.append($item);
        }

        // Add the header and list to the DOM (no card structure)
        this.$widget.find('.embedding-failed-notes-list').empty().append($header, $failedList);

        // Add event handlers using local variables to avoid 'this' issues
        const self = this;

        this.$widget.find('.retry-btn').on('click', async function(e) {
            // Prevent default behavior
            e.preventDefault();

            const $button = $(this);
            const noteId = $button.data('note-id');

            // Show loading state
            $button.prop('disabled', true)
                .removeClass('btn-outline-secondary')
                .addClass('btn-outline-secondary')
                .html('<span class="fa fa-spin fa-spinner mr-1"></span>Retrying');

            const success = await self.retryFailedEmbedding(noteId);

            if (success) {
                toastService.showMessage(t("ai_llm.note_queued_for_retry"));
                await self.refreshEmbeddingStats();
            } else {
                toastService.showError(t("ai_llm.failed_to_retry_note"));
                $button.prop('disabled', false)
                    .html('<i class="fas fa-redo-alt"></i> Retry');
            }
        });

        this.$widget.find('.retry-all-btn').on('click', async function(e) {
            const $button = $(this);

            // Show loading state
            $button.prop('disabled', true)
                .removeClass('btn-primary')
                .addClass('btn-secondary')
                .html('<span class="fa fa-spin fa-spinner mr-1"></span>Retrying All');

            const success = await self.retryAllFailedEmbeddings();

            if (success) {
                toastService.showMessage(t("ai_llm.all_notes_queued_for_retry"));
                await self.refreshEmbeddingStats();

                // Return button to original state after successful refresh
                if (!$button.is(':disabled')) { // Check if button still exists
                    $button.prop('disabled', false)
                        .removeClass('btn-secondary')
                        .addClass('btn-primary')
                        .html('Retry All');
                }
            } else {
                toastService.showError(t("ai_llm.failed_to_retry_all"));
                $button.prop('disabled', false)
                    .removeClass('btn-secondary')
                    .addClass('btn-primary')
                    .html('Retry All');
            }
        });
    }
}

