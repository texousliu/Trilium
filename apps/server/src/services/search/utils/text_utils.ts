"use strict";

import { normalize } from "../../utils.js";

/**
 * Shared text processing utilities for search functionality
 */

// Configuration constants for fuzzy matching
export const FUZZY_SEARCH_CONFIG = {
    // Minimum token length for fuzzy operators to prevent false positives
    MIN_FUZZY_TOKEN_LENGTH: 3,
    // Maximum edit distance for fuzzy matching
    MAX_EDIT_DISTANCE: 2,
    // Maximum proximity distance for phrase matching (in words)
    MAX_PHRASE_PROXIMITY: 10,
    // Content size limits for memory protection
    MAX_CONTENT_SIZE: 50 * 1024, // 50KB
    MAX_WORD_COUNT: 10000,
    // Performance thresholds
    EARLY_TERMINATION_THRESHOLD: 3,
} as const;

/**
 * Normalizes text by removing diacritics and converting to lowercase.
 * This is the centralized text normalization function used across all search components.
 * Uses the shared normalize function from utils for consistency.
 * 
 * Examples: 
 * - "café" -> "cafe"
 * - "naïve" -> "naive"
 * - "HELLO WORLD" -> "hello world"
 * 
 * @param text The text to normalize
 * @returns The normalized text
 */
export function normalizeSearchText(text: string): string {
    if (!text || typeof text !== 'string') {
        return '';
    }
    
    // Use shared normalize function for consistency across the codebase
    return normalize(text);
}

/**
 * Optimized edit distance calculation using single array and early termination.
 * This is significantly more memory efficient than the 2D matrix approach and includes
 * early termination optimizations for better performance.
 * 
 * @param str1 First string
 * @param str2 Second string
 * @param maxDistance Maximum allowed distance (for early termination)
 * @returns The edit distance between the strings, or maxDistance + 1 if exceeded
 */
export function calculateOptimizedEditDistance(str1: string, str2: string, maxDistance: number = FUZZY_SEARCH_CONFIG.MAX_EDIT_DISTANCE): number {
    // Input validation
    if (typeof str1 !== 'string' || typeof str2 !== 'string') {
        throw new Error('Both arguments must be strings');
    }
    
    if (maxDistance < 0 || !Number.isInteger(maxDistance)) {
        throw new Error('maxDistance must be a non-negative integer');
    }

    const len1 = str1.length;
    const len2 = str2.length;

    // Performance guard: if strings are too long, limit processing
    const maxStringLength = 1000;
    if (len1 > maxStringLength || len2 > maxStringLength) {
        // For very long strings, fall back to simple length-based heuristic
        return Math.abs(len1 - len2) <= maxDistance ? Math.abs(len1 - len2) : maxDistance + 1;
    }

    // Early termination: if length difference exceeds max distance
    if (Math.abs(len1 - len2) > maxDistance) {
        return maxDistance + 1;
    }

    // Handle edge cases
    if (len1 === 0) return len2 <= maxDistance ? len2 : maxDistance + 1;
    if (len2 === 0) return len1 <= maxDistance ? len1 : maxDistance + 1;

    // Use single array optimization for better memory usage
    let previousRow = Array.from({ length: len2 + 1 }, (_, i) => i);
    let currentRow = new Array(len2 + 1);

    for (let i = 1; i <= len1; i++) {
        currentRow[0] = i;
        let minInRow = i;

        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            currentRow[j] = Math.min(
                previousRow[j] + 1,        // deletion
                currentRow[j - 1] + 1,     // insertion
                previousRow[j - 1] + cost  // substitution
            );
            
            // Track minimum value in current row for early termination
            if (currentRow[j] < minInRow) {
                minInRow = currentRow[j];
            }
        }

        // Early termination: if minimum distance in row exceeds threshold
        if (minInRow > maxDistance) {
            return maxDistance + 1;
        }

        // Swap arrays for next iteration
        [previousRow, currentRow] = [currentRow, previousRow];
    }

    const result = previousRow[len2];
    return result <= maxDistance ? result : maxDistance + 1;
}

/**
 * Validates that tokens meet minimum requirements for fuzzy operators.
 * 
 * @param tokens Array of search tokens
 * @param operator The search operator being used
 * @returns Validation result with success status and error message
 */
