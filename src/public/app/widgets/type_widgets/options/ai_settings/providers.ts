import server from "../../../../services/server.js";
import toastService from "../../../../services/toast.js";
import { t } from "../../../../services/i18n.js";
import { OpenAIModelResponse, AnthropicModelResponse, OllamaModelResponse } from "./interfaces.js";

export class ProviderService {
    constructor(private $widget: JQuery<HTMLElement>) {}

    /**
     * Refreshes the list of OpenAI models
     * @param showLoading Whether to show loading indicators and toasts
     * @param openaiModelsRefreshed Reference to track if models have been refreshed
     * @returns Promise that resolves when the refresh is complete
     */
    async refreshOpenAIModels(showLoading: boolean, openaiModelsRefreshed: boolean): Promise<boolean> {
        if (!this.$widget) return false;
        
        const $refreshOpenAIModels = this.$widget.find('.refresh-openai-models');
        
        // If we've already refreshed and we're not forcing a refresh, don't do it again
        if (openaiModelsRefreshed && !showLoading) {
            return openaiModelsRefreshed;
        }
        
        if (showLoading) {
            $refreshOpenAIModels.prop('disabled', true);
            $refreshOpenAIModels.html(`<i class="spinner-border spinner-border-sm"></i>`);
        }

        try {
            const openaiBaseUrl = this.$widget.find('.openai-base-url').val() as string;
            const response = await server.post<OpenAIModelResponse>('openai/list-models', { baseUrl: openaiBaseUrl });

            if (response && response.success) {
                // Update the chat models dropdown
                if (response.chatModels?.length > 0) {
                    const $chatModelSelect = this.$widget.find('.openai-default-model');
                    const currentChatValue = $chatModelSelect.val();

                    // Clear existing options
                    $chatModelSelect.empty();

                    // Sort models by name
                    const sortedChatModels = [...response.chatModels].sort((a, b) => a.name.localeCompare(b.name));

                    // Add models to the dropdown
                    sortedChatModels.forEach(model => {
                        $chatModelSelect.append(`<option value="${model.id}">${model.name}</option>`);
                    });

                    // Try to restore the previously selected value
                    if (currentChatValue) {
                        $chatModelSelect.val(currentChatValue);
                        // If the value doesn't exist anymore, select the first option
                        if (!$chatModelSelect.val()) {
                            $chatModelSelect.prop('selectedIndex', 0);
                        }
                    }
                }

                // Update the embedding models dropdown
                if (response.embeddingModels?.length > 0) {
                    const $embedModelSelect = this.$widget.find('.openai-embedding-model');
                    const currentEmbedValue = $embedModelSelect.val();

                    // Clear existing options
                    $embedModelSelect.empty();

                    // Sort models by name
                    const sortedEmbedModels = [...response.embeddingModels].sort((a, b) => a.name.localeCompare(b.name));

                    // Add models to the dropdown
                    sortedEmbedModels.forEach(model => {
                        $embedModelSelect.append(`<option value="${model.id}">${model.name}</option>`);
                    });

                    // Try to restore the previously selected value
                    if (currentEmbedValue) {
                        $embedModelSelect.val(currentEmbedValue);
                        // If the value doesn't exist anymore, select the first option
                        if (!$embedModelSelect.val()) {
                            $embedModelSelect.prop('selectedIndex', 0);
                        }
                    }
                }

                if (showLoading) {
                    // Show success message
                    const totalModels = (response.chatModels?.length || 0) + (response.embeddingModels?.length || 0);
                    toastService.showMessage(`${totalModels} OpenAI models found.`);
                }
                
                return true;
            } else if (showLoading) {
                toastService.showError(`No OpenAI models found. Please check your API key and settings.`);
            }
            
            return openaiModelsRefreshed;
        } catch (e) {
            console.error(`Error fetching OpenAI models:`, e);
            if (showLoading) {
                toastService.showError(`Error fetching OpenAI models: ${e}`);
            }
            return openaiModelsRefreshed;
        } finally {
            if (showLoading) {
                $refreshOpenAIModels.prop('disabled', false);
                $refreshOpenAIModels.html(`<span class="bx bx-refresh"></span>`);
            }
        }
    }
    
