import { indentLess, indentMore } from "@codemirror/commands";
import type { KeyBinding } from "@codemirror/view";

const smartIndentWithTab: KeyBinding[] = [
    {
        key: "Tab",
        run({ state, dispatch}) {
            const { selection } = state;

            for (const range of selection.ranges) {
                if (!range.empty) {
                    // Allow default behaviour.
                    return false;
                }

                const line = state.doc.lineAt(range.head);
                const beforeCursor = state.doc.sliceString(line.from, range.head);

                if (/^\s*$/.test(beforeCursor)) {
                    // Only whitespace before cursor: indent line
                    return indentMore({state, dispatch});
                } else {
                    // Insert a tab character
                    const cursor = range.head;
                    dispatch(state.update({
                        changes: {
                            from: cursor,
                            insert: "\t"
                        },
                        selection: { anchor: cursor + 1 },
                        scrollIntoView: true,
                        userEvent: "input"
                    }));
                    return true;
                }
            }

            return false;
        },
        shift: indentLess
    },
]
export default smartIndentWithTab;
