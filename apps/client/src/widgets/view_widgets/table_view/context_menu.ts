import { ColumnComponent, MenuSeparator, RowComponent, Tabulator } from "tabulator-tables";
import contextMenu, { MenuItem } from "../../../menus/context_menu.js";
import { TableData } from "./rows.js";
import branches from "../../../services/branches.js";
import { t } from "../../../services/i18n.js";
import link_context_menu from "../../../menus/link_context_menu.js";
import type FNote from "../../../entities/fnote.js";

export function setupContextMenu(tabulator: Tabulator, parentNote: FNote) {
    tabulator.on("rowContext", (e, row) => showRowContextMenu(e, row, parentNote));
    tabulator.on("headerContext", (e, col) => showColumnContextMenu(e, col, tabulator));
}

function showColumnContextMenu(_e: UIEvent, column: ColumnComponent, tabulator: Tabulator) {
    const e = _e as MouseEvent;
    const { title, field } = column.getDefinition();

    const sorters = tabulator.getSorters();
    const sorter = sorters.find(sorter => sorter.field === field);

    contextMenu.show({
        items: [
            {
                title: t("table_view.sort-column-by", { title }),
                enabled: !!field,
                uiIcon: "bx bx-sort-alt-2",
                items: [
                    {
                        title: t("table_view.sort-column-ascending"),
                        checked: (sorter?.dir === "asc"),
                        uiIcon: "bx bx-empty",
                        handler: () => tabulator.setSort([
                            {
                                column: field!,
                                dir: "asc",
                            }
                        ])
                    },
                    {
                        title: t("table_view.sort-column-descending"),
                        checked: (sorter?.dir === "desc"),
                        uiIcon: "bx bx-empty",
                        handler: () => tabulator.setSort([
                            {
                                column: field!,
                                dir: "desc"
                            }
                        ])
                    }
                ]
            },
            {
                title: t("table_view.sort-column-clear"),
                enabled: sorters.length > 0,
                uiIcon: "bx bx-empty",
                handler: () => tabulator.clearSort()
            },
            {
                title: "----"
            },
            {
                title: t("table_view.hide-column", { title }),
                enabled: !!field,
                uiIcon: "bx bx-hide",
                handler: () => column.hide()
            },
            {
                title: t("table_view.show-hide-columns"),
                uiIcon: "bx bx-empty",
                items: buildColumnItems()
            },
        ],
        selectMenuItemHandler() {},
        x: e.pageX,
        y: e.pageY
    });
    e.preventDefault();

    function buildColumnItems() {
        const items: MenuItem<unknown>[] = [];
        for (const column of tabulator.getColumns()) {
            const { title, visible, field } = column.getDefinition();

            items.push({
                title,
                checked: visible,
                uiIcon: "bx bx-empty",
                enabled: !!field,
                handler: () => column.toggle()
            });
        }

        return items;
    }
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
