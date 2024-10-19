import TypeWidget from "./type_widget.js";
import libraryLoader from "../../services/library_loader.js";
import options from "../../services/options.js";

export default class AbstractCodeTypeWidget extends TypeWidget {

    doRender() {
        this.initialized = this.initEditor();
    }

    async initEditor() {
        await libraryLoader.requireLibrary(libraryLoader.CODE_MIRROR);

        // these conflict with backward/forward navigation shortcuts
        delete CodeMirror.keyMap.default["Alt-Left"];
        delete CodeMirror.keyMap.default["Alt-Right"];

        CodeMirror.modeURL = `${window.glob.assetPath}/node_modules/codemirror/mode/%N/%N.js`;
        CodeMirror.modeInfo.find(mode=>mode.name === "JavaScript").mimes.push(...["application/javascript;env=frontend", "application/javascript;env=backend"]);
        CodeMirror.modeInfo.find(mode=>mode.name === "SQLite").mimes=["text/x-sqlite", "text/x-sqlite;schema=trilium"];

        this.codeEditor = CodeMirror(this.$editor[0], {
            value: "",
            viewportMargin: Infinity,
            indentUnit: 4,
            matchBrackets: true,
            matchTags: {bothTags: true},
            highlightSelectionMatches: {showToken: false, annotateScrollbar: false},            
            lineNumbers: true,
            // we line wrap partly also because without it horizontal scrollbar displays only when you scroll
            // all the way to the bottom of the note. With line wrap, there's no horizontal scrollbar so no problem
            lineWrapping: options.is('codeLineWrapEnabled'),            
            ...this.getExtraOpts()
        });
        this.onEditorInitialized();
    }

    getExtraOpts() {
        return {};
    }

    onEditorInitialized() {

    }

    _update(note, content) {
        // CodeMirror breaks pretty badly on null, so even though it shouldn't happen (guarded by a consistency check)
        // we provide fallback
        this.codeEditor.setValue(content || "");
        this.codeEditor.clearHistory();

        let info = CodeMirror.findModeByMIME(note.mime);
        if (!info) {
            // Switch back to plain text if CodeMirror does not have a mode for whatever MIME type we're editing.
            // To avoid inheriting a mode from a previously open code note.
            info = CodeMirror.findModeByMIME("text/plain");
        }

        this.codeEditor.setOption("mode", info.mime);
        CodeMirror.autoLoadMode(this.codeEditor, info.mode);
    };

    show() {
        this.$widget.show();

        if (this.codeEditor) { // show can be called before render
            this.codeEditor.refresh();
        }
    }

    focus() {
        this.$editor.focus();
        this.codeEditor.focus();
    }

    scrollToEnd() {
        this.codeEditor.setCursor(this.codeEditor.lineCount(), 0);
        this.codeEditor.focus();
    }

    cleanup() {
        if (this.codeEditor) {
            this.spacedUpdate.allowUpdateWithoutChange(() => {
                this.codeEditor.setValue('');
            });
        }
    }

}