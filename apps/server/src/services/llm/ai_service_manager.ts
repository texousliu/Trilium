import options from '../options.js';
import eventService from '../events.js';
import type { AIService, ChatCompletionOptions, ChatResponse, Message } from './ai_interface.js';
import { AnthropicService } from './providers/anthropic_service.js';
import { ContextExtractor } from './context/index.js';
import agentTools from './context_extractors/index.js';
import contextService from './context/services/context_service.js';
import { getEmbeddingProvider, getEnabledEmbeddingProviders } from './providers/providers.js';
import indexService from './index_service.js';
import log from '../log.js';
import { OllamaService } from './providers/ollama_service.js';
import { OpenAIService } from './providers/openai_service.js';

// Import interfaces
import type {
  ServiceProviders,
  IAIServiceManager,
  ProviderMetadata
} from './interfaces/ai_service_interfaces.js';
import type { NoteSearchResult } from './interfaces/context_interfaces.js';

// Import new configuration system
import {
    getSelectedProvider,
    getSelectedEmbeddingProvider,
    parseModelIdentifier,
    isAIEnabled,
    getDefaultModelForProvider,
    clearConfigurationCache,
    validateConfiguration
} from './config/configuration_helpers.js';
import type { ProviderType } from './interfaces/configuration_interfaces.js';

/**
 * Interface representing relevant note context
 */
interface NoteContext {
    title: string;
    content?: string;
    noteId?: string;
    summary?: string;
    score?: number;
}

export class AIServiceManager implements IAIServiceManager {
    private services: Record<ServiceProviders, AIService> = {
        openai: new OpenAIService(),
        anthropic: new AnthropicService(),
        ollama: new OllamaService()
    };

    private providerOrder: ServiceProviders[] = []; // Will be populated from configuration
    private initialized = false;

    constructor() {
        // Initialize provider order immediately
        this.updateProviderOrder();

        // Initialize tools immediately
        this.initializeTools().catch(error => {
            log.error(`Error initializing LLM tools during AIServiceManager construction: ${error.message || String(error)}`);
        });

        // Set up event listener for provider changes
        this.setupProviderChangeListener();
    }

    /**
     * Initialize all LLM tools in one place
     */
    private async initializeTools(): Promise<void> {
        try {
            log.info('Initializing LLM tools during AIServiceManager construction...');

            // Initialize agent tools
            await this.initializeAgentTools();
            log.info("Agent tools initialized successfully");

            // Initialize LLM tools
            const toolInitializer = await import('./tools/tool_initializer.js');
            await toolInitializer.default.initializeTools();
            log.info("LLM tools initialized successfully");
        } catch (error: unknown) {
            log.error(`Error initializing tools: ${this.handleError(error)}`);
            // Don't throw, just log the error to prevent breaking construction
        }
    }

    /**
     * Update the provider order using the new configuration system (single provider)
     */
    async updateProviderOrderAsync(): Promise<void> {
        try {
            const selectedProvider = await getSelectedProvider();
            if (selectedProvider) {
                this.providerOrder = [selectedProvider as ServiceProviders];
                log.info(`Updated provider order: ${selectedProvider}`);
            } else {
                this.providerOrder = [];
                log.info('No provider selected');
            }
            this.initialized = true;
        } catch (error) {
            log.error(`Failed to get selected provider: ${error}`);
            // Keep empty order, will be handled gracefully by other methods
            this.providerOrder = [];
            this.initialized = true;
        }
    }

    /**
     * Update the provider precedence order (legacy sync version)
     * Returns true if successful, false if options not available yet
     */
    updateProviderOrder(): boolean {
        if (this.initialized) {
            return true;
        }

        // Use async version but don't wait
        this.updateProviderOrderAsync().catch(error => {
            log.error(`Error in async provider order update: ${error}`);
        });

        return true;
    }

