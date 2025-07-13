import { ColumnComponent, RowComponent, Tabulator } from "tabulator-tables";
import contextMenu from "../../../menus/context_menu.js";
import { TableData } from "./rows.js";
import branches from "../../../services/branches.js";
import { t } from "../../../services/i18n.js";
import link_context_menu from "../../../menus/link_context_menu.js";
import type FNote from "../../../entities/fnote.js";
import appContext from "../../../components/app_context.js";

export function setupContextMenu(tabulator: Tabulator, parentNote: FNote) {
    tabulator.on("rowContext", (e, row) => showRowContextMenu(e, row, parentNote));
    tabulator.on("headerContext", (e, col) => showColumnContextMenu(e, col));
}

function showColumnContextMenu(_e: UIEvent, column: ColumnComponent) {
    const e = _e as MouseEvent;
    contextMenu.show({
        items: [
            {
                title: "Hide column",
                handler: () => column.hide()
            }
        ],
        selectMenuItemHandler() {},
        x: e.pageX,
        y: e.pageY
    });
    e.preventDefault();
}

export function showRowContextMenu(_e: UIEvent, row: RowComponent, parentNote: FNote) {
    const e = _e as MouseEvent;
    const rowData = row.getData() as TableData;
    contextMenu.show({
        items: [
            ...link_context_menu.getItems(),
            { title: "----" },
            {
                title: "Insert row above",
                uiIcon: "bx bx-list-plus",
                handler: () => {
                    const target = e.target;
                    if (!target) {
                        return;
                    }
                    const component = $(target).closest(".component").prop("component");
                    component.triggerCommand("addNewRow", {
                        customOpts: {
                            target: "before",
                            targetBranchId: rowData.branchId,
                        }
                    });
                }
            },
            {
                title: "Insert row below",
                uiIcon: "bx bx-empty",
                handler: () => {
                    const target = e.target;
                    if (!target) {
                        return;
                    }
                    const component = $(target).closest(".component").prop("component");
                    component.triggerCommand("addNewRow", {
                        customOpts: {
                            target: "after",
                            targetBranchId: rowData.branchId,
                        }
                    });
                }
            },
            { title: "----" },
            {
                title: t("table_context_menu.delete_row"),
                uiIcon: "bx bx-trash",
                handler: () => branches.deleteNotes([ rowData.branchId ], false, false)
            }
        ],
        selectMenuItemHandler: ({ command }) =>  link_context_menu.handleLinkContextMenuItem(command, rowData.noteId),
        x: e.pageX,
        y: e.pageY
    });
    e.preventDefault();
}
