import { defaultKeymap } from "@codemirror/commands";
import { EditorView, keymap, lineNumbers, ViewUpdate, type EditorViewConfig } from "@codemirror/view";

type ContentChangedListener = () => void;

export interface EditorConfig extends EditorViewConfig {
    onContentChanged?: ContentChangedListener;
}

export default class CodeMirror extends EditorView {

    private config: EditorConfig;

    constructor(config: EditorConfig) {
        let extensions = [
            keymap.of(defaultKeymap),
            lineNumbers()
        ];

        if (Array.isArray(config.extensions)) {
            extensions = [...extensions, ...config.extensions];
        }

        if (config.onContentChanged) {
            extensions.push(EditorView.updateListener.of((v) => this.#onDocumentUpdated(v)));
        }

        super({
            ...config,
            extensions
        });
        this.config = config;
    }

    #onDocumentUpdated(v: ViewUpdate) {
        if (v.docChanged) {
            this.config.onContentChanged?.();
        }
    }

    getText() {
        return this.state.doc.toString();
    }

    setText(content: string) {
        this.dispatch({
            changes: {
                from: 0,
                to: this.state.doc.length,
                insert: content || "",
            }
        })
    }
}
