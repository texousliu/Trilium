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
    }
} as const;
