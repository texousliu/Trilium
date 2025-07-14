import { RelationEditor } from "./relation_editor.js";
import { NoteFormatter, NoteTitleFormatter, RowNumberFormatter } from "./formatters.js";
import type { ColumnDefinition, Tabulator } from "tabulator-tables";
import { LabelType } from "../../../services/promoted_attribute_definition_parser.js";

type ColumnType = LabelType | "relation";

export interface AttributeDefinitionInformation {
    name: string;
    title?: string;
    type?: ColumnType;
}

const labelTypeMappings: Record<ColumnType, Partial<ColumnDefinition>> = {
    text: {
        editor: "input"
    },
    boolean: {
        formatter: "tickCross",
        editor: "tickCross"
    },
    date: {
        editor: "date",
    },
    datetime: {
        editor: "datetime"
    },
    number: {
        editor: "number"
    },
    time: {
        editor: "input"
    },
    url: {
        formatter: "link",
        editor: "input"
    },
    relation: {
        editor: RelationEditor,
        formatter: NoteFormatter
    }
};

export function buildColumnDefinitions(info: AttributeDefinitionInformation[], movableRows: boolean, existingColumnData?: ColumnDefinition[], position?: number) {
    let columnDefs: ColumnDefinition[] = [
        {
            title: "#",
            headerSort: false,
            hozAlign: "center",
            resizable: false,
            frozen: true,
            rowHandle: movableRows,
            formatter: RowNumberFormatter(movableRows)
        },
        {
            field: "noteId",
            title: "Note ID",
            visible: false
        },
        {
            field: "title",
            title: "Title",
            editor: "input",
            formatter: NoteTitleFormatter,
            width: 400
        }
    ];

    const seenFields = new Set<string>();
    for (const { name, title, type } of info) {
        const prefix = (type === "relation" ? "relations" : "labels");
        const field = `${prefix}.${name}`;

        if (seenFields.has(field)) {
            continue;
        }

        columnDefs.push({
            field,
            title: title ?? name,
            editor: "input",
            rowHandle: false,
            ...labelTypeMappings[type ?? "text"],
        });
        seenFields.add(field);
    }

    if (existingColumnData) {
        columnDefs = restoreExistingData(columnDefs, existingColumnData, position);
    }

    return columnDefs;
}

function restoreExistingData(newDefs: ColumnDefinition[], oldDefs: ColumnDefinition[], position?: number) {
    const byField = new Map<string, ColumnDefinition>;
    for (const def of oldDefs) {
        byField.set(def.field ?? "", def);
    }

    const newColumns: ColumnDefinition[] = [];
    const existingColumns: ColumnDefinition[] = []
    for (const newDef of newDefs) {
        const oldDef = byField.get(newDef.field ?? "");
        if (!oldDef) {
            newColumns.push(newDef);
        } else {
            newDef.width = oldDef.width;
            newDef.visible = oldDef.visible;
            existingColumns.push(newDef);
        }
    }

    // Clamp position to a valid range
    const insertPos = position !== undefined
        ? Math.min(Math.max(position, 0), existingColumns.length)
        : existingColumns.length;

    // Insert new columns at the specified position
    return [
        ...existingColumns.slice(0, insertPos),
        ...newColumns,
        ...existingColumns.slice(insertPos)
    ];
}