export function validateFuzzySearchTokens(tokens: string[], operator: string): { isValid: boolean; error?: string } {
    if (!operator || typeof operator !== 'string') {
        return {
            isValid: false,
            error: 'Invalid operator: operator must be a non-empty string'
        };
    }

    if (!Array.isArray(tokens)) {
        return {
            isValid: false,
            error: 'Invalid tokens: tokens must be an array'
        };
    }

    if (tokens.length === 0) {
        return {
            isValid: false,
            error: 'Invalid tokens: at least one token is required'
        };
    }

    // Check for null, undefined, or non-string tokens
    const invalidTypeTokens = tokens.filter(token => 
        token == null || typeof token !== 'string'
    );
    
    if (invalidTypeTokens.length > 0) {
        return {
            isValid: false,
            error: 'Invalid tokens: all tokens must be non-null strings'
        };
    }

    // Check for empty string tokens
    const emptyTokens = tokens.filter(token => token.trim().length === 0);
    
    if (emptyTokens.length > 0) {
        return {
            isValid: false,
            error: 'Invalid tokens: empty or whitespace-only tokens are not allowed'
        };
    }

    if (operator !== '~=' && operator !== '~*') {
        return { isValid: true };
    }

    // Check minimum token length for fuzzy operators
    const shortTokens = tokens.filter(token => token.length < FUZZY_SEARCH_CONFIG.MIN_FUZZY_TOKEN_LENGTH);
    
    if (shortTokens.length > 0) {
        return {
            isValid: false,
            error: `Fuzzy search operators (~=, ~*) require tokens of at least ${FUZZY_SEARCH_CONFIG.MIN_FUZZY_TOKEN_LENGTH} characters. Invalid tokens: ${shortTokens.join(', ')}`
        };
    }

    // Check for excessively long tokens that could cause performance issues
    const maxTokenLength = 100; // Reasonable limit for search tokens
    const longTokens = tokens.filter(token => token.length > maxTokenLength);
    
    if (longTokens.length > 0) {
        return {
            isValid: false,
            error: `Tokens are too long (max ${maxTokenLength} characters). Long tokens: ${longTokens.map(t => t.substring(0, 20) + '...').join(', ')}`
        };
    }

    return { isValid: true };
}

/**
 * Validates and preprocesses content for search operations with size limits.
 * 
 * @param content The content to validate and preprocess
 * @param noteId The note ID (for logging purposes)
 * @returns Processed content or null if content exceeds limits
 */
export function validateAndPreprocessContent(content: string, noteId?: string): string | null {
    if (!content || typeof content !== 'string') {
        return null;
    }

    // Check content size limits
    if (content.length > FUZZY_SEARCH_CONFIG.MAX_CONTENT_SIZE) {
        console.warn(`Content size exceeds limit for note ${noteId || 'unknown'}: ${content.length} bytes`);
        return content.substring(0, FUZZY_SEARCH_CONFIG.MAX_CONTENT_SIZE);
    }

    // Check word count limits for phrase matching
    const wordCount = content.split(/\s+/).length;
    if (wordCount > FUZZY_SEARCH_CONFIG.MAX_WORD_COUNT) {
        console.warn(`Word count exceeds limit for note ${noteId || 'unknown'}: ${wordCount} words`);
        // Take first MAX_WORD_COUNT words
        return content.split(/\s+/).slice(0, FUZZY_SEARCH_CONFIG.MAX_WORD_COUNT).join(' ');
    }

    return content;
}

/**
 * Checks if a word matches a token with fuzzy matching.
 * Optimized for common case where distances are small.
 * 
 * @param token The search token (should be normalized)
 * @param word The word to match against (should be normalized)
 * @param maxDistance Maximum allowed edit distance
 * @returns True if the word matches the token within the distance threshold
 */
export function fuzzyMatchWord(token: string, word: string, maxDistance: number = FUZZY_SEARCH_CONFIG.MAX_EDIT_DISTANCE): boolean {
    // Input validation
    if (typeof token !== 'string' || typeof word !== 'string') {
        return false;
    }
    
    if (token.length === 0 || word.length === 0) {
        return false;
    }
    
    try {
        // Exact match check first (most common case)
        if (word.includes(token)) {
            return true;
        }
        
        // Length difference check for early exit
        if (Math.abs(word.length - token.length) > maxDistance) {
            return false;
        }
        
        // For very short tokens or very different lengths, be more strict
        if (token.length < 4 || Math.abs(word.length - token.length) > 2) {
            return false;
        }
        
        // Use optimized edit distance calculation
        const distance = calculateOptimizedEditDistance(token, word, maxDistance);
        return distance <= maxDistance;
    } catch (error) {
        // Log error and return false for safety
        console.warn('Error in fuzzy word matching:', error);
        return false;
    }
}