    /**
     * Refreshes the list of Anthropic models
     * @param showLoading Whether to show loading indicators and toasts
     * @param anthropicModelsRefreshed Reference to track if models have been refreshed
     * @returns Promise that resolves when the refresh is complete
     */
    async refreshAnthropicModels(showLoading: boolean, anthropicModelsRefreshed: boolean): Promise<boolean> {
        if (!this.$widget) return false;
        
        const $refreshAnthropicModels = this.$widget.find('.refresh-anthropic-models');
        
        // If we've already refreshed and we're not forcing a refresh, don't do it again
        if (anthropicModelsRefreshed && !showLoading) {
            return anthropicModelsRefreshed;
        }
        
        if (showLoading) {
            $refreshAnthropicModels.prop('disabled', true);
            $refreshAnthropicModels.html(`<i class="spinner-border spinner-border-sm"></i>`);
        }

        try {
            const anthropicBaseUrl = this.$widget.find('.anthropic-base-url').val() as string;
            const response = await server.post<AnthropicModelResponse>('anthropic/list-models', { baseUrl: anthropicBaseUrl });

            if (response && response.success) {
                // Update the chat models dropdown
                if (response.chatModels?.length > 0) {
                    const $chatModelSelect = this.$widget.find('.anthropic-default-model');
                    const currentChatValue = $chatModelSelect.val();

                    // Clear existing options
                    $chatModelSelect.empty();

                    // Sort models by name
                    const sortedChatModels = [...response.chatModels].sort((a, b) => a.name.localeCompare(b.name));

                    // Add models to the dropdown
                    sortedChatModels.forEach(model => {
                        $chatModelSelect.append(`<option value="${model.id}">${model.name}</option>`);
                    });

                    // Try to restore the previously selected value
                    if (currentChatValue) {
                        $chatModelSelect.val(currentChatValue);
                        // If the value doesn't exist anymore, select the first option
                        if (!$chatModelSelect.val()) {
                            $chatModelSelect.prop('selectedIndex', 0);
                        }
                    }
                }

                // Handle embedding models if they exist
                if (response.embeddingModels?.length > 0 && showLoading) {
                    toastService.showMessage(`Found ${response.embeddingModels.length} Anthropic embedding models.`);
                }

                if (showLoading) {
                    // Show success message
                    const totalModels = (response.chatModels?.length || 0) + (response.embeddingModels?.length || 0);
                    toastService.showMessage(`${totalModels} Anthropic models found.`);
                }
                
                return true;
            } else if (showLoading) {
                toastService.showError(`No Anthropic models found. Please check your API key and settings.`);
            }
            
            return anthropicModelsRefreshed;
        } catch (e) {
            console.error(`Error fetching Anthropic models:`, e);
            if (showLoading) {
                toastService.showError(`Error fetching Anthropic models: ${e}`);
            }
            return anthropicModelsRefreshed;
        } finally {
            if (showLoading) {
                $refreshAnthropicModels.prop('disabled', false);
                $refreshAnthropicModels.html(`<span class="bx bx-refresh"></span>`);
            }
        }
    }
    
    /**
     * Refreshes the list of Ollama models
     * @param showLoading Whether to show loading indicators and toasts
     * @param ollamaModelsRefreshed Reference to track if models have been refreshed
     * @returns Promise that resolves when the refresh is complete
     */
    async refreshOllamaModels(showLoading: boolean, ollamaModelsRefreshed: boolean): Promise<boolean> {
        if (!this.$widget) return false;
        
        const $refreshModels = this.$widget.find('.refresh-models');
        
        // If we've already refreshed and we're not forcing a refresh, don't do it again
        if (ollamaModelsRefreshed && !showLoading) {
            return ollamaModelsRefreshed;
        }
        
        if (showLoading) {
            $refreshModels.prop('disabled', true);
            $refreshModels.text(t("ai_llm.refreshing_models"));
        }

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

                if (embeddingModels.length > 0) {
                    // Add separator if we have embedding models
                    $embedModelSelect.append(`<option disabled>─────────────</option>`);
                }

                // Then add general models which can be used for embeddings too
                const generalModels = response.models.filter(model =>
                    !model.name.includes('embed') && !model.name.includes('bert'));

                generalModels.forEach(model => {
                    $embedModelSelect.append(`<option value="${model.name}">${model.name}</option>`);
                });

                // Try to restore the previously selected value
                if (currentValue) {
                    $embedModelSelect.val(currentValue);
                    // If the value doesn't exist anymore, select the first option
                    if (!$embedModelSelect.val()) {
                        $embedModelSelect.prop('selectedIndex', 0);
                    }
                }

                // Also update the LLM model dropdown
                const $modelSelect = this.$widget.find('.ollama-default-model');
                const currentModelValue = $modelSelect.val();

                // Clear existing options
                $modelSelect.empty();

                // Sort models by name to make them easier to find
                const sortedModels = [...response.models].sort((a, b) => a.name.localeCompare(b.name));

                // Add all models to the dropdown
                sortedModels.forEach(model => {
                    $modelSelect.append(`<option value="${model.name}">${model.name}</option>`);
                });

                // Try to restore the previously selected value
                if (currentModelValue) {
                    $modelSelect.val(currentModelValue);
                    // If the value doesn't exist anymore, select the first option
                    if (!$modelSelect.val()) {
                        $modelSelect.prop('selectedIndex', 0);
                    }
                }

                if (showLoading) {
                    toastService.showMessage(`${response.models.length} Ollama models found.`);
                }
                
                return true;
            } else if (showLoading) {
                toastService.showError(`No Ollama models found. Please check if Ollama is running.`);
            }
            
            return ollamaModelsRefreshed;
        } catch (e) {
            console.error(`Error fetching Ollama models:`, e);
            if (showLoading) {
                toastService.showError(`Error fetching Ollama models: ${e}`);
            }
            return ollamaModelsRefreshed;
        } finally {
            if (showLoading) {
                $refreshModels.prop('disabled', false);
                $refreshModels.html(`<span class="bx bx-refresh"></span>`);
            }
        }
    }
}