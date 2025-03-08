import OptionsWidget from "./options_widget.js";
import { t } from "../../../services/i18n.js";
import type { FilterOptionsByType, OptionMap } from "../../../../../services/options_interface.js";
import server from "../../../services/server.js";
import toastService from "../../../services/toast.js";

export default class AiSettingsWidget extends OptionsWidget {
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

            <hr />

            <div class="ai-providers-section">
                <h5>${t("ai_llm.provider_configuration")}</h5>

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

            <hr />

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

            <hr />

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

            <hr />

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
                    <label>${t("ai_llm.base_url")}</label>
                    <input class="ollama-base-url form-control" type="text">
                    <div class="help-text">${t("ai_llm.ollama_url_description")}</div>
                </div>

                <div class="form-group">
                    <label>${t("ai_llm.default_model")}</label>
                    <input class="ollama-default-model form-control" type="text">
                    <div class="help-text">${t("ai_llm.ollama_model_description")}</div>
                </div>
            </div>

            <hr />

            <div class="embedding-section">
                <h5>${t("ai_llm.embedding_configuration")}</h5>

                <div class="form-group">
                    <label>
                        <input class="embedding-auto-update-enabled" type="checkbox">
                        ${t("ai_llm.enable_auto_update_embeddings")}
                    </label>
                    <div class="help-text">${t("ai_llm.enable_auto_update_embeddings_description")}</div>
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
            </div>
        </div>`);

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

        // Embedding options event handlers
        const $embeddingAutoUpdateEnabled = this.$widget.find('.embedding-auto-update-enabled');
        $embeddingAutoUpdateEnabled.on('change', async () => {
            await this.updateOption('embeddingAutoUpdateEnabled', $embeddingAutoUpdateEnabled.prop('checked') ? "true" : "false");
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
            } catch (error) {
                console.error("Error reprocessing embeddings:", error);
                toastService.showError(t("ai_llm.reprocess_error"));
            } finally {
                $embeddingReprocessAll.prop('disabled', false);
                $embeddingReprocessAll.text(t("ai_llm.reprocess_all_embeddings"));
            }
        });

        return this.$widget;
    }

    updateAiSectionVisibility() {
        if (!this.$widget) return;

        const aiEnabled = this.$widget.find('.ai-enabled').prop('checked');
        this.$widget.find('.ai-providers-section').toggle(aiEnabled);
        this.$widget.find('.ai-provider').toggle(aiEnabled);
        this.$widget.find('.embedding-section').toggle(aiEnabled);
    }

    optionsLoaded(options: OptionMap) {
        if (!this.$widget) return;

        this.setCheckboxState(this.$widget.find('.ai-enabled'), options.aiEnabled);
        this.setCheckboxState(this.$widget.find('.ollama-enabled'), options.ollamaEnabled);

        this.$widget.find('.ai-provider-precedence').val(options.aiProviderPrecedence);
        this.$widget.find('.ai-temperature').val(options.aiTemperature);
        this.$widget.find('.ai-system-prompt').val(options.aiSystemPrompt);

        this.$widget.find('.openai-api-key').val(options.openaiApiKey);
        this.$widget.find('.openai-default-model').val(options.openaiDefaultModel);
        this.$widget.find('.openai-base-url').val(options.openaiBaseUrl);

        this.$widget.find('.anthropic-api-key').val(options.anthropicApiKey);
        this.$widget.find('.anthropic-default-model').val(options.anthropicDefaultModel);
        this.$widget.find('.anthropic-base-url').val(options.anthropicBaseUrl);

        this.$widget.find('.ollama-base-url').val(options.ollamaBaseUrl);
        this.$widget.find('.ollama-default-model').val(options.ollamaDefaultModel);

        // Load embedding options
        this.setCheckboxState(this.$widget.find('.embedding-auto-update-enabled'), options.embeddingAutoUpdateEnabled);
        this.$widget.find('.embedding-batch-size').val(options.embeddingBatchSize);
        this.$widget.find('.embedding-update-interval').val(options.embeddingUpdateInterval);
        this.$widget.find('.embedding-default-dimension').val(options.embeddingDefaultDimension);

        this.updateAiSectionVisibility();
    }
}
