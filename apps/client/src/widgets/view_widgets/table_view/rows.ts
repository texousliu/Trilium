import FNote from "../../../entities/fnote.js";
import type { LabelType } from "../../../services/promoted_attribute_definition_parser.js";
import type { AttributeDefinitionInformation } from "./columns.js";

export type TableData = {
    iconClass: string;
    noteId: string;
    title: string;
    labels: Record<string, boolean | string | null>;
    relations: Record<string, boolean | string | null>;
    branchId: string;
    _children?: TableData[];
};

export async function buildRowDefinitions(parentNote: FNote, infos: AttributeDefinitionInformation[]) {
    const definitions: TableData[] = [];
    let hasChildren = false;
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
            } else {
                labels[name] = note.getLabelValue(name);
            }
        }

        const def: TableData = {
            iconClass: note.getIcon(),
            noteId: note.noteId,
            title: note.title,
            labels,
            relations,
            branchId: branch.branchId,
        }

        if (note.hasChildren()) {
            def._children = (await buildRowDefinitions(note, infos)).definitions;
            hasChildren = true;
        }

        definitions.push(def);
    }

    return {
        definitions,
        hasChildren
    };
}

export default function getAttributeDefinitionInformation(parentNote: FNote) {
    const info: AttributeDefinitionInformation[] = [];
    const attrDefs = parentNote.getAttributes()
        .filter(attr => attr.isDefinition());
    for (const attrDef of attrDefs) {
        const def = attrDef.getDefinition();
        if (def.multiplicity !== "single") {
            console.warn("Multiple values are not supported for now");
            continue;
        }

        const [ labelType, name ] = attrDef.name.split(":", 2);
        if (attrDef.type !== "label") {
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
    return info;
}
