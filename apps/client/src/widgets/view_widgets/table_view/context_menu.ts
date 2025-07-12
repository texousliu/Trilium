import { RowComponent, Tabulator } from "tabulator-tables";
import contextMenu from "../../../menus/context_menu.js";
import { TableData } from "./rows.js";
import branches from "../../../services/branches.js";
import { t } from "../../../services/i18n.js";

export function setupContextMenu(tabulator: Tabulator) {
    tabulator.on("rowContext", showRowContextMenu);
}

export function showRowContextMenu(_e: UIEvent, row: RowComponent) {
    const e = _e as MouseEvent;
    const rowData = row.getData() as TableData;
    contextMenu.show({
        items: [
            {
                title: t("table_context_menu.delete_row"),
                uiIcon: "bx bx-trash",
                handler: () => branches.deleteNotes([ rowData.branchId ], false, false)
            }
        ],
        selectMenuItemHandler: () => {},
        x: e.pageX,
        y: e.pageY
    });
    e.preventDefault();
}
