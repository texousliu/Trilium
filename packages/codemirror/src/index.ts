import { defaultKeymap } from "@codemirror/commands";
import { EditorView, keymap, lineNumbers, type EditorViewConfig } from "@codemirror/view";

export default class CodeMirror extends EditorView {
    constructor(config: EditorViewConfig) {
        super({
            ...config,
            extensions: [
                keymap.of(defaultKeymap),
                lineNumbers()
            ]
        });
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
