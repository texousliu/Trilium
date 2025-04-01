import log from '../../../log.js';
import cacheManager from './cache_manager.js';
import type { Message } from '../../ai_interface.js';
import { CONTEXT_PROMPTS } from '../../constants/llm_prompt_constants.js';
import type { LLMServiceInterface } from '../../interfaces/agent_tool_interfaces.js';
import type { IQueryEnhancer } from '../../interfaces/context_interfaces.js';
import JsonExtractor from '../../utils/json_extractor.js';

/**
 * Provides utilities for enhancing queries and generating search queries
 */
export class QueryEnhancer implements IQueryEnhancer {
    // Use the centralized query enhancer prompt
    private metaPrompt = CONTEXT_PROMPTS.QUERY_ENHANCER;

    /**
     * Get enhanced prompt with JSON formatting instructions
     */
    private getEnhancedPrompt(): string {
        return `${this.metaPrompt}
IMPORTANT: You must respond with valid JSON arrays. Always include commas between array elements.
Format your answer as a valid JSON array without markdown code blocks, like this: ["item1", "item2", "item3"]`;
    }

    /**
     * Generate search queries to find relevant information for the user question
     *
     * @param userQuestion - The user's question
     * @param llmService - The LLM service to use for generating queries
     * @returns Array of search queries
     */
    async generateSearchQueries(userQuestion: string, llmService: LLMServiceInterface): Promise<string[]> {
        if (!userQuestion || userQuestion.trim() === '') {
            return []; // Return empty array for empty input
        }

        try {
            // Check cache with proper type checking
            const cached = cacheManager.getQueryResults<string[]>(`searchQueries:${userQuestion}`);
            if (cached && Array.isArray(cached)) {
                return cached;
            }

            const messages: Message[] = [
                { role: "system", content: this.getEnhancedPrompt() },
                { role: "user", content: userQuestion }
            ];

            const options = {
                temperature: 0.3,
                maxTokens: 300,
                bypassFormatter: true, // Completely bypass formatter for query enhancement
                expectsJsonResponse: true // Explicitly request JSON-formatted response
            };

            // Get the response from the LLM
            const response = await llmService.generateChatCompletion(messages, options);
            const responseText = response.text; // Extract the text from the response object

            // Use the JsonExtractor to parse the response
            const queries = JsonExtractor.extract<string[]>(responseText, {
                extractArrays: true,
                minStringLength: 3,
                applyFixes: true,
                useFallbacks: true
            });

            if (queries && queries.length > 0) {
                log.info(`Extracted ${queries.length} queries using JsonExtractor`);
                cacheManager.storeQueryResults(`searchQueries:${userQuestion}`, queries);
                return queries;
            }

            // If all else fails, just use the original question
            const fallback = [userQuestion];
            log.info(`No queries extracted, using fallback: "${userQuestion}"`);
            cacheManager.storeQueryResults(`searchQueries:${userQuestion}`, fallback);
            return fallback;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error(`Error generating search queries: ${errorMessage}`);
            return [userQuestion];
        }
    }

    /**
     * Estimate the complexity of a query
     * This is used to determine the appropriate amount of context to provide
     *
     * @param query - The query to analyze
     * @returns A complexity score from 0 (simple) to 1 (complex)
     */
    estimateQueryComplexity(query: string): number {
        // Simple complexity estimation based on various factors

        // Factor 1: Query length
        const lengthScore = Math.min(query.length / 100, 0.4);

        // Factor 2: Number of question words
        const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which'];
        const questionWordsCount = questionWords.filter(word =>
            query.toLowerCase().includes(` ${word} `) ||
            query.toLowerCase().startsWith(`${word} `)
        ).length;
        const questionWordsScore = Math.min(questionWordsCount * 0.15, 0.3);

        // Factor 3: Contains comparison indicators
        const comparisonWords = ['compare', 'difference', 'versus', 'vs', 'similarities', 'differences'];
        const hasComparison = comparisonWords.some(word => query.toLowerCase().includes(word));
        const comparisonScore = hasComparison ? 0.2 : 0;

        // Factor 4: Request for detailed or in-depth information
        const depthWords = ['explain', 'detail', 'elaborate', 'analysis', 'in-depth'];
        const hasDepthRequest = depthWords.some(word => query.toLowerCase().includes(word));
        const depthScore = hasDepthRequest ? 0.2 : 0;

        // Combine scores with a maximum of 1.0
        return Math.min(lengthScore + questionWordsScore + comparisonScore + depthScore, 1.0);
    }
}

// Export singleton instance
export default new QueryEnhancer();
