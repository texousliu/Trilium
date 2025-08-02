"use strict";

import beccaService from "../../becca/becca_service.js";
import becca from "../../becca/becca.js";
import { 
    normalizeSearchText, 
    calculateOptimizedEditDistance, 
    FUZZY_SEARCH_CONFIG 
} from "./utils/text_utils.js";

// Scoring constants for better maintainability
const SCORE_WEIGHTS = {
    NOTE_ID_EXACT_MATCH: 1000,
    TITLE_EXACT_MATCH: 2000,
    TITLE_PREFIX_MATCH: 500,
    TITLE_WORD_MATCH: 300,
    TOKEN_EXACT_MATCH: 4,
    TOKEN_PREFIX_MATCH: 2,
    TOKEN_CONTAINS_MATCH: 1,
    TOKEN_FUZZY_MATCH: 0.5,
    TITLE_FACTOR: 2.0,
    PATH_FACTOR: 0.3,
    HIDDEN_NOTE_PENALTY: 3
} as const;


class SearchResult {
    notePathArray: string[];
    score: number;
    notePathTitle: string;
    highlightedNotePathTitle?: string;

    constructor(notePathArray: string[]) {
        this.notePathArray = notePathArray;
        this.notePathTitle = beccaService.getNoteTitleForPath(notePathArray);
        this.score = 0;
    }

    get notePath() {
        return this.notePathArray.join("/");
    }

    get noteId() {
        return this.notePathArray[this.notePathArray.length - 1];
    }

    computeScore(fulltextQuery: string, tokens: string[]) {
        this.score = 0;

        const note = becca.notes[this.noteId];
        const normalizedQuery = normalizeSearchText(fulltextQuery.toLowerCase());
        const normalizedTitle = normalizeSearchText(note.title.toLowerCase());

        // Note ID exact match, much higher score
        if (note.noteId.toLowerCase() === fulltextQuery) {
            this.score += SCORE_WEIGHTS.NOTE_ID_EXACT_MATCH;
        }

        // Title matching scores with fuzzy matching support
        if (normalizedTitle === normalizedQuery) {
            this.score += SCORE_WEIGHTS.TITLE_EXACT_MATCH;
        } else if (normalizedTitle.startsWith(normalizedQuery)) {
            this.score += SCORE_WEIGHTS.TITLE_PREFIX_MATCH;
        } else if (this.isWordMatch(normalizedTitle, normalizedQuery)) {
            this.score += SCORE_WEIGHTS.TITLE_WORD_MATCH;
        } else {
            // Try fuzzy matching for typos
            const fuzzyScore = this.calculateFuzzyTitleScore(normalizedTitle, normalizedQuery);
            this.score += fuzzyScore;
        }

        // Add scores for token matches
        this.addScoreForStrings(tokens, note.title, SCORE_WEIGHTS.TITLE_FACTOR);
        this.addScoreForStrings(tokens, this.notePathTitle, SCORE_WEIGHTS.PATH_FACTOR);

        if (note.isInHiddenSubtree()) {
            this.score = this.score / SCORE_WEIGHTS.HIDDEN_NOTE_PENALTY;
        }
    }

    addScoreForStrings(tokens: string[], str: string, factor: number) {
        const normalizedStr = normalizeSearchText(str.toLowerCase());
        const chunks = normalizedStr.split(" ");

        let tokenScore = 0;
        for (const chunk of chunks) {
            for (const token of tokens) {
                const normalizedToken = normalizeSearchText(token.toLowerCase());
                
                if (chunk === normalizedToken) {
                    tokenScore += SCORE_WEIGHTS.TOKEN_EXACT_MATCH * token.length * factor;
                } else if (chunk.startsWith(normalizedToken)) {
                    tokenScore += SCORE_WEIGHTS.TOKEN_PREFIX_MATCH * token.length * factor;
                } else if (chunk.includes(normalizedToken)) {
                    tokenScore += SCORE_WEIGHTS.TOKEN_CONTAINS_MATCH * token.length * factor;
                } else {
                    // Try fuzzy matching for individual tokens
                    const editDistance = calculateOptimizedEditDistance(chunk, normalizedToken, FUZZY_SEARCH_CONFIG.MAX_EDIT_DISTANCE);
                    if (editDistance <= FUZZY_SEARCH_CONFIG.MAX_EDIT_DISTANCE && normalizedToken.length >= FUZZY_SEARCH_CONFIG.MIN_FUZZY_TOKEN_LENGTH) {
                        const fuzzyWeight = SCORE_WEIGHTS.TOKEN_FUZZY_MATCH * (1 - editDistance / FUZZY_SEARCH_CONFIG.MAX_EDIT_DISTANCE);
                        tokenScore += fuzzyWeight * token.length * factor;
                    }
                }
            }
        }
        this.score += tokenScore;
    }


    /**
     * Checks if the query matches as a complete word in the text
     */
    private isWordMatch(text: string, query: string): boolean {
        return text.includes(` ${query} `) || 
               text.startsWith(`${query} `) || 
               text.endsWith(` ${query}`);
    }

    /**
     * Calculates fuzzy matching score for title matches
     */
    private calculateFuzzyTitleScore(title: string, query: string): number {
        const editDistance = calculateOptimizedEditDistance(title, query, FUZZY_SEARCH_CONFIG.MAX_EDIT_DISTANCE);
        const maxLen = Math.max(title.length, query.length);
        
        // Only apply fuzzy matching if the query is reasonably long and edit distance is small
        if (query.length >= FUZZY_SEARCH_CONFIG.MIN_FUZZY_TOKEN_LENGTH && 
            editDistance <= FUZZY_SEARCH_CONFIG.MAX_EDIT_DISTANCE && 
            editDistance / maxLen <= 0.3) {
            const similarity = 1 - (editDistance / maxLen);
            return SCORE_WEIGHTS.TITLE_WORD_MATCH * similarity * 0.7; // Reduced weight for fuzzy matches
        }
        
        return 0;
    }

}

export default SearchResult;
