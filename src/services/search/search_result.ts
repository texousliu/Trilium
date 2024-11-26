"use strict";

import beccaService from "../../becca/becca_service.js";
import becca from "../../becca/becca.js";

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
        return this.notePathArray.join('/');
    }

    get noteId() {
        return this.notePathArray[this.notePathArray.length - 1];
    }

    computeScore(fulltextQuery: string, tokens: string[]) {
        this.score = 0;

        const note = becca.notes[this.noteId];
        const normalizedQuery = fulltextQuery.toLowerCase();
        const normalizedTitle = note.title.toLowerCase();

        // Note ID exact match
        if (note.noteId.toLowerCase() === fulltextQuery) {
            this.score += 100;
        }

        // Title matching scores - significantly increase the exact match score
        if (normalizedTitle === normalizedQuery) {
            this.score += 1000; // Much higher score for exact match
        }
        else if (normalizedTitle.startsWith(normalizedQuery)) {
            this.score += 150;
        }
        else if (normalizedTitle.includes(` ${normalizedQuery} `) || 
                normalizedTitle.startsWith(`${normalizedQuery} `) || 
                normalizedTitle.endsWith(` ${normalizedQuery}`)) {
            this.score += 120;
        }

        // notes with matches on its own note title as opposed to ancestors or descendants
        const beforeTokenScore = this.score;
        // Add scores for partial matches with lower weights
        this.addScoreForStrings(tokens, note.title, 1.5);
        this.addScoreForStrings(tokens, this.notePathTitle, 0.5); // Reduced weight for path matches
        

        if (note.isInHiddenSubtree()) {
            this.score = this.score / 2;
        }
    }

    addScoreForStrings(tokens: string[], str: string, factor: number) {
        const chunks = str.toLowerCase().split(" ");

        let tokenScore = 0;
        for (const chunk of chunks) {
            for (const token of tokens) {
                if (chunk === token) {
                    tokenScore += 4 * token.length * factor;
                } else if (chunk.startsWith(token)) {
                    tokenScore += 2 * token.length * factor;
                } else if (chunk.includes(token)) {
                    tokenScore += token.length * factor;
                }
            }
        }
        this.score += tokenScore;
    }
}

export default SearchResult;
