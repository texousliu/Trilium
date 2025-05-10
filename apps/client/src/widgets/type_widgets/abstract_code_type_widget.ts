import TypeWidget from "./type_widget.js";
import CodeMirror, { type EditorConfig } from "@triliumnext/codemirror";

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
        this.codeEditor = new CodeMirror({
            parent: this.$editor[0],
            ...this.getExtraOpts()
        });
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

    /**
     * Must be called by the derived classes in `#doRefresh(note)` in order to react to changes.
     *
     * @param {*} note the note that was changed.
     * @param {*} content the new content of the note.
     */
    _update(note: { mime: string }, content: string) {
        this.codeEditor.setText(content);
        // this.codeEditor.clearHistory();

        // let info = CodeMirror.findModeByMIME(note.mime);
        // if (!info) {
        //     // Switch back to plain text if CodeMirror does not have a mode for whatever MIME type we're editing.
        //     // To avoid inheriting a mode from a previously open code note.
        //     info = CodeMirror.findModeByMIME("text/plain");
        // }

        // this.codeEditor.setOption("mode", info.mime);
        // CodeMirror.autoLoadMode(this.codeEditor, info.mode);
    }

    show() {
        this.$widget.show();

        // if (this.codeEditor) {
        //     // show can be called before render
        //     this.codeEditor.refresh();
        // }
    }

    focus() {
        this.$editor.focus();
        this.codeEditor.focus();
    }

    scrollToEnd() {
        // this.codeEditor.setCursor(this.codeEditor.lineCount(), 0);
        // this.codeEditor.focus();
    }

    cleanup() {
        if (this.codeEditor) {
            // this.spacedUpdate.allowUpdateWithoutChange(() => {
            //     this.codeEditor.setValue("");
            // });
        }
    }
}
