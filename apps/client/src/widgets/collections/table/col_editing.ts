import { useLegacyImperativeHandlers } from "../../react/hooks";
import { Attribute } from "../../../services/attribute_parser";
import { RefObject } from "preact";
import { Tabulator } from "tabulator-tables";
import { useRef, useState } from "preact/hooks";
import { CommandListenerData, EventData } from "../../../components/app_context";
import AttributeDetailWidget from "../../attribute_widgets/attribute_detail";
import attributes from "../../../services/attributes";
import { renameColumn } from "../../view_widgets/table_view/bulk_actions";
import FNote from "../../../entities/fnote";
import { getAttributeFromField } from "./utils";

export default function useColTableEditing(api: RefObject<Tabulator>, attributeDetailWidget: AttributeDetailWidget, parentNote: FNote) {

    const [ existingAttributeToEdit, setExistingAttributeToEdit ] = useState<Attribute>();
    const newAttribute = useRef<Attribute>();
    const newAttributePosition = useRef<number>();

    useLegacyImperativeHandlers({
        addNewTableColumnCommand({ referenceColumn, columnToEdit, direction, type }: EventData<"addNewTableColumn">) {
            let attr: Attribute | undefined;

            setExistingAttributeToEdit(undefined);
            if (columnToEdit) {
                attr = getAttributeFromField(parentNote, columnToEdit.getField());
                if (attr) {
                    setExistingAttributeToEdit({ ...attr });
                }
            }

            if (!attr) {
                attr = {
                    type: "label",
                    name: `${type ?? "label"}:myLabel`,
                    value: "promoted,single,text",
                    isInheritable: true
                };
            }

            if (referenceColumn && api.current) {
                let newPosition = api.current.getColumns().indexOf(referenceColumn);
                if (direction === "after") {
                    newPosition++;
                }

                newAttributePosition.current = newPosition;
            } else {
                newAttributePosition.current = undefined;
            }

            attributeDetailWidget.showAttributeDetail({
                attribute: attr,
                allAttributes: [ attr ],
                isOwned: true,
                x: 0,
                y: 150,
                focus: "name",
                hideMultiplicity: true
            });
        },
        async updateAttributeListCommand({ attributes }: CommandListenerData<"updateAttributeList">) {
            newAttribute.current = attributes[0];
        },
        async saveAttributesCommand() {
            if (!newAttribute.current || !api.current) {
                return;
            }

            const { name, value, isInheritable } = newAttribute.current;

            api.current.blockRedraw();
            const isRename = (existingAttributeToEdit && existingAttributeToEdit.name !== name);
            try {
                if (isRename) {
                    const oldName = existingAttributeToEdit!.name.split(":")[1];
                    const [ type, newName ] = name.split(":");
                    await renameColumn(parentNote.noteId, type as "label" | "relation", oldName, newName);
                }

                if (existingAttributeToEdit && (isRename || existingAttributeToEdit.isInheritable !== isInheritable)) {
                    attributes.removeOwnedLabelByName(parentNote, existingAttributeToEdit.name);
                }
                attributes.setLabel(parentNote.noteId, name, value, isInheritable);
            } finally {
                api.current.restoreRedraw();
            }
        }
    });

    return { newAttributePosition };
}
