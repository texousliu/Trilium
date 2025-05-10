import { defaultKeymap } from "@codemirror/commands";
import { EditorView, keymap, type EditorViewConfig } from "@codemirror/view";

export default class CodeMirror extends EditorView {
    constructor(config: EditorViewConfig) {
        super({
            ...config,
            extensions: [
                keymap.of(defaultKeymap)
            ]
        });
    }
}
