import { indentLess, indentMore } from "@codemirror/commands";
import { EditorSelection, type ChangeSpec } from "@codemirror/state";
import type { KeyBinding } from "@codemirror/view";

/**
 * Custom key binding for indentation:
 *
 * - <kbd>Tab</kbd> while at the beginning of a line will indent the line.
 * - <kbd>Tab</kbd> while not at the beginning of a line will insert a tab character.
 * - <kbd>Tab</kbd> while not at the beginning of a line while text is selected will replace the txt with a tab character.
 * - <kbd>Shift</kbd>+<kbd>Tab</kbd> will always unindent.
 */
const smartIndentWithTab: KeyBinding[] = [
    {
        key: "Tab",
        run({ state, dispatch }) {
            const { selection } = state;
            const changes = [];
            const newSelections = [];

            // Step 1: Handle non-empty selections → replace with tab
            if (selection.ranges.some(range => !range.empty)) {
                for (let range of selection.ranges) {
                    changes.push({ from: range.from, to: range.to, insert: "\t" });
                    newSelections.push(EditorSelection.cursor(range.from + 1));
                }

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

            // Step 2: Handle empty selections
            for (let range of selection.ranges) {
                const line = state.doc.lineAt(range.head);
                const beforeCursor = state.doc.sliceString(line.from, range.head);

                if (/^\s*$/.test(beforeCursor)) {
                    // Only whitespace before cursor → indent line
                    return indentMore({ state, dispatch });
                } else {
                    // Insert tab character at cursor
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
