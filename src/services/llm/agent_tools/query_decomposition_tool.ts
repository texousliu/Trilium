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
 */

import log from '../../log.js';

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
      // Assess query complexity to determine if decomposition is needed
      const complexity = this.assessQueryComplexity(query);

      // For simple queries, just return the original as a single sub-query
      if (complexity < 3) {
        return {
          originalQuery: query,
          subQueries: [{
            id: this.generateSubQueryId(),
            text: query,
            reason: 'Direct question that can be answered without decomposition',
            isAnswered: false
          }],
          status: 'pending',
          complexity
        };
      }

      // For complex queries, perform decomposition
      const subQueries = this.createSubQueries(query, context);

      return {
        originalQuery: query,
        subQueries,
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
          reason: 'Error in decomposition, treating as simple query',
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
        return "Cannot synthesize answer - not all sub-queries have been answered.";
      }

      // For simple queries with just one sub-query, return the answer directly
      if (decomposedQuery.subQueries.length === 1) {
        return decomposedQuery.subQueries[0].answer || "";
      }

      // For complex queries, build a structured response that references each sub-answer
      let synthesized = `Answer to: "${decomposedQuery.originalQuery}"\n\n`;

      // Group by themes if there are many sub-queries
      if (decomposedQuery.subQueries.length > 3) {
        // Here we would ideally group related sub-queries, but for now we'll just present them in order
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
      return "Error synthesizing the final answer.";
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

    let status = `Progress: ${answeredCount}/${totalCount} sub-queries answered\n\n`;

    for (const sq of decomposedQuery.subQueries) {
      status += `${sq.isAnswered ? '✓' : '○'} ${sq.text}\n`;
      if (sq.isAnswered) {
        status += `   Answer: ${this.truncateText(sq.answer || "", 100)}\n`;
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
    const questionWords = ['what', 'how', 'why', 'where', 'when', 'who', 'which'];
    const questionWordMatches = questionWords.map(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      return (query.match(regex) || []).length;
    });

    const questionWordCount = questionWordMatches.reduce((sum, count) => sum + count, 0);

    // Look for conjunctions which might join multiple questions
    const conjunctionCount = (query.match(/\b(and|or|but|as well as)\b/gi) || []).length;

    // Look for complex requirements
    const comparisonCount = (query.match(/\b(compare|versus|vs|difference|similarities?)\b/gi) || []).length;
    const analysisCount = (query.match(/\b(analyze|examine|investigate|explore|explain|discuss)\b/gi) || []).length;

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
  private generateSubQueryId(): string {
    return `sq_${Date.now()}_${QueryDecompositionTool.queryCounter++}`;
  }

  /**
   * Create sub-queries based on the original query and optional context
   */
  private createSubQueries(query: string, context?: string): SubQuery[] {
    const subQueries: SubQuery[] = [];

    // Simple heuristics for breaking down the query
    // In a real implementation, this would be much more sophisticated,
    // using natural language understanding to identify different intents

    // 1. Look for multiple question marks
    const questionSplit = query.split(/\?/).filter(q => q.trim().length > 0);

    if (questionSplit.length > 1) {
      // Multiple distinct questions detected
      for (let i = 0; i < questionSplit.length; i++) {
        const text = questionSplit[i].trim() + '?';
        subQueries.push({
          id: this.generateSubQueryId(),
          text,
          reason: `Separate question ${i+1} detected in the original query`,
          isAnswered: false
        });
      }
      return subQueries;
    }

    // 2. Look for "and", "or", etc. connecting potentially separate questions
    const conjunctions = [
      { regex: /\b(compare|versus|vs\.?|difference between|similarities between)\b/i, label: 'comparison' },
      { regex: /\b(list|enumerate)\b/i, label: 'listing' },
      { regex: /\b(analyze|examine|investigate|explore)\b/i, label: 'analysis' },
      { regex: /\b(explain|why)\b/i, label: 'explanation' },
      { regex: /\b(how to|steps to|process of)\b/i, label: 'procedure' }
    ];

    // Check for comparison queries - these often need multiple sub-queries
    for (const conj of conjunctions) {
      if (conj.regex.test(query)) {
        if (conj.label === 'comparison') {
          // For comparisons, we need to research each item, then compare them
          const comparisonMatch = query.match(/\b(compare|versus|vs\.?|difference between|similarities between)\s+(.+?)\s+(and|with|to)\s+(.+?)(\?|$)/i);

          if (comparisonMatch) {
            const item1 = comparisonMatch[2].trim();
            const item2 = comparisonMatch[4].trim();

            subQueries.push({
              id: this.generateSubQueryId(),
              text: `What are the key characteristics of ${item1}?`,
              reason: `Need to understand ${item1} for the comparison`,
              isAnswered: false
            });

            subQueries.push({
              id: this.generateSubQueryId(),
              text: `What are the key characteristics of ${item2}?`,
              reason: `Need to understand ${item2} for the comparison`,
              isAnswered: false
            });

            subQueries.push({
              id: this.generateSubQueryId(),
              text: `What are the main differences and similarities between ${item1} and ${item2}?`,
              reason: 'Direct comparison after understanding each item',
              isAnswered: false
            });

            return subQueries;
          }
        }
      }
    }

    // 3. For complex questions without clear separation, create topic-based sub-queries
    if (query.length > 100) {
      // Extract potential key topics from the query
      const words = query.toLowerCase().split(/\W+/).filter(w =>
        w.length > 3 &&
        !['what', 'when', 'where', 'which', 'with', 'would', 'could', 'should', 'have', 'this', 'that', 'there', 'their'].includes(w)
      );

      // Count word frequencies
      const wordFrequency: Record<string, number> = {};
      for (const word of words) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }

      // Get top frequent words
      const topWords = Object.entries(wordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

      if (topWords.length > 0) {
        // Create factual sub-query
        subQueries.push({
          id: this.generateSubQueryId(),
          text: `What are the key facts about ${topWords.join(' and ')} relevant to this question?`,
          reason: 'Gathering basic information about main topics',
          isAnswered: false
        });

        // Create relationship sub-query if multiple top words
        if (topWords.length > 1) {
          subQueries.push({
            id: this.generateSubQueryId(),
            text: `How do ${topWords.join(' and ')} relate to each other?`,
            reason: 'Understanding relationships between key topics',
            isAnswered: false
          });
        }

        // Add the original query as the final synthesizing question
        subQueries.push({
          id: this.generateSubQueryId(),
          text: query,
          reason: 'Original question to be answered after gathering information',
          isAnswered: false
        });

        return subQueries;
      }
    }

    // Fallback: If we can't meaningfully decompose, just use the original query
    subQueries.push({
      id: this.generateSubQueryId(),
      text: query,
      reason: 'Question treated as a single unit',
      isAnswered: false
    });

    return subQueries;
  }

  /**
   * Truncate text to a maximum length with ellipsis
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}

export default QueryDecompositionTool;
