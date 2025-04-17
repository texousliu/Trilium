/**
 * Unified Query Processor Service
 *
 * Consolidates functionality from:
 * - query_enhancer.ts
 * - query_decomposition_tool.ts
 *
 * This service provides a central interface for all query processing operations,
 * including enhancement, decomposition, and complexity analysis.
 */

import log from '../../../log.js';
import cacheManager from '../modules/cache_manager.js';
import { CONTEXT_PROMPTS } from '../../constants/llm_prompt_constants.js';
import { QUERY_DECOMPOSITION_STRINGS } from '../../constants/query_decomposition_constants.js';
import JsonExtractor from '../../utils/json_extractor.js';
import type { LLMServiceInterface } from '../../interfaces/agent_tool_interfaces.js';
import { SEARCH_CONSTANTS } from '../../constants/search_constants.js';
import aiServiceManager from '../../ai_service_manager.js';

// Interfaces
export interface SubQuery {
    id: string;
    text: string;
    reason: string;
    isAnswered: boolean;
    answer?: string;
}

export interface DecomposedQuery {
    originalQuery: string;
    subQueries: SubQuery[];
    status: 'pending' | 'in_progress' | 'completed';
    complexity: number;
}

export class QueryProcessor {
    private static queryCounter: number = 0;

    // Prompt templates
    private enhancerPrompt = CONTEXT_PROMPTS.QUERY_ENHANCER;

    /**
     * Get a valid LLM service or null if none available
     *
     * @returns Available LLM service or null
     */
    private async getLLMService(): Promise<LLMServiceInterface | null> {
        try {
            // Get the service from the AI service manager
            return aiServiceManager.getService();
        } catch (error: any) {
            log.error(`Error getting LLM service: ${error.message || String(error)}`);
            return null;
        }
    }
    /**
     * Generate search queries to find relevant information for the user question
     *
     * @param userQuestion - The user's question
     * @param llmService - The LLM service to use for generating queries
     * @returns Array of search queries
     */
    async generateSearchQueries(userQuestion: string, llmService: any): Promise<string[]> {
        try {
            // Check cache first
            const cached = cacheManager.getQueryResults(`searchQueries:${userQuestion}`);

            const PROMPT = `You are an AI assistant that decides what information needs to be retrieved from a user's knowledge base called TriliumNext Notes to answer the user's question.
Given the user's question, generate 3-5 specific search queries that would help find relevant information.
Each query should be focused on a different aspect of the question.
Avoid generating queries that are too broad, vague, or about a user's entire Note database, and make sure they are relevant to the user's question.
Format your answer as a JSON array of strings, with each string being a search query.
Example: ["exact topic mentioned", "related concept 1", "related concept 2"]`

            interface Message {
                role: 'user' | 'assistant' | 'system';
                content: string;
            }

            const messages: Message[] = [
                { role: "system", content: PROMPT },
                { role: "user", content: userQuestion }
            ];

            const options = {
                temperature: 0.3,
                maxTokens: 300
            };

            // Get the response from the LLM
            const response = await llmService.generateChatCompletion(messages, options);
            const responseText = response.text; // Extract the text from the response object

            try {
                // Remove code blocks, quotes, and clean up the response text
                let jsonStr = responseText
                    .replace(/```(?:json)?|```/g, '') // Remove code block markers
                    .replace(/[\u201C\u201D]/g, '"')  // Replace smart quotes with straight quotes
                    .trim();

                // Check if the text might contain a JSON array (has square brackets)
                if (jsonStr.includes('[') && jsonStr.includes(']')) {
                    // Extract just the array part if there's explanatory text
                    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
                    if (arrayMatch) {
                        jsonStr = arrayMatch[0];
                    }

                    // Try to parse the JSON
                    try {
                        const queries = JSON.parse(jsonStr);
                        if (Array.isArray(queries) && queries.length > 0) {
                            const result = queries.map(q => typeof q === 'string' ? q : String(q)).filter(Boolean);
                            cacheManager.storeQueryResults(`searchQueries:${userQuestion}`, result);
                            return result;
                        }
                    } catch (innerError) {
                        // If parsing fails, log it and continue to the fallback
                        log.info(`JSON parse error: ${innerError}. Will use fallback parsing for: ${jsonStr}`);
                    }
                }

                // Fallback 1: Try to extract an array manually by splitting on commas between quotes
                if (jsonStr.includes('[') && jsonStr.includes(']')) {
                    const arrayContent = jsonStr.substring(
                        jsonStr.indexOf('[') + 1,
                        jsonStr.lastIndexOf(']')
                    );

                    // Use regex to match quoted strings, handling escaped quotes
                    const stringMatches = arrayContent.match(/"((?:\\.|[^"\\])*)"/g);
                    if (stringMatches && stringMatches.length > 0) {
                        const result = stringMatches
                            .map((m: string) => m.substring(1, m.length - 1)) // Remove surrounding quotes
                            .filter((s: string) => s.length > 0);
                        cacheManager.storeQueryResults(`searchQueries:${userQuestion}`, result);
                        return result;
                    }
                }

                // Fallback 2: Extract queries line by line
                const lines = responseText.split('\n')
                    .map((line: string) => line.trim())
                    .filter((line: string) =>
                        line.length > 0 &&
                        !line.startsWith('```') &&
                        !line.match(/^\d+\.?\s*$/) && // Skip numbered list markers alone
                        !line.match(/^\[|\]$/) // Skip lines that are just brackets
                    );

                if (lines.length > 0) {
                    // Remove numbering, quotes and other list markers from each line
                    const result = lines.map((line: string) => {
                        return line
                            .replace(/^\d+\.?\s*/, '') // Remove numbered list markers (1., 2., etc)
                            .replace(/^[-*•]\s*/, '')  // Remove bullet list markers
                            .replace(/^["']|["']$/g, '') // Remove surrounding quotes
                            .trim();
                    }).filter((s: string) => s.length > 0);

                    cacheManager.storeQueryResults(`searchQueries:${userQuestion}`, result);
                    return result;
                }
            } catch (parseError) {
                log.error(`Error parsing search queries: ${parseError}`);
            }

            // If all else fails, just use the original question
            const fallback = [userQuestion];
            cacheManager.storeQueryResults(`searchQueries:${userQuestion}`, fallback);
            return fallback;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error(`Error generating search queries: ${errorMessage}`);
            // Fallback to just using the original question
            return [userQuestion];
        }
    }

