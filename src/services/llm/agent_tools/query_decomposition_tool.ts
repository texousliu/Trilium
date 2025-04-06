/**
 * Query Decomposition Tool
 *
 * This tool helps the LLM agent break down complex user queries into
 * sub-questions that can be answered individually and then synthesized
 * into a comprehensive response.
 *
 * Features:
 * - Analyze query complexity
 * - Extract multiple intents from a single question
 * - Create a multi-stage research plan
 * - Track progress through complex information gathering
 * 
 * Integration with pipeline architecture:
 * - Can use pipeline stages when available
 * - Falls back to direct methods when needed
 */

import log from '../../log.js';
import { AGENT_TOOL_PROMPTS } from '../constants/llm_prompt_constants.js';
import { QUERY_DECOMPOSITION_STRINGS } from '../constants/query_decomposition_constants.js';
import aiServiceManager from '../ai_service_manager.js';

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

export class QueryDecompositionTool {
    private static queryCounter: number = 0;

    /**
     * Break down a complex query into smaller, more manageable sub-queries
     *
     * @param query The original user query
     * @param context Optional context about the current note being viewed
     * @returns A decomposed query object with sub-queries
     */
    decomposeQuery(query: string, context?: string): DecomposedQuery {
        try {
            // Log the decomposition attempt for tracking
            log.info(QUERY_DECOMPOSITION_STRINGS.LOG_MESSAGES.DECOMPOSING_QUERY(query));

            if (!query || query.trim().length === 0) {
                log.info(QUERY_DECOMPOSITION_STRINGS.LOG_MESSAGES.EMPTY_QUERY);
                return {
                    originalQuery: query,
                    subQueries: [],
                    status: 'pending',
                    complexity: 0
                };
            }

            // Assess query complexity to determine if decomposition is needed
            const complexity = this.assessQueryComplexity(query);
            log.info(QUERY_DECOMPOSITION_STRINGS.LOG_MESSAGES.COMPLEXITY_ASSESSMENT(complexity));

            // For simple queries, just return the original as a single sub-query
            // Use a lower threshold (2 instead of 3) to decompose more queries
            if (complexity < 2) {
                log.info(QUERY_DECOMPOSITION_STRINGS.LOG_MESSAGES.SIMPLE_QUERY(complexity));

                const mainSubQuery = {
                    id: this.generateSubQueryId(),
                    text: query,
                    reason: AGENT_TOOL_PROMPTS.QUERY_DECOMPOSITION.SUB_QUERY_DIRECT,
                    isAnswered: false
                };

                // Still add a generic exploration query to get some related content
                const genericQuery = {
                    id: this.generateSubQueryId(),
                    text: QUERY_DECOMPOSITION_STRINGS.SUB_QUERY_TEMPLATES.INFORMATION_RELATED(query),
                    reason: AGENT_TOOL_PROMPTS.QUERY_DECOMPOSITION.SUB_QUERY_GENERIC,
                    isAnswered: false
                };

                return {
                    originalQuery: query,
                    subQueries: [mainSubQuery, genericQuery],
                    status: 'pending',
                    complexity
                };
            }

            // For complex queries, perform decomposition
            const subQueries = this.createSubQueries(query, context);
            log.info(QUERY_DECOMPOSITION_STRINGS.LOG_MESSAGES.DECOMPOSED_INTO(subQueries.length));

            // Log the sub-queries for better visibility
            subQueries.forEach((sq, index) => {
                log.info(QUERY_DECOMPOSITION_STRINGS.LOG_MESSAGES.SUB_QUERY_LOG(index, sq.text, sq.reason));
            });

            return {
                originalQuery: query,
                subQueries,
                status: 'pending',
                complexity
            };
        } catch (error: any) {
            log.error(QUERY_DECOMPOSITION_STRINGS.LOG_MESSAGES.ERROR_DECOMPOSING(error.message));

            // Fallback to treating it as a simple query
            return {
                originalQuery: query,
                subQueries: [{
                    id: this.generateSubQueryId(),
                    text: query,
                    reason: AGENT_TOOL_PROMPTS.QUERY_DECOMPOSITION.SUB_QUERY_ERROR,
                    isAnswered: false
                }],
                status: 'pending',
                complexity: 1
            };
        }
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
                return QUERY_DECOMPOSITION_STRINGS.SYNTHESIS_TEMPLATES.CANNOT_SYNTHESIZE;
            }