    /**
     * Validate AI configuration using the new configuration system
     */
    async validateConfiguration(): Promise<string | null> {
        try {
            const result = await validateConfiguration();

            if (!result.isValid) {
                let message = 'There are issues with your AI configuration:';
                for (const error of result.errors) {
                    message += `\n• ${error}`;
                }
                if (result.warnings.length > 0) {
                    message += '\n\nWarnings:';
                    for (const warning of result.warnings) {
                        message += `\n• ${warning}`;
                    }
                }
                message += '\n\nPlease check your AI settings.';
                return message;
            }

            if (result.warnings.length > 0) {
                let message = 'AI configuration warnings:';
                for (const warning of result.warnings) {
                    message += `\n• ${warning}`;
                }
                log.info(message);
            }

            return null;
        } catch (error) {
            log.error(`Error validating AI configuration: ${error}`);
            return `Configuration validation failed: ${error}`;
        }
    }

    /**
     * Ensure manager is initialized before using
     */
    private ensureInitialized() {
        if (!this.initialized) {
            this.updateProviderOrder();
        }
    }

    /**
     * Check if any AI service is available
     */
    isAnyServiceAvailable(): boolean {
        return Object.values(this.services).some(service => service.isAvailable());
    }

    /**
     * Get list of available providers
     */
    getAvailableProviders(): ServiceProviders[] {
        this.ensureInitialized();
        return Object.entries(this.services)
            .filter(([_, service]) => service.isAvailable())
            .map(([key, _]) => key as ServiceProviders);
    }

    /**
     * Generate a chat completion response using the first available AI service
     * based on the configured precedence order
     */
    async generateChatCompletion(messages: Message[], options: ChatCompletionOptions = {}): Promise<ChatResponse> {
        this.ensureInitialized();

        log.info(`[AIServiceManager] generateChatCompletion called with options: ${JSON.stringify({
            model: options.model,
            stream: options.stream,
            enableTools: options.enableTools
        })}`);
        log.info(`[AIServiceManager] Stream option type: ${typeof options.stream}`);

        if (!messages || messages.length === 0) {
            throw new Error('No messages provided for chat completion');
        }

        // Try providers in order of preference
        const availableProviders = this.getAvailableProviders();

        if (availableProviders.length === 0) {
            throw new Error('No AI providers are available. Please check your AI settings.');
        }

        // Sort available providers by precedence
        const sortedProviders = this.providerOrder
            .filter(provider => availableProviders.includes(provider));

        // If a specific provider is requested and available, use it
        if (options.model && options.model.includes(':')) {
            // Use the new configuration system to parse model identifier
            const modelIdentifier = parseModelIdentifier(options.model);

            if (modelIdentifier.provider && availableProviders.includes(modelIdentifier.provider as ServiceProviders)) {
                try {
                    const modifiedOptions = { ...options, model: modelIdentifier.modelId };
                    log.info(`[AIServiceManager] Using provider ${modelIdentifier.provider} from model prefix with modifiedOptions.stream: ${modifiedOptions.stream}`);
                    return await this.services[modelIdentifier.provider as ServiceProviders].generateChatCompletion(messages, modifiedOptions);
                } catch (error) {
                    log.error(`Error with specified provider ${modelIdentifier.provider}: ${error}`);
                    // If the specified provider fails, continue with the fallback providers
                }
            }
            // If not a provider prefix, treat the entire string as a model name and continue with normal provider selection
        }

        // Try each provider in order until one succeeds
        let lastError: Error | null = null;

        for (const provider of sortedProviders) {
            try {
                log.info(`[AIServiceManager] Trying provider ${provider} with options.stream: ${options.stream}`);
                return await this.services[provider].generateChatCompletion(messages, options);
            } catch (error) {
                log.error(`Error with provider ${provider}: ${error}`);
                lastError = error as Error;
                // Continue to the next provider
            }
        }

        // If we get here, all providers failed
        throw new Error(`All AI providers failed: ${lastError?.message || 'Unknown error'}`);
    }

    setupEventListeners() {
        // Setup event listeners for AI services
    }

    /**
     * Get the context extractor service
     * @returns The context extractor instance
     */
    getContextExtractor() {
        return contextExtractor;
    }

    /**
     * Get the context service for advanced context management
     * @returns The context service instance
     */
    getContextService() {
        return contextService;
    }

    /**
     * Get the index service for managing knowledge base indexing
     * @returns The index service instance
     */
    getIndexService() {
        return indexService;
    }

