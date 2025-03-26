export const PROVIDER_CONSTANTS = {
    ANTHROPIC: {
        API_VERSION: '2023-06-01',
        BETA_VERSION: 'messages-2023-12-15',
        BASE_URL: 'https://api.anthropic.com',
        DEFAULT_MODEL: 'claude-3-haiku-20240307',
        // These are the currently available models from Anthropic
        AVAILABLE_MODELS: [
            {
                id: 'claude-3-opus-20240229',
                name: 'Claude 3 Opus',
                description: 'Most capable model for highly complex tasks',
                maxTokens: 4096
            },
            {
                id: 'claude-3-sonnet-20240229',
                name: 'Claude 3 Sonnet',
                description: 'Ideal balance of intelligence and speed',
                maxTokens: 4096
            },
            {
                id: 'claude-3-haiku-20240307',
                name: 'Claude 3 Haiku',
                description: 'Fastest and most compact model',
                maxTokens: 4096
            },
            {
                id: 'claude-2.1',
                name: 'Claude 2.1',
                description: 'Previous generation model',
                maxTokens: 4096
            }
        ]
    },

    OPENAI: {
        BASE_URL: 'https://api.openai.com/v1',
        DEFAULT_MODEL: 'gpt-3.5-turbo',
        DEFAULT_EMBEDDING_MODEL: 'text-embedding-ada-002',
        CONTEXT_WINDOW: 16000,
        EMBEDDING_DIMENSIONS: {
            ADA: 1536,
            DEFAULT: 1536
        },
        AVAILABLE_MODELS: [
            {
                id: 'gpt-4o',
                name: 'GPT-4o',
                description: 'Most capable multimodal model',
                maxTokens: 8192
            },
            {
                id: 'gpt-4-turbo',
                name: 'GPT-4 Turbo',
                description: 'Advanced capabilities with higher token limit',
                maxTokens: 8192
            },
            {
                id: 'gpt-4',
                name: 'GPT-4',
                description: 'Original GPT-4 model',
                maxTokens: 8192
            },
            {
                id: 'gpt-3.5-turbo',
                name: 'GPT-3.5 Turbo',
                description: 'Fast and efficient model for most tasks',
                maxTokens: 4096
            }
        ]
    },

    OLLAMA: {
        BASE_URL: 'http://localhost:11434',
        DEFAULT_MODEL: 'llama2',
        BATCH_SIZE: 100,
        CHUNKING: {
            SIZE: 4000,
            OVERLAP: 200
        },
        MODEL_DIMENSIONS: {
            default: 4096,
            llama2: 4096,
            mixtral: 4096,
            'mistral': 4096
        },
        MODEL_CONTEXT_WINDOWS: {
            default: 8192,
            llama2: 4096,
            mixtral: 8192,
            'mistral': 8192
        }
    }
} as const;
