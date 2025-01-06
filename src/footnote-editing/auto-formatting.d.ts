import { type Editor } from 'ckeditor5/src/core.js';
import { type Element } from 'ckeditor5/src/engine.js';
/**
 * Adds functionality to support creating footnotes using markdown syntax, e.g. `[^1]`.
 */
export declare const addFootnoteAutoformatting: (editor: Editor, rootElement: Element) => void;