    /**
     * Ensure agent tools are initialized (no-op as they're initialized in constructor)
     * Kept for backward compatibility with existing API
     */
    async initializeAgentTools(): Promise<void> {
        // Agent tools are already initialized in the constructor
        // This method is kept for backward compatibility
        log.info("initializeAgentTools called, but tools are already initialized in constructor");
    }

    /**
     * Get the agent tools manager
     * This provides access to all agent tools
     */
    getAgentTools() {
        return agentTools;
    }

    /**
     * Get the vector search tool for semantic similarity search
     */
    getVectorSearchTool() {
        const tools = agentTools.getTools();
        return tools.vectorSearch;
    }

    /**
     * Get the note navigator tool for hierarchical exploration
     */
    getNoteNavigatorTool() {
        const tools = agentTools.getTools();
        return tools.noteNavigator;
    }

    /**
     * Get the query decomposition tool for complex queries
     */
    getQueryDecompositionTool() {
        const tools = agentTools.getTools();
        return tools.queryDecomposition;
    }

    /**
     * Get the contextual thinking tool for transparent reasoning
     */
    getContextualThinkingTool() {
        const tools = agentTools.getTools();
        return tools.contextualThinking;
    }

    /**
     * Get whether AI features are enabled using the new configuration system
     */
    async getAIEnabledAsync(): Promise<boolean> {
        return isAIEnabled();
    }

    /**
     * Get whether AI features are enabled (sync version for compatibility)
     */
    getAIEnabled(): boolean {
        // For synchronous compatibility, use the old method
        // In a full refactor, this should be async
        return options.getOptionBool('aiEnabled');
    }

    /**
     * Set up embeddings provider using the new configuration system
     */
    async setupEmbeddingsProvider(): Promise<void> {
        try {
            const aiEnabled = await isAIEnabled();
            if (!aiEnabled) {
                log.info('AI features are disabled');
                return;
            }

            // Use the new configuration system - no string parsing!
            const enabledProviders = await getEnabledEmbeddingProviders();

            if (enabledProviders.length === 0) {
                log.info('No embedding providers are enabled');
                return;
            }

            // Initialize embedding providers
            log.info('Embedding providers initialized successfully');
        } catch (error: any) {
            log.error(`Error setting up embedding providers: ${error.message}`);
            throw error;
        }
    }

