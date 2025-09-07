import { RowComponent, Tabulator } from "tabulator-tables";
import { CommandListenerData } from "../../../components/app_context";
import note_create, { CreateNoteOpts } from "../../../services/note_create";
import { useLegacyImperativeHandlers } from "../../react/hooks";
import { RefObject } from "preact";

export default function useTableEditing(api: RefObject<Tabulator>, parentNotePath: string) {
    useLegacyImperativeHandlers({
        addNewRowCommand({ customOpts, parentNotePath: customNotePath }: CommandListenerData<"addNewRow">) {
            const notePath = customNotePath ?? parentNotePath;
            if (notePath) {
                const opts: CreateNoteOpts = {
                    activate: false,
                    ...customOpts
                }
                note_create.createNote(notePath, opts).then(({ branch }) => {
                    if (branch) {
                        setTimeout(() => {
                            if (!api.current) return;
                            focusOnBranch(api.current, branch?.branchId);
                        }, 100);
                    }
                })
            }
        }
    });

}

function focusOnBranch(api: Tabulator, branchId: string) {
    const row = findRowDataById(api.getRows(), branchId);
    if (!row) return;

    // Expand the parent tree if any.
    if (api.options.dataTree) {
        const parent = row.getTreeParent();
        if (parent) {
            parent.treeExpand();
        }
    }

    row.getCell("title").edit();
}

function findRowDataById(rows: RowComponent[], branchId: string): RowComponent | null {
    for (let row of rows) {
        const item = row.getIndex() as string;

        if (item === branchId) {
            return row;
        }

        let found = findRowDataById(row.getTreeChildren(), branchId);
        if (found) return found;
    }
    return null;
}