    /**
     * Break down a complex query into smaller, more manageable sub-queries
     *
     * @param query The original user query
     * @param context Optional context about the current note being viewed
     * @param llmService Optional LLM service to use for advanced decomposition
     * @returns A decomposed query object with sub-queries
     */
    async decomposeQuery(
        query: string,
        context?: string,
        llmService?: LLMServiceInterface
    ): Promise<DecomposedQuery> {
        try {
            // Log the decomposition attempt
            log.info(`Decomposing query: "${query}"`);

            if (!query || query.trim().length === 0) {
                log.info(`Query is empty, skipping decomposition`);
                return {
                    originalQuery: query,
                    subQueries: [],
                    status: 'pending',
                    complexity: 0
                };
            }

            // Simple assessment of query complexity
            const complexity = query.length > 100 ? 5 : 3;

            // Get LLM service if not provided
            const service = llmService || await this.getLLMService();

            // If no LLM service is available, use original query
            if (!service) {
                log.info(`No LLM service available for query decomposition, using original query`);
                return {
                    originalQuery: query,
                    subQueries: [{
                        id: this.generateSubQueryId(),
                        text: query,
                        reason: "Original query",
                        isAnswered: false
                    }],
                    status: 'pending',
                    complexity
                };
            }

            // Make a simple request to decompose the query
            const result = await this.simpleQueryDecomposition(query, service, context);

            // Return the result
            return {
                originalQuery: query,
                subQueries: result,
                status: 'pending',
                complexity
            };
        } catch (error: any) {
            log.error(`Error decomposing query: ${error.message}`);

            // Fallback to treating it as a simple query
            return {
                originalQuery: query,
                subQueries: [{
                    id: this.generateSubQueryId(),
                    text: query,
                    reason: "Error occurred during decomposition, using original query",
                    isAnswered: false
                }],
                status: 'pending',
                complexity: 1
            };
        }
    }

