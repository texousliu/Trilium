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
     * Generate enhanced search queries for better semantic matching
     *
     * @param userQuestion - The user's question
     * @param llmService - The LLM service to use for generating queries, or null to auto-detect
     * @returns Array of search queries
     */
    async generateSearchQueries(
        userQuestion: string,
        llmService?: LLMServiceInterface
    ): Promise<string[]> {
        if (!userQuestion || userQuestion.trim() === '') {
            return []; // Return empty array for empty input
        }

        try {
            // Check cache
            const cacheKey = `searchQueries:${userQuestion}`;
            const cached = cacheManager.getQueryResults<string[]>(cacheKey);
            if (cached && Array.isArray(cached)) {
                return cached;
            }

            // Get LLM service if not provided
            const service = llmService || await this.getLLMService();
            if (!service) {
                log.info(`No LLM service available for query enhancement, using original query`);
                return [userQuestion];
            }

            // Prepare the prompt with JSON formatting instructions
            const enhancedPrompt = `${this.enhancerPrompt}
IMPORTANT: You must respond with valid JSON arrays. Always include commas between array elements.
Format your answer as a valid JSON array without markdown code blocks, like this: ["item1", "item2", "item3"]`;

            const messages = [
                { role: "system" as const, content: enhancedPrompt },
                { role: "user" as const, content: userQuestion }
            ];

            const options = {
                temperature: SEARCH_CONSTANTS.TEMPERATURE.QUERY_PROCESSOR,
                maxTokens: SEARCH_CONSTANTS.LIMITS.QUERY_PROCESSOR_MAX_TOKENS,
                bypassFormatter: true,
                expectsJsonResponse: true,
                _bypassContextProcessing: true, // Prevent recursive calls
                enableTools: false // Explicitly disable tools for this request
            };

            // Get the response from the LLM
            const response = await service.generateChatCompletion(messages, options);
            const responseText = response.text;

            // Use the JsonExtractor to parse the response
            const queries = JsonExtractor.extract<string[]>(responseText, {
                extractArrays: true,
                minStringLength: 3,
                applyFixes: true,
                useFallbacks: true
            });

            if (queries && queries.length > 0) {
                log.info(`Extracted ${queries.length} queries using JsonExtractor`);
                cacheManager.storeQueryResults(cacheKey, queries);
                return queries;
            }

            // Fallback to original question
            const fallback = [userQuestion];
            log.info(`No queries extracted, using fallback: "${userQuestion}"`);
            cacheManager.storeQueryResults(cacheKey, fallback);
            return fallback;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error(`Error generating search queries: ${errorMessage}`);
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

            // Assess query complexity
            const complexity = this.assessQueryComplexity(query);
            log.info(`Query complexity assessment: ${complexity}/10`);

            // Try to get LLM service if not provided
            const service = llmService || await this.getLLMService();

            // If no LLM service is available, use basic decomposition
            if (!service) {
                log.info(`No LLM service available for query decomposition, using original query`);
                return this.createBasicDecomposition(query, complexity);
            }

            // With LLM service available, always use advanced decomposition regardless of complexity
            try {
                log.info(`Using advanced LLM-based decomposition for query (complexity: ${complexity})`);
                const enhancedSubQueries = await this.createLLMSubQueries(query, context, service);

                if (enhancedSubQueries && enhancedSubQueries.length > 0) {
                    log.info(`LLM decomposed query into ${enhancedSubQueries.length} sub-queries`);
                    return {
                        originalQuery: query,
                        subQueries: enhancedSubQueries,
                        status: 'pending',
                        complexity
                    };
                }
            } catch (error: any) {
                log.error(`Error during LLM-based decomposition: ${error.message}, falling back to basic decomposition`);
                // Fall through to basic decomposition
            }

            // Fallback to basic decomposition
            return this.createBasicDecomposition(query, complexity);
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
     * Create a basic decomposition of a query without using LLM
     *
     * @param query The original query
     * @param complexity The assessed complexity
     * @returns A basic decomposed query
     */
    private createBasicDecomposition(query: string, complexity: number): DecomposedQuery {
        log.info(`Using basic decomposition approach (complexity: ${complexity})`);

        const mainSubQuery = {
            id: this.generateSubQueryId(),
            text: query,
            reason: "Direct question that can be answered without decomposition",
            isAnswered: false
        };

        // Add a generic exploration query for context
        const genericQuery = {
            id: this.generateSubQueryId(),
            text: `What information is related to ${query}?`,
            reason: "General exploration to find related content",
            isAnswered: false
        };

        return {
            originalQuery: query,
            subQueries: [mainSubQuery, genericQuery],
            status: 'pending',
            complexity
        };
    }

    /**
     * Use LLM to create advanced sub-queries from a complex query
     *
     * @param query The original complex query
     * @param context Optional context to help with decomposition
     * @param llmService LLM service to use for advanced decomposition
     * @returns Array of sub-queries
     */
    private async createLLMSubQueries(
        query: string,
        context?: string,
        llmService?: LLMServiceInterface
    ): Promise<SubQuery[]> {
        // If no LLM service, use basic decomposition
        if (!llmService) {
            return this.createSubQueries(query, context);
        }

        try {
            // Create a much better prompt for more effective query decomposition
            const prompt = `Decompose the following query into 3-5 specific search queries that would help find comprehensive information.

Your task is to identify the main concepts and break them down into specific, targeted search queries.

DO NOT simply rephrase the original query or create a generic "what's related to X" pattern.
DO create specific queries that explore different aspects of the topic.

For example:
If the query is "How does Docker compare to Kubernetes?", good sub-queries would be:
- "Docker container architecture and features"
- "Kubernetes container orchestration capabilities"
- "Docker vs Kubernetes performance comparison"
- "When to use Docker versus Kubernetes"

Format your response as a JSON array of objects with 'text' and 'reason' properties.
Example: [
  {"text": "Docker container architecture", "reason": "Understanding Docker's core technology"},
  {"text": "Kubernetes orchestration features", "reason": "Exploring Kubernetes' main capabilities"}
]

${context ? `\nContext: ${context}` : ''}

Query: ${query}`;

            const messages = [
                { role: "system" as const, content: prompt }
            ];

            const options = {
                temperature: 0.7,  // Higher temperature for more creative decomposition
                maxTokens: SEARCH_CONSTANTS.LIMITS.QUERY_PROCESSOR_MAX_TOKENS,
                bypassFormatter: true,
                expectsJsonResponse: true,
                _bypassContextProcessing: true, // Prevent recursive calls
                enableTools: false // Explicitly disable tools for this request
            };

            // Get the response from the LLM
            const response = await llmService.generateChatCompletion(messages, options);
            const responseText = response.text;

            // Try to extract structured sub-queries from the response
            try {
                // Expected format is an array of objects with "text" and "reason" keys
                interface RawSubQuery {
                    text: string;
                    reason?: string;
                }

                // Log the response for debugging
                log.info(`Received response from LLM for query decomposition, extracting JSON...`);

                log.info(`Response: ${responseText}`);

                // Extract JSON from the response
                const extractedData = JsonExtractor.extract<RawSubQuery[]>(responseText, {
                    extractArrays: true,
                    applyFixes: true,
                    useFallbacks: true
                });

                // Validate the extracted data
                if (!Array.isArray(extractedData)) {
                    log.error(`Failed to extract array from LLM response, got: ${typeof extractedData}`);
                    return this.createSubQueries(query, context);
                }

                if (extractedData.length === 0) {
                    log.error(`Extracted array is empty, falling back to basic decomposition`);
                    return this.createSubQueries(query, context);
                }

                log.info(`Successfully extracted ${extractedData.length} items using regex pattern`);

                // Validate each sub-query to ensure it has a text property
                const validSubQueries = extractedData.filter(item => {
                    if (!item || typeof item !== 'object') {
                        log.error(`Invalid sub-query item: ${JSON.stringify(item)}`);
                        return false;
                    }

                    if (!item.text || typeof item.text !== 'string') {
                        log.error(`Sub-query missing text property: ${JSON.stringify(item)}`);
                        return false;
                    }

                    return true;
                });

                if (validSubQueries.length === 0) {
                    log.error(`No valid sub-queries found after validation, falling back to basic decomposition`);
                    return this.createSubQueries(query, context);
                }

                if (validSubQueries.length < extractedData.length) {
                    log.info(`Some invalid sub-queries were filtered out: ${extractedData.length} -> ${validSubQueries.length}`);
                }

                // Convert the raw data to SubQuery objects
                let subQueries = validSubQueries.map(item => ({
                    id: this.generateSubQueryId(),
                    text: item.text,
                    reason: item.reason || "Sub-aspect of the main question",
                    isAnswered: false
                }));

                // Make sure we have at least the original query
                const hasOriginalQuery = subQueries.some(sq => {
                    // Check if either sq.text or query is null/undefined before using toLowerCase
                    if (!sq.text) return false;
                    const sqText = sq.text.toLowerCase();
                    const originalQuery = query.toLowerCase();

                    return sqText.includes(originalQuery) || originalQuery.includes(sqText);
                });

                if (!hasOriginalQuery) {
                    subQueries.unshift({
                        id: this.generateSubQueryId(),
                        text: query,
                        reason: "Original query",
                        isAnswered: false
                    });
                }

                // Log the extracted sub-queries for debugging
                log.info(`Successfully extracted ${subQueries.length} sub-queries from LLM response`);

                return subQueries;
            } catch (error: any) {
                log.error(`Error extracting sub-queries from LLM response: ${error.message}`);
                // Fall through to traditional decomposition
            }

            // Fallback to traditional decomposition
            return this.createSubQueries(query, context);
        } catch (error: any) {
            log.error(`Error in createLLMSubQueries: ${error.message}`);
            return this.createSubQueries(query, context);
        }
    }

    /**
     * Create sub-queries from a complex query
     *
     * @param query The original complex query
     * @param context Optional context to help with decomposition
     * @returns Array of sub-queries
     */
    private createSubQueries(query: string, context?: string): SubQuery[] {
        // Analyze the query to identify potential aspects to explore
        const questionParts = this.identifyQuestionParts(query);
        const subQueries: SubQuery[] = [];

        // Add the main query as the first sub-query
        subQueries.push({
            id: this.generateSubQueryId(),
            text: query,
            reason: "Main question (for direct matching)",
            isAnswered: false
        });

        // Add sub-queries for each identified question part
        for (const part of questionParts) {
            subQueries.push({
                id: this.generateSubQueryId(),
                text: part,
                reason: "Sub-aspect of the main question",
                isAnswered: false
            });
        }

        // Add a generic exploration query to find related information
        subQueries.push({
            id: this.generateSubQueryId(),
            text: `What information is related to ${query}?`,
            reason: "General exploration to find related content",
            isAnswered: false
        });

        // If we have context, add a specific query for that context
        if (context) {
            subQueries.push({
                id: this.generateSubQueryId(),
                text: `How does "${context}" relate to ${query}?`,
                reason: "Contextual relationship exploration",
                isAnswered: false
            });
        }

        return subQueries;
    }

    /**
     * Identify parts of a complex question that could be individual sub-questions
     *
     * @param query The complex query to analyze
     * @returns Array of potential sub-questions
     */
    private identifyQuestionParts(query: string): string[] {
        const parts: string[] = [];

        // Check for multiple question marks
        const questionSentences = query.split(/(?<=\?)/).filter(s => s.includes('?'));
        if (questionSentences.length > 1) {
            // Multiple explicit questions detected
            return questionSentences.map(s => s.trim());
        }

        // Check for conjunctions that might separate multiple questions
        const conjunctions = ['and', 'or', 'but', 'plus', 'also'];
        for (const conjunction of conjunctions) {
            const pattern = new RegExp(`\\b${conjunction}\\b`, 'i');
            if (pattern.test(query)) {
                // Split by conjunction and check if each part could be a question
                const splitParts = query.split(pattern);
                for (const part of splitParts) {
                    const trimmed = part.trim();
                    if (trimmed.length > 10) { // Avoid tiny fragments
                        parts.push(trimmed);
                    }
                }
                if (parts.length > 0) {
                    return parts;
                }
            }
        }

        // Check for comparison indicators
        const comparisonTerms = ['compare', 'difference', 'differences', 'versus', 'vs'];
        for (const term of comparisonTerms) {
            if (query.toLowerCase().includes(term)) {
                // This is likely a comparison question, extract the items being compared
                const beforeAfter = query.split(new RegExp(`\\b${term}\\b`, 'i'));
                if (beforeAfter.length === 2) {
                    // Try to extract compared items
                    const aspects = this.extractComparisonAspects(beforeAfter[0], beforeAfter[1]);
                    if (aspects.length > 0) {
                        for (const aspect of aspects) {
                            parts.push(`What are the key points about ${aspect}?`);
                        }
                        parts.push(`What are the differences between ${aspects.join(' and ')}?`);
                        return parts;
                    }
                }
            }
        }

        // Check for "multiple aspects" questions
        const aspectPatterns = [
            /what (?:are|is) the (\w+) (?:of|about|for|in) /i,
            /how (?:to|do|does|can) .+ (\w+)/i
        ];

        for (const pattern of aspectPatterns) {
            const match = query.match(pattern);
            if (match && match[1]) {
                const aspect = match[1];
                parts.push(`What is the ${aspect}?`);
                parts.push(`How does ${aspect} relate to the main topic?`);
            }
        }

        return parts;
    }

    /**
     * Extract items being compared from a comparison question
     *
     * @param before Text before the comparison term
     * @param after Text after the comparison term
     * @returns Array of items being compared
     */
    private extractComparisonAspects(before: string, after: string): string[] {
        const aspects: string[] = [];

        // Look for "between A and B" pattern
        const betweenMatch = after.match(/between (.+?) and (.+?)(?:\?|$)/i);
        if (betweenMatch) {
            aspects.push(betweenMatch[1].trim());
            aspects.push(betweenMatch[2].trim());
            return aspects;
        }

        // Look for A vs B pattern
        const directComparison = after.match(/(.+?) (?:and|vs|versus) (.+?)(?:\?|$)/i);
        if (directComparison) {
            aspects.push(directComparison[1].trim());
            aspects.push(directComparison[2].trim());
            return aspects;
        }

        // Fall back to looking for named entities or key terms in both parts
        const beforeTerms = before.match(/(\w+(?:\s+\w+){0,2})/g) || [];
        const afterTerms = after.match(/(\w+(?:\s+\w+){0,2})/g) || [];

        // Look for substantial terms (longer than 3 chars)
        const candidateTerms = [...beforeTerms, ...afterTerms]
            .filter(term => term.length > 3)
            .map(term => term.trim());

        // Take up to 2 distinct terms
        return [...new Set(candidateTerms)].slice(0, 2);
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
