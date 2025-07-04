import FNote from "../../../entities/fnote.js";
import type { LabelType } from "../../../services/promoted_attribute_definition_parser.js";
import type { ColumnDefinition } from "tabulator-tables";
import { RelationEditor } from "./relation_editor.js";
import { NoteFormatter, NoteTitleFormatter } from "./formatters.js";
import { applyHeaderMenu } from "./header-menu.js";

export type TableData = {
    iconClass: string;
    noteId: string;
    title: string;
    labels: Record<string, boolean | string | null>;
    relations: Record<string, boolean | string | null>;
    branchId: string;
};

type ColumnType = LabelType | "relation";

export interface PromotedAttributeInformation {
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

type GridLabelType = 'text' | 'number' | 'boolean' | 'date' | 'dateString' | 'object';

export async function buildData(parentNote: FNote, info: PromotedAttributeInformation[], notes: FNote[]) {
    const columnDefs = buildColumnDefinitions(info);
    const rowData = await buildRowDefinitions(parentNote, notes, info);

    return {
        rowData,
        columnDefs
    }
}

export function buildColumnDefinitions(info: PromotedAttributeInformation[], existingColumnData?: ColumnDefinition[]) {
    const columnDefs: ColumnDefinition[] = [
        {
            title: "#",
            formatter: "rownum",
            headerSort: false,
            hozAlign: "center",
            resizable: false,
            frozen: true
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

    for (const { name, title, type } of info) {
        const prefix = (type === "relation" ? "relations" : "labels");

        columnDefs.push({
            field: `${prefix}.${name}`,
            title: title ?? name,
            editor: "input",
            ...labelTypeMappings[type ?? "text"],
        });
    }

    applyHeaderMenu(columnDefs);
    if (existingColumnData) {
        restoreExistingData(columnDefs, existingColumnData);
    }

    return columnDefs;
}

function restoreExistingData(newDefs: ColumnDefinition[], oldDefs: ColumnDefinition[]) {
    const byField = new Map<string, ColumnDefinition>;
    for (const def of oldDefs) {
        byField.set(def.field, def);
    }

    for (const newDef of newDefs) {
        const oldDef = byField.get(newDef.field);
        if (!oldDef) {
            continue;
        }

        newDef.width = oldDef.width;
        newDef.visible = oldDef.visible;
    }
}

export async function buildRowDefinitions(parentNote: FNote, notes: FNote[], infos: PromotedAttributeInformation[]) {
    const definitions: TableData[] = [];
    for (const branch of parentNote.getChildBranches()) {
        const note = await branch.getNote();
        if (!note) {
            continue; // Skip if the note is not found
        }

        const labels: typeof definitions[0]["labels"] = {};
        const relations: typeof definitions[0]["relations"] = {};
        for (const { name, type } of infos) {
            if (type === "relation") {
                relations[name] = note.getRelationValue(name);
            } else if (type === "boolean") {
                labels[name] = note.hasLabel(name);
            } else {
                labels[name] = note.getLabelValue(name);
            }
        }
        definitions.push({
            iconClass: note.getIcon(),
            noteId: note.noteId,
            title: note.title,
            labels,
            relations,
            branchId: branch.branchId
        });
    }

    return definitions;
}

export default function getPromotedAttributeInformation(parentNote: FNote) {
    const info: PromotedAttributeInformation[] = [];
    for (const promotedAttribute of parentNote.getPromotedDefinitionAttributes()) {
        const def = promotedAttribute.getDefinition();
        if (def.multiplicity !== "single") {
            console.warn("Multiple values are not supported for now");
            continue;
        }

        const [ labelType, name ] = promotedAttribute.name.split(":", 2);
        if (promotedAttribute.type !== "label") {
            console.warn("Relations are not supported for now");
            continue;
        }

        let type: LabelType | "relation" = def.labelType || "text";
        if (labelType === "relation") {
            type = "relation";
        }

        info.push({
            name,
            title: def.promotedAlias,
            type
        });
    }
    console.log("Promoted attribute information", info);
    return info;
}