    /**
     * Simple LLM-based query decomposition
     *
     * @param query The original query to decompose
     * @param llmService LLM service to use
     * @param context Optional context to help with decomposition
     * @returns Array of sub-queries
     */
    private async simpleQueryDecomposition(
        query: string,
        llmService: LLMServiceInterface,
        context?: string
    ): Promise<SubQuery[]> {
        try {
            // Create a simple prompt for query decomposition
            const prompt = `Decompose the following query into 3-5 specific search queries that would be effective for vector search.

Your goal is to help find comprehensive information by breaking down the query into multiple search terms.

IMPORTANT: DO NOT just reword the original query. Create MULTIPLE DISTINCT queries that explore different aspects.

For example, if the query is "What are Docker containers?", good sub-queries would be:
1. "Docker container architecture and components"
2. "Docker vs virtual machines differences"
3. "Docker container use cases and benefits"
4. "Docker container deployment best practices"

Format your response as a JSON array of objects with 'text' and 'reason' properties.
Example: [
  {"text": "Docker container architecture", "reason": "Understanding the technical structure"},
  {"text": "Docker vs virtual machines", "reason": "Comparing with alternative technologies"},
  {"text": "Docker container benefits", "reason": "Understanding advantages and use cases"},
  {"text": "Docker deployment best practices", "reason": "Learning practical implementation"}
]

${context ? `\nContext: ${context}` : ''}

Query: ${query}`;

            log.info(`Sending decomposition prompt to LLM for query: "${query}"`);

            const messages = [
                { role: "system" as const, content: prompt }
            ];

            const options = {
                temperature: 0.7,
                maxTokens: SEARCH_CONSTANTS.LIMITS.QUERY_PROCESSOR_MAX_TOKENS,
                bypassFormatter: true,
                expectsJsonResponse: true,
                _bypassContextProcessing: true,
                enableTools: false
            };

            // Get the response from the LLM
            const response = await llmService.generateChatCompletion(messages, options);
            const responseText = response.text;

            log.info(`Received LLM response for decomposition: ${responseText.substring(0, 200)}...`);

            // Try to parse the response as JSON
            let subQueries: SubQuery[] = [];
            try {
                // Extract the JSON from the response
                const extractedJson = JsonExtractor.extract(responseText, {
                    extractArrays: true,
                    applyFixes: true,
                    useFallbacks: true
                });

                log.info(`Extracted JSON: ${JSON.stringify(extractedJson).substring(0, 200)}...`);

                if (Array.isArray(extractedJson) && extractedJson.length > 0) {
                    // Convert the extracted data to SubQuery objects
                    subQueries = extractedJson
                        .filter(item => item && typeof item === 'object' && item.text)
                        .map(item => ({
                            id: this.generateSubQueryId(),
                            text: item.text,
                            reason: item.reason || "Sub-aspect of the main question",
                            isAnswered: false
                        }));

                    log.info(`Successfully created ${subQueries.length} sub-queries from LLM response`);
                } else {
                    log.info(`Failed to extract array of sub-queries from LLM response`);
                }
            } catch (error) {
                log.error(`Error parsing LLM response: ${error}`);
            }

            // Always include the original query
            const hasOriginal = subQueries.some(sq => sq.text.toLowerCase() === query.toLowerCase());
            if (!hasOriginal) {
                subQueries.push({
                    id: this.generateSubQueryId(),
                    text: query,
                    reason: "Original query",
                    isAnswered: false
                });
                log.info(`Added original query to sub-queries list`);
            }

            // Ensure we have at least 3 queries for better search coverage
            if (subQueries.length < 3) {
                // Create some generic variants of the original query
                const genericVariants = [
                    { text: `${query} examples and use cases`, reason: "Practical applications" },
                    { text: `${query} concepts and definitions`, reason: "Conceptual understanding" },
                    { text: `${query} best practices`, reason: "Implementation guidance" }
                ];

                // Add variants until we have at least 3 queries
                for (let i = 0; i < genericVariants.length && subQueries.length < 3; i++) {
                    subQueries.push({
                        id: this.generateSubQueryId(),
                        text: genericVariants[i].text,
                        reason: genericVariants[i].reason,
                        isAnswered: false
                    });
                }

                log.info(`Added ${3 - subQueries.length} generic variants to ensure minimum 3 queries`);
            }

            log.info(`Final sub-queries for vector search: ${subQueries.map(sq => `"${sq.text}"`).join(', ')}`);
            return subQueries;
        } catch (error) {
            log.error(`Error in simpleQueryDecomposition: ${error}`);

            // Return the original query plus some variants as fallback
            const fallbackQueries = [
                {
                    id: this.generateSubQueryId(),
                    text: query,
                    reason: "Original query",
                    isAnswered: false
                },
                {
                    id: this.generateSubQueryId(),
                    text: `${query} overview`,
                    reason: "General information",
                    isAnswered: false
                },
                {
                    id: this.generateSubQueryId(),
                    text: `${query} examples`,
                    reason: "Practical examples",
                    isAnswered: false
                }
            ];

            log.info(`Using fallback queries due to error: ${fallbackQueries.map(sq => `"${sq.text}"`).join(', ')}`);
            return fallbackQueries;
        }
    }

    /**
     * Generate a unique ID for a sub-query
     *
     * @returns A unique sub-query ID
     */
    private generateSubQueryId(): string {
        QueryProcessor.queryCounter++;
        return `sq_${Date.now()}_${QueryProcessor.queryCounter}`;
    }