    /**
     * Initialize the AI Service using the new configuration system
     */
    async initialize(): Promise<void> {
        try {
            log.info("Initializing AI service...");

            // Check if AI is enabled using the new helper
            const aiEnabled = await isAIEnabled();

            if (!aiEnabled) {
                log.info("AI features are disabled in options");
                return;
            }

            // Update provider order from configuration
            await this.updateProviderOrderAsync();

            // Set up embeddings provider if AI is enabled
            await this.setupEmbeddingsProvider();

            // Initialize index service
            await this.getIndexService().initialize();

            // Tools are already initialized in the constructor
            // No need to initialize them again

            this.initialized = true;
            log.info("AI service initialized successfully");
        } catch (error: any) {
            log.error(`Error initializing AI service: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get description of available agent tools
     */
    async getAgentToolsDescription(): Promise<string> {
        try {
            // Get all available tools
            const tools = agentTools.getAllTools();

            if (!tools || tools.length === 0) {
                return "";
            }

            // Format tool descriptions
            const toolDescriptions = tools.map(tool =>
                `- ${tool.name}: ${tool.description}`
            ).join('\n');

            return `Available tools:\n${toolDescriptions}`;
        } catch (error) {
            log.error(`Error getting agent tools description: ${error}`);
            return "";
        }
    }

    /**
     * Get enhanced context with available agent tools
     * @param noteId - The ID of the note
     * @param query - The user's query
     * @param showThinking - Whether to show LLM's thinking process
     * @param relevantNotes - Optional notes already found to be relevant
     * @returns Enhanced context with agent tools information
     */
    async getAgentToolsContext(
        noteId: string,
        query: string,
        showThinking: boolean = false,
        relevantNotes: NoteSearchResult[] = []
    ): Promise<string> {
        try {
            // Create agent tools message
            const toolsMessage = await this.getAgentToolsDescription();

            // Agent tools are already initialized in the constructor
            // No need to initialize them again

            // If we have notes that were already found to be relevant, use them directly
            let contextNotes = relevantNotes;

            // If no notes provided, find relevant ones
            if (!contextNotes || contextNotes.length === 0) {
                try {
                    // Get the default LLM service for context enhancement
                    const provider = this.getPreferredProvider();
                    const llmService = this.getService(provider);

                    // Find relevant notes
                    contextNotes = await contextService.findRelevantNotes(
                        query,
                        noteId,
                        {
                            maxResults: 5,
                            summarize: true,
                            llmService
                        }
                    );

                    log.info(`Found ${contextNotes.length} relevant notes for context`);
                } catch (error) {
                    log.error(`Failed to find relevant notes: ${this.handleError(error)}`);
                    // Continue without context notes
                    contextNotes = [];
                }
            }

            // Format notes into context string if we have any
            let contextStr = "";
            if (contextNotes && contextNotes.length > 0) {
                contextStr = "\n\nRelevant context:\n";
                contextNotes.forEach((note, index) => {
                    contextStr += `[${index + 1}] "${note.title}"\n${note.content || 'No content available'}\n\n`;
                });
            }

            // Combine tool message with context
            return toolsMessage + contextStr;
        } catch (error) {
            log.error(`Error getting agent tools context: ${this.handleError(error)}`);
            return "";
        }
    }

    /**
     * Get AI service for the given provider
     */
    getService(provider?: string): AIService {
        this.ensureInitialized();

        // If provider is specified, try to use it
        if (provider && this.services[provider as ServiceProviders]?.isAvailable()) {
            return this.services[provider as ServiceProviders];
        }

        // Otherwise, use the first available provider in the configured order
        for (const providerName of this.providerOrder) {
            const service = this.services[providerName];
            if (service.isAvailable()) {
                return service;
            }
        }

        // If no provider is available, use first one anyway (it will throw an error)
        // This allows us to show a proper error message rather than "provider not found"
        return this.services[this.providerOrder[0]];
    }

    /**
     * Get the preferred provider based on configuration using the new system
     */
    async getPreferredProviderAsync(): Promise<string> {
        try {
            const selectedProvider = await getSelectedProvider();
            if (selectedProvider === null) {
                // No provider selected, fallback to first available
                log.info('No provider selected, using first available provider');
                return this.providerOrder[0];
            }
            return selectedProvider;
        } catch (error) {
            log.error(`Error getting preferred provider: ${error}`);
            return this.providerOrder[0];
        }
    }

    /**
     * Get the preferred provider based on configuration (sync version for compatibility)
     */
    getPreferredProvider(): string {
        this.ensureInitialized();

        // Return the first available provider in the order
        for (const providerName of this.providerOrder) {
            if (this.services[providerName].isAvailable()) {
                return providerName;
            }
        }

        // Return the first provider as fallback
        return this.providerOrder[0];
    }

    /**
     * Check if a specific provider is available
     */
    isProviderAvailable(provider: string): boolean {
        return this.services[provider as ServiceProviders]?.isAvailable() ?? false;
    }

    /**
     * Get metadata about a provider
     */
    getProviderMetadata(provider: string): ProviderMetadata | null {
        const service = this.services[provider as ServiceProviders];
        if (!service) {
            return null;
        }

        return {
            name: provider,
            capabilities: {
                chat: true,
                embeddings: provider !== 'anthropic', // Anthropic doesn't have embeddings
                streaming: true,
                functionCalling: provider === 'openai' // Only OpenAI has function calling
            },
            models: ['default'], // Placeholder, could be populated from the service
            defaultModel: 'default'
        };
    }


    /**
     * Error handler that properly types the error object
     */
    private handleError(error: unknown): string {
        if (error instanceof Error) {
            return error.message || String(error);
        }
        return String(error);
    }

    /**
     * Set up event listener for provider changes
     */
    private setupProviderChangeListener(): void {
        // List of AI-related options that should trigger service recreation
        const aiRelatedOptions = [
            'aiSelectedProvider',
            'embeddingSelectedProvider',
            'openaiApiKey',
            'openaiBaseUrl', 
            'openaiDefaultModel',
            'anthropicApiKey',
            'anthropicBaseUrl',
            'anthropicDefaultModel',
            'ollamaBaseUrl',
            'ollamaDefaultModel',
            'voyageApiKey'
        ];

        eventService.subscribe(['entityChanged'], ({ entityName, entity }) => {
            if (entityName === 'options' && entity && aiRelatedOptions.includes(entity.name)) {
                log.info(`AI-related option '${entity.name}' changed, recreating LLM services`);
                this.recreateServices();
            }
        });
    }

    /**
     * Recreate LLM services when provider settings change
     */
    private async recreateServices(): Promise<void> {
        try {
            log.info('Recreating LLM services due to configuration change');

            // Clear configuration cache first
            clearConfigurationCache();

            // Recreate all service instances to pick up new configuration
            this.recreateServiceInstances();

            // Update provider order with new configuration
            await this.updateProviderOrderAsync();

            log.info('LLM services recreated successfully');
        } catch (error) {
            log.error(`Error recreating LLM services: ${this.handleError(error)}`);
        }
    }

    /**
     * Recreate service instances to pick up new configuration
     */
    private recreateServiceInstances(): void {
        try {
            log.info('Recreating service instances');

            // Recreate service instances
            this.services = {
                openai: new OpenAIService(),
                anthropic: new AnthropicService(),
                ollama: new OllamaService()
            };

            log.info('Service instances recreated successfully');
        } catch (error) {
            log.error(`Error recreating service instances: ${this.handleError(error)}`);
        }
    }
}

// Don't create singleton immediately, use a lazy-loading pattern
let instance: AIServiceManager | null = null;

/**
 * Get the AIServiceManager instance (creates it if not already created)
 */
function getInstance(): AIServiceManager {
    if (!instance) {
        instance = new AIServiceManager();
    }
    return instance;
}

export default {
    getInstance,
    // Also export methods directly for convenience
    isAnyServiceAvailable(): boolean {
        return getInstance().isAnyServiceAvailable();
    },
    getAvailableProviders() {
        return getInstance().getAvailableProviders();
    },
    async generateChatCompletion(messages: Message[], options: ChatCompletionOptions = {}): Promise<ChatResponse> {
        return getInstance().generateChatCompletion(messages, options);
    },
    // Add validateEmbeddingProviders method
    async validateEmbeddingProviders(): Promise<string | null> {
        return getInstance().validateConfiguration();
    },
    // Context and index related methods
    getContextExtractor() {
        return getInstance().getContextExtractor();
    },
    getContextService() {
        return getInstance().getContextService();
    },
    getIndexService() {
        return getInstance().getIndexService();
    },
    // Agent tools related methods
    // Tools are now initialized in the constructor
    getAgentTools() {
        return getInstance().getAgentTools();
    },
    getVectorSearchTool() {
        return getInstance().getVectorSearchTool();
    },
    getNoteNavigatorTool() {
        return getInstance().getNoteNavigatorTool();
    },
    getQueryDecompositionTool() {
        return getInstance().getQueryDecompositionTool();
    },
    getContextualThinkingTool() {
        return getInstance().getContextualThinkingTool();
    },
    async getAgentToolsContext(
        noteId: string,
        query: string,
        showThinking: boolean = false,
        relevantNotes: NoteSearchResult[] = []
    ): Promise<string> {
        return getInstance().getAgentToolsContext(
            noteId,
            query,
            showThinking,
            relevantNotes
        );
    },
    // New methods
    getService(provider?: string): AIService {
        return getInstance().getService(provider);
    },
    getPreferredProvider(): string {
        return getInstance().getPreferredProvider();
    },
    isProviderAvailable(provider: string): boolean {
        return getInstance().isProviderAvailable(provider);
    },
    getProviderMetadata(provider: string): ProviderMetadata | null {
        return getInstance().getProviderMetadata(provider);
    }
};

// Create an instance of ContextExtractor for backward compatibility
const contextExtractor = new ContextExtractor();