            // For simple queries with just one sub-query, return the answer directly
            if (decomposedQuery.subQueries.length === 1) {
                return decomposedQuery.subQueries[0].answer || "";
            }

            // For complex queries, build a structured response that references each sub-answer
            let synthesized = QUERY_DECOMPOSITION_STRINGS.SYNTHESIS_TEMPLATES.ANSWER_TO(decomposedQuery.originalQuery);

            // Group by themes if there are many sub-queries
            if (decomposedQuery.subQueries.length > 3) {
                // Here we would ideally group related sub-queries, but for now we'll just present them in order
                synthesized += QUERY_DECOMPOSITION_STRINGS.SYNTHESIS_TEMPLATES.BASED_ON_INFORMATION;

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
            log.error(QUERY_DECOMPOSITION_STRINGS.LOG_MESSAGES.ERROR_SYNTHESIZING(error.message));
            return QUERY_DECOMPOSITION_STRINGS.SYNTHESIS_TEMPLATES.ERROR_SYNTHESIZING;
        }
    }

    /**
     * Generate a status report on the progress of answering a complex query
     *
     * @param decomposedQuery The decomposed query
     * @returns A status report string
     */
    getQueryStatus(decomposedQuery: DecomposedQuery): string {
        const answeredCount = decomposedQuery.subQueries.filter(sq => sq.isAnswered).length;
        const totalCount = decomposedQuery.subQueries.length;

        let status = QUERY_DECOMPOSITION_STRINGS.STATUS_TEMPLATES.PROGRESS(answeredCount, totalCount);

        for (const sq of decomposedQuery.subQueries) {
            status += `${sq.isAnswered ? QUERY_DECOMPOSITION_STRINGS.STATUS_TEMPLATES.ANSWERED_MARKER : QUERY_DECOMPOSITION_STRINGS.STATUS_TEMPLATES.UNANSWERED_MARKER} ${sq.text}\n`;
            if (sq.isAnswered) {
                status += `${QUERY_DECOMPOSITION_STRINGS.STATUS_TEMPLATES.ANSWER_PREFIX}${this.truncateText(sq.answer || "", 100)}\n`;
            }
        }

        return status;
    }

    /**
     * Assess the complexity of a query on a scale of 1-10
     * This helps determine how many sub-queries are needed
     *
     * @param query The query to assess
     * @returns A complexity score from 1-10
     */
    assessQueryComplexity(query: string): number {
        // Count the number of question marks as a basic indicator
        const questionMarkCount = (query.match(/\?/g) || []).length;

        // Count potential sub-questions based on question words
        const questionWordMatches = QUERY_DECOMPOSITION_STRINGS.QUESTION_WORDS.map(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            return (query.match(regex) || []).length;
        });

        const questionWordCount = questionWordMatches.reduce((sum, count) => sum + count, 0);

        // Look for conjunctions which might join multiple questions
        const conjunctionPattern = new RegExp(`\\b(${QUERY_DECOMPOSITION_STRINGS.CONJUNCTIONS.join('|')})\\b`, 'gi');
        const conjunctionCount = (query.match(conjunctionPattern) || []).length;

        // Look for complex requirements
        const comparisonPattern = new RegExp(`\\b(${QUERY_DECOMPOSITION_STRINGS.COMPARISON_TERMS.join('|')})\\b`, 'gi');
        const comparisonCount = (query.match(comparisonPattern) || []).length;

        const analysisPattern = new RegExp(`\\b(${QUERY_DECOMPOSITION_STRINGS.ANALYSIS_TERMS.join('|')})\\b`, 'gi');
        const analysisCount = (query.match(analysisPattern) || []).length;

        // Calculate base complexity
        let complexity = 1;

        // Add for multiple questions
        complexity += Math.min(2, questionMarkCount);

        // Add for question words beyond the first one
        complexity += Math.min(2, Math.max(0, questionWordCount - 1));

        // Add for conjunctions that might join questions
        complexity += Math.min(2, conjunctionCount);

        // Add for comparative/analytical requirements
        complexity += Math.min(2, comparisonCount + analysisCount);

        // Add for overall length/complexity
        if (query.length > 100) complexity += 1;
        if (query.length > 200) complexity += 1;

        // Ensure we stay in the 1-10 range
        return Math.max(1, Math.min(10, complexity));
    }

    /**
     * Generate a unique ID for a sub-query
     */
    generateSubQueryId(): string {
        return `sq_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    }

    /**
     * Create sub-queries based on the original query
     */
    createSubQueries(query: string, context?: string): SubQuery[] {
        // Simple rules to create sub-queries based on query content
        const subQueries: SubQuery[] = [];

        // Avoid creating subqueries that start with "Provide details about" or similar
        // as these have been causing recursive loops
        if (query.toLowerCase().includes(QUERY_DECOMPOSITION_STRINGS.QUERY_PATTERNS.PROVIDE_DETAILS_ABOUT) ||
            query.toLowerCase().includes(QUERY_DECOMPOSITION_STRINGS.QUERY_PATTERNS.INFORMATION_RELATED_TO)) {
            log.info(QUERY_DECOMPOSITION_STRINGS.LOG_MESSAGES.AVOIDING_RECURSIVE(query));
            return [{
                id: this.generateSubQueryId(),
                text: query,
                reason: AGENT_TOOL_PROMPTS.QUERY_DECOMPOSITION.SUB_QUERY_DIRECT_ANALYSIS,
                isAnswered: false
            }];
        }

        // First, add the original query as a sub-query (always)
        subQueries.push({
            id: this.generateSubQueryId(),
            text: query,
            reason: AGENT_TOOL_PROMPTS.QUERY_DECOMPOSITION.ORIGINAL_QUERY,
            isAnswered: false
        });

        // Check for "compare", "difference", "versus" to identify comparison questions
        if (
            query.toLowerCase().includes(QUERY_DECOMPOSITION_STRINGS.QUERY_PATTERNS.COMPARE) ||
            query.toLowerCase().includes(QUERY_DECOMPOSITION_STRINGS.QUERY_PATTERNS.DIFFERENCE_BETWEEN) ||
            query.toLowerCase().includes(QUERY_DECOMPOSITION_STRINGS.QUERY_PATTERNS.VS) ||
            query.toLowerCase().includes(QUERY_DECOMPOSITION_STRINGS.QUERY_PATTERNS.VERSUS)
        ) {
            // Extract entities to compare (simplified approach)
            const entities = this.extractEntitiesForComparison(query);

            if (entities.length >= 2) {
                // Add sub-queries for each entity
                entities.forEach(entity => {
                    subQueries.push({
                        id: this.generateSubQueryId(),
                        text: QUERY_DECOMPOSITION_STRINGS.SUB_QUERY_TEMPLATES.KEY_CHARACTERISTICS(entity),
                        reason: QUERY_DECOMPOSITION_STRINGS.SUB_QUERY_REASONS.GETTING_DETAILS(entity),
                        isAnswered: false
                    });
                });

                // Add explicit comparison sub-query
                subQueries.push({
                    id: this.generateSubQueryId(),
                    text: QUERY_DECOMPOSITION_STRINGS.SUB_QUERY_TEMPLATES.COMPARISON_FEATURES(entities),
                    reason: QUERY_DECOMPOSITION_STRINGS.SUB_QUERY_REASONS.DIRECT_COMPARISON,
                    isAnswered: false
                });
            }
        }
        // Check for "how to" questions
        else if (query.toLowerCase().includes(QUERY_DECOMPOSITION_STRINGS.QUERY_PATTERNS.HOW_TO)) {
            const topic = query.replace(/how to /i, '').trim();

            subQueries.push({
                id: this.generateSubQueryId(),
                text: QUERY_DECOMPOSITION_STRINGS.SUB_QUERY_TEMPLATES.STEPS_TO(topic),
                reason: QUERY_DECOMPOSITION_STRINGS.SUB_QUERY_REASONS.FINDING_PROCEDURAL,
                isAnswered: false
            });

            subQueries.push({
                id: this.generateSubQueryId(),
                text: QUERY_DECOMPOSITION_STRINGS.SUB_QUERY_TEMPLATES.CHALLENGES(topic),
                reason: QUERY_DECOMPOSITION_STRINGS.SUB_QUERY_REASONS.IDENTIFYING_DIFFICULTIES,
                isAnswered: false
            });
        }
        // Check for "why" questions
        else if (query.toLowerCase().startsWith(QUERY_DECOMPOSITION_STRINGS.QUERY_PATTERNS.WHY)) {
            const topic = query.replace(/why /i, '').trim();

            subQueries.push({
                id: this.generateSubQueryId(),
                text: QUERY_DECOMPOSITION_STRINGS.SUB_QUERY_TEMPLATES.CAUSES(topic),
                reason: QUERY_DECOMPOSITION_STRINGS.SUB_QUERY_REASONS.IDENTIFYING_CAUSES,
                isAnswered: false
            });

            subQueries.push({
                id: this.generateSubQueryId(),
                text: QUERY_DECOMPOSITION_STRINGS.SUB_QUERY_TEMPLATES.EVIDENCE(topic),
                reason: QUERY_DECOMPOSITION_STRINGS.SUB_QUERY_REASONS.FINDING_EVIDENCE,
                isAnswered: false
            });
        }
        // Handle "what is" questions
        else if (query.toLowerCase().startsWith(QUERY_DECOMPOSITION_STRINGS.QUERY_PATTERNS.WHAT_IS) ||
                 query.toLowerCase().startsWith(QUERY_DECOMPOSITION_STRINGS.QUERY_PATTERNS.WHAT_ARE)) {
            const topic = query.replace(/what (is|are) /i, '').trim().replace(/\?$/, '');

            subQueries.push({
                id: this.generateSubQueryId(),
                text: QUERY_DECOMPOSITION_STRINGS.SUB_QUERY_TEMPLATES.DEFINITION(topic),
                reason: QUERY_DECOMPOSITION_STRINGS.SUB_QUERY_REASONS.GETTING_DEFINITION,
                isAnswered: false
            });

            subQueries.push({
                id: this.generateSubQueryId(),
                text: QUERY_DECOMPOSITION_STRINGS.SUB_QUERY_TEMPLATES.EXAMPLES(topic),
                reason: QUERY_DECOMPOSITION_STRINGS.SUB_QUERY_REASONS.FINDING_EXAMPLES,
                isAnswered: false
            });
        }

        // If no specific sub-queries were added (beyond the original),
        // generate generic exploratory sub-queries
        if (subQueries.length <= 1) {
            // Extract main entities/concepts from the query
            const concepts = this.extractMainConcepts(query);

            concepts.forEach(concept => {
                // Don't create recursive or self-referential queries
                if (!concept.toLowerCase().includes(QUERY_DECOMPOSITION_STRINGS.QUERY_PATTERNS.PROVIDE_DETAILS_ABOUT) &&
                    !concept.toLowerCase().includes(QUERY_DECOMPOSITION_STRINGS.QUERY_PATTERNS.INFORMATION_RELATED_TO)) {
                    subQueries.push({
                        id: this.generateSubQueryId(),
                        text: QUERY_DECOMPOSITION_STRINGS.SUB_QUERY_TEMPLATES.KEY_INFORMATION(concept),
                        reason: QUERY_DECOMPOSITION_STRINGS.SUB_QUERY_REASONS.FINDING_INFORMATION(concept),
                        isAnswered: false
                    });
                }
            });
        }

        return subQueries;
    }

    /**
     * Truncate text to a maximum length with ellipsis
     */
    private truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * Extract entities for comparison from a query
     *
     * @param query The query to extract entities from
     * @returns Array of entity strings
     */
    extractEntitiesForComparison(query: string): string[] {
        // Try to match patterns like "compare X and Y" or "difference between X and Y"
        const comparePattern = /\b(?:compare|difference between|similarities between)\s+([^,]+?)\s+(?:and|with|to)\s+([^,\?\.]+)/i;
        const vsPattern = /\b([^,]+?)\s+(?:vs\.?|versus)\s+([^,\?\.]+)/i;

        let match = query.match(comparePattern) || query.match(vsPattern);

        if (match) {
            return [match[1].trim(), match[2].trim()];
        }

        // If no pattern match, try to extract noun phrases
        const words = query.split(/\s+/);
        const potentialEntities = [];
        let currentPhrase = '';

        for (const word of words) {
            // Skip common words that are unlikely to be part of entity names
            const stopWordsPattern = new RegExp(`^(${QUERY_DECOMPOSITION_STRINGS.STOP_WORDS.join('|')})$`, 'i');
            if (stopWordsPattern.test(word)) {
                if (currentPhrase.trim()) {
                    potentialEntities.push(currentPhrase.trim());
                    currentPhrase = '';
                }
                continue;
            }

            currentPhrase += word + ' ';
        }

        if (currentPhrase.trim()) {
            potentialEntities.push(currentPhrase.trim());
        }

        return potentialEntities.slice(0, 2); // Return at most 2 entities
    }

    /**
     * Extract main concepts from a query
     *
     * @param query The query to extract concepts from
     * @returns Array of concept strings
     */
    extractMainConcepts(query: string): string[] {
        // Remove question words and common stop words
        const stopWordsPattern = new RegExp(QUERY_DECOMPOSITION_STRINGS.STOP_WORDS.join('|'), 'gi');
        const cleanedQuery = query.replace(stopWordsPattern, ' ');

        // Split into words and filter out short words
        const words = cleanedQuery.split(/\s+/).filter(word => word.length > 3);

        // Count word frequency
        const wordCounts: Record<string, number> = {};
        for (const word of words) {
            wordCounts[word.toLowerCase()] = (wordCounts[word.toLowerCase()] || 0) + 1;
        }

        // Sort by frequency
        const sortedWords = Object.entries(wordCounts)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);

        // Try to build meaningful phrases around top words
        const conceptPhrases: string[] = [];

        if (sortedWords.length === 0) {
            // Fallback if no significant words found
            return [query.trim()];
        }

        // Use the top 2-3 words to form concepts
        for (let i = 0; i < Math.min(sortedWords.length, 3); i++) {
            const word = sortedWords[i];

            // Try to find the word in the original query and extract a small phrase around it
            const wordIndex = query.toLowerCase().indexOf(word);
            if (wordIndex >= 0) {
                // Extract a window of text around the word (3 words before and after)
                const start = Math.max(0, query.lastIndexOf(' ', wordIndex - 15) + 1);
                const end = Math.min(query.length, query.indexOf(' ', wordIndex + word.length + 15));

                if (end > start) {
                    conceptPhrases.push(query.substring(start, end).trim());
                } else {
                    conceptPhrases.push(word);
                }
            } else {
                conceptPhrases.push(word);
            }
        }

        return conceptPhrases;
    }
}

export default QueryDecompositionTool;
