/**
 * Constants related to LLM prompts and messaging
 */

/**
 * System prompts for different use cases
 */
export const SYSTEM_PROMPTS = {
    DEFAULT_SYSTEM_PROMPT: 
        "You are an intelligent AI assistant for Trilium Notes, a hierarchical note-taking application. " +
        "Help the user with their notes, knowledge management, and questions. " +
        "When referencing their notes, be clear about which note you're referring to. " +
        "Be concise but thorough in your responses.",
    
    AGENT_TOOLS_PROMPT:
        "You are an intelligent AI assistant for Trilium Notes with access to special tools. " +
        "You can use these tools to search through the user's notes and find relevant information. " +
        "Always be helpful, accurate, and respect the user's privacy and security.",
    
    CONTEXT_AWARE_PROMPT:
        "You are an intelligent AI assistant for Trilium Notes. " +
        "You have access to the context from the user's notes. " +
        "Use this context to provide accurate and helpful responses. " +
        "Be specific when referencing information from their notes."
};

/**
 * Prompts related to context handling
 */
export const CONTEXT_PROMPTS = {
    NOTE_CONTEXT_PROMPT:
        "Here is context from my current note to help you understand what I'm working on: {context}",
    
    SEMANTIC_NOTE_CONTEXT_PROMPT:
        "I'm asking about: {query}\n\nHere's relevant information from my notes: {context}",
    
    AGENT_TOOLS_CONTEXT_PROMPT:
        "You have access to the following tools to help answer the user's question: {tools}",
    
    INDEX_NO_NOTES_CONTEXT:
        "I couldn't find any directly relevant information in your notes about this query. " +
        "I'll try to help based on my general knowledge, but please note that I may not have all the specific details you need."
};

/**
 * Error prompts for different scenarios
 */
export const ERROR_PROMPTS = {
    USER_ERRORS: {
        GENERAL_ERROR: 
            "I'm sorry, but I encountered an error while processing your request. " +
            "Please try again or rephrase your question.",
        
        CONTEXT_ERROR:
            "I'm sorry, but I encountered an error while retrieving context from your notes. " +
            "I'll try to help based on what I know, but I might be missing important context.",
        
        PROVIDER_ERROR:
            "I'm sorry, but there seems to be an issue with the AI service provider. " +
            "Please check your connection and API settings, or try again later."
    },
    
    SYSTEM_ERRORS: {
        NO_PROVIDER_AVAILABLE:
            "No AI provider is available. Please check your AI settings and ensure at least one provider is configured properly.",
        
        UNAUTHORIZED:
            "The AI provider returned an authorization error. Please check your API key settings."
    }
};