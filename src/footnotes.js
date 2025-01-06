import { Plugin } from 'ckeditor5/src/core.js';
import FootnoteEditing from './footnote-editing/footnote-editing.js';
import FootnoteUI from './footnote-ui.js';
export default class Footnotes extends Plugin {
    static get pluginName() {
        return 'Footnotes';
    }
    static get requires() {
        return [FootnoteEditing, FootnoteUI];
    }
}
//# sourceMappingURL=footnotes.js.map