import { indentLess, indentMore } from "@codemirror/commands";
import { EditorSelection, type ChangeSpec } from "@codemirror/state";
import type { KeyBinding } from "@codemirror/view";

const smartIndentWithTab: KeyBinding[] = [
    {
        key: "Tab",
        run({ state, dispatch }) {
            const { selection } = state;

            // Handle selection indenting normally
            if (selection.ranges.some(range => !range.empty)) {
                return indentMore({ state, dispatch });
            }

            const changes = [];
            const newSelections = [];

            for (let range of selection.ranges) {
                const line = state.doc.lineAt(range.head);
                const beforeCursor = state.doc.sliceString(line.from, range.head);

                if (/^\s*$/.test(beforeCursor)) {
                    // Only whitespace before cursor → indent line
                    return indentMore({ state, dispatch });
                } else {
                    // Insert a tab character at cursor
                    changes.push({ from: range.head, to: range.head, insert: "\t" });
                    newSelections.push(EditorSelection.cursor(range.head + 1));
                }
            }

            if (changes.length) {
                dispatch(
                    state.update({
                        changes,
                        selection: EditorSelection.create(newSelections),
                        scrollIntoView: true,
                        userEvent: "input"
                    })
                );
                return true;
            }

            return false;
        },
        shift: indentLess
    },
]
export default smartIndentWithTab;