    /**
     * Assess the complexity of a query on a scale of 1-10
     * This helps determine if decomposition is needed
     *
     * @param query The query to assess
     * @returns A complexity score from 1-10
     */
    assessQueryComplexity(query: string): number {
        let score = 0;

        // Factor 1: Length - longer queries tend to be more complex
        // 0-1.5 points for length
        const lengthScore = Math.min(query.length / 100, 1.5);
        score += lengthScore;

        // Factor 2: Question marks - multiple questions are more complex
        // 0-2 points for question marks
        const questionMarkCount = (query.match(/\?/g) || []).length;
        score += Math.min(questionMarkCount * 0.8, 2);

        // Factor 3: Question words - multiple "wh" questions indicate complexity
        // 0-2 points for question words
        const questionWords = ['what', 'why', 'how', 'when', 'where', 'who', 'which'];
        let questionWordCount = 0;

        for (const word of questionWords) {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            questionWordCount += (query.match(regex) || []).length;
        }

        score += Math.min(questionWordCount * 0.5, 2);

        // Factor 4: Conjunctions - linking multiple concepts increases complexity
        // 0-1.5 points for conjunctions
        const conjunctions = ['and', 'or', 'but', 'however', 'although', 'nevertheless', 'despite', 'whereas'];
        let conjunctionCount = 0;

        for (const conj of conjunctions) {
            const regex = new RegExp(`\\b${conj}\\b`, 'gi');
            conjunctionCount += (query.match(regex) || []).length;
        }

        score += Math.min(conjunctionCount * 0.3, 1.5);

        // Factor 5: Comparison terms - comparisons are complex
        // 0-1.5 points for comparison terms
        const comparisonTerms = ['compare', 'difference', 'differences', 'versus', 'vs', 'similarities', 'better', 'worse'];
        let comparisonCount = 0;

        for (const term of comparisonTerms) {
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            comparisonCount += (query.match(regex) || []).length;
        }

        score += Math.min(comparisonCount * 0.7, 1.5);

        // Factor 6: Technical terms and depth indicators
        // 0-1.5 points for depth indicators
        const depthTerms = ['explain', 'detail', 'elaborate', 'in-depth', 'comprehensive', 'thoroughly', 'analysis'];
        let depthCount = 0;

        for (const term of depthTerms) {
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            depthCount += (query.match(regex) || []).length;
        }

        score += Math.min(depthCount * 0.5, 1.5);

        // Return final score, capped at 10
        return Math.min(Math.round(score), 10);
    }

    /**
     * Update a sub-query with its answer
     *
     * @param decomposedQuery The decomposed query object
     * @param subQueryId The ID of the sub-query to update
     * @param answer The answer to the sub-query
     * @returns The updated decomposed query
     */
    updateSubQueryAnswer(
        decomposedQuery: DecomposedQuery,
        subQueryId: string,
        answer: string
    ): DecomposedQuery {
        const updatedSubQueries = decomposedQuery.subQueries.map(sq => {
            if (sq.id === subQueryId) {
                return {
                    ...sq,
                    answer,
                    isAnswered: true
                };
            }
            return sq;
        });

        // Check if all sub-queries are answered
        const allAnswered = updatedSubQueries.every(sq => sq.isAnswered);

        return {
            ...decomposedQuery,
            subQueries: updatedSubQueries,
            status: allAnswered ? 'completed' : 'in_progress'
        };
    }

    /**
     * Synthesize all sub-query answers into a comprehensive response
     *
     * @param decomposedQuery The decomposed query with all sub-queries answered
     * @returns A synthesized answer to the original query
     */
    synthesizeAnswer(decomposedQuery: DecomposedQuery): string {
        try {
            // Ensure all sub-queries are answered
            if (!decomposedQuery.subQueries.every(sq => sq.isAnswered)) {
                return "Cannot synthesize answer until all sub-queries are answered.";
            }

            // For simple queries with just one sub-query, return the answer directly
            if (decomposedQuery.subQueries.length === 1) {
                return decomposedQuery.subQueries[0].answer || "";
            }

            // For complex queries, build a structured response
            let synthesized = `Answer to: ${decomposedQuery.originalQuery}\n\n`;

            // Group by themes if there are many sub-queries
            if (decomposedQuery.subQueries.length > 3) {
                synthesized += "Based on the information gathered:\n\n";

                for (const sq of decomposedQuery.subQueries) {
                    synthesized += `${sq.answer}\n\n`;
                }
            } else {
                // For fewer sub-queries, present each one with its question
                for (const sq of decomposedQuery.subQueries) {
                    synthesized += `${sq.answer}\n\n`;
                }
            }

            return synthesized.trim();
        } catch (error: any) {
            log.error(`Error synthesizing answer: ${error.message}`);
            return "An error occurred while synthesizing the answer.";
        }
    }
}

// Export a singleton instance
export default new QueryProcessor();
