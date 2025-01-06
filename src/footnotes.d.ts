import { Plugin } from 'ckeditor5/src/core.js';
import FootnoteEditing from './footnote-editing/footnote-editing.js';
import FootnoteUI from './footnote-ui.js';
export default class Footnotes extends Plugin {
    static get pluginName(): "Footnotes";
    static get requires(): readonly [typeof FootnoteEditing, typeof FootnoteUI];
}
