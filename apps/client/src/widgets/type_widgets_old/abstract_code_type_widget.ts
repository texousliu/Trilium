import { getThemeById } from "@triliumnext/codemirror";
import type FNote from "../../entities/fnote.js";
import options from "../../services/options.js";
import TypeWidget from "./type_widget.js";
import CodeMirror, { type EditorConfig } from "@triliumnext/codemirror";
import type { EventData } from "../../components/app_context.js";


/**
 * An abstract {@link TypeWidget} which implements the CodeMirror editor, meant to be used as a parent for
 * widgets requiring the editor.
 *
 * The widget handles the loading and initialization of the CodeMirror editor, as well as some common
 * actions.
 *
 * The derived class must:
 *
 * - Define `$editor` in the constructor.
 * - Call `super.doRender()` in the extended class.
 * - Call `this._update(note, content)` in `#doRefresh(note)`.
 */
export default class AbstractCodeTypeWidget extends TypeWidget {

    protected $editor!: JQuery<HTMLElement>;
    protected codeEditor!: CodeMirror;

    doRender() {
        this.initialized = this.#initEditor();
    }

    async #initEditor() {
        // Load the theme.

    }

    /**
     * Can be extended in derived classes to add extra options to the CodeMirror constructor. The options are appended
     * at the end, so it is possible to override the default values introduced by the abstract editor as well.
     *
     * @returns the extra options to be passed to the CodeMirror constructor.
     */
    getExtraOpts(): Partial<EditorConfig> {
        return {};
    }

    /**
     * Called as soon as the CodeMirror library has been loaded and the editor was constructed. Can be extended in
     * derived classes to add additional functionality or to register event handlers.
     *
     * By default, it does nothing.
     */
    onEditorInitialized() {
        // Do nothing by default.
    }

    focus() {
        this.codeEditor.focus();
    }

}
