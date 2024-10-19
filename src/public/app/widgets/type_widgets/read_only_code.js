import TypeWidget from "./type_widget.js";
import libraryLoader from "../../services/library_loader.js";
import options from "../../services/options.js";

const TPL = `
<div class="note-detail-readonly-code note-detail-printable">
    <style>
    .note-detail-readonly-code {
        min-height: 50px;
        position: relative;
    }
    
    .note-detail-readonly-code-content {
        padding: 10px;
    }
    </style>

    <pre class="note-detail-readonly-code-content"></pre>
</div>`;

export default class ReadOnlyCodeTypeWidget extends TypeWidget {
    static getType() { return "readOnlyCode"; }

    doRender() {
        this.$widget = $(TPL);
        this.$editor = this.$widget.find('.note-detail-readonly-code-content');

        super.doRender();

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
            gutters: ["CodeMirror-lint-markers"],
            lineNumbers: true,
            // we line wrap partly also because without it horizontal scrollbar displays only when you scroll
            // all the way to the bottom of the note. With line wrap, there's no horizontal scrollbar so no problem
            lineWrapping: options.is('codeLineWrapEnabled'),
            readOnly: true
        });
    }

    async doRefresh(note) {
        let {content} = await this.note.getBlob();

        if (note.type === 'text' && this.noteContext?.viewScope?.viewMode === 'source') {
            content = this.format(content);
        }

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
        this.show();
    }

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

    async executeWithContentElementEvent({resolve, ntxId}) {
        if (!this.isNoteContext(ntxId)) {
            return;
        }

        await this.initialized;

        resolve(this.$content);
    }

    format(html) {
        let indent = '\n';
        const tab = '\t';
        let i = 0;
        let pre = [];

        html = html
            .replace(new RegExp('<pre>((.|\\t|\\n|\\r)+)?</pre>'), function (x) {
                pre.push({indent: '', tag: x});
                return '<--TEMPPRE' + i++ + '/-->'
            })
            .replace(new RegExp('<[^<>]+>[^<]?', 'g'), function (x) {
                let ret;
                let tag = /<\/?([^\s/>]+)/.exec(x)[1];
                let p = new RegExp('<--TEMPPRE(\\d+)/-->').exec(x);

                if (p) {
                    pre[p[1]].indent = indent;
                }

                if (['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr'].indexOf(tag) >= 0) { // self closing tag
                    ret = indent + x;
                } else {
                    if (x.indexOf('</') < 0) { //open tag
                        if (x.charAt(x.length - 1) !== '>') ret = indent + x.substr(0, x.length - 1) + indent + tab + x.substr(x.length - 1, x.length); else ret = indent + x;
                        !p && (indent += tab);
                    } else {//close tag
                        indent = indent.substr(0, indent.length - 1);
                        if (x.charAt(x.length - 1) !== '>') ret = indent + x.substr(0, x.length - 1) + indent + x.substr(x.length - 1, x.length); else ret = indent + x;
                    }
                }
                return ret;
            });

        for (i = pre.length; i--;) {
            html = html.replace('<--TEMPPRE' + i + '/-->', pre[i].tag.replace('<pre>', '<pre>\n').replace('</pre>', pre[i].indent + '</pre>'));
        }

        return html.charAt(0) === '\n' ? html.substr(1, html.length - 1) : html;
    }
}
