import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { EditorView, keymap, lineNumbers, ViewUpdate, type EditorViewConfig, type KeyBinding } from "@codemirror/view";
import { defaultHighlightStyle, StreamLanguage, syntaxHighlighting } from "@codemirror/language";
import { Compartment } from "@codemirror/state";
import byMimeType from "./syntax_highlighting.js";

type ContentChangedListener = () => void;

export interface EditorConfig extends EditorViewConfig {
    onContentChanged?: ContentChangedListener;
}

export default class CodeMirror extends EditorView {

    private config: EditorConfig;
    private languageCompartment: Compartment;

    constructor(config: EditorConfig) {
        const languageCompartment = new Compartment();
        let extensions = [
            keymap.of([
                ...defaultKeymap,
                indentWithTab
            ]),
            languageCompartment.of([]),
            syntaxHighlighting(defaultHighlightStyle),
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
        this.languageCompartment = languageCompartment;
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

    async setMimeType(mime: string) {
        const newExtension = [];

        const correspondingSyntax = byMimeType[mime];
        if (correspondingSyntax) {
            const resolvedSyntax = await correspondingSyntax();

            if ("token" in resolvedSyntax) {
                const extension = StreamLanguage.define(resolvedSyntax);
                newExtension.push(extension);
            } else {
                newExtension.push(resolvedSyntax());
            }
        }

        this.dispatch({
            effects: this.languageCompartment.reconfigure(newExtension)
        });
    }
}
