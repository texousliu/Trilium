import { useLegacyImperativeHandlers } from "../../react/hooks";
import { Attribute } from "../../../services/attribute_parser";
import { RefObject } from "preact";
import { Tabulator } from "tabulator-tables";
import { useEffect, useState } from "preact/hooks";
import { EventData } from "../../../components/app_context";
import AttributeDetailWidget from "../../attribute_widgets/attribute_detail";

export default function useColTableEditing(api: RefObject<Tabulator>, attributeDetailWidget: AttributeDetailWidget) {

    const [ existingAttributeToEdit, setExistingAttributeToEdit ] = useState<Attribute>();
    const [ newAttributePosition, setNewAttributePosition ] = useState<number>();

    useEffect(() => {

    }, []);

    useLegacyImperativeHandlers({
        addNewTableColumnCommand({ referenceColumn, columnToEdit, direction, type }: EventData<"addNewTableColumn">) {
            console.log("Ding");
            let attr: Attribute | undefined;

            setExistingAttributeToEdit(undefined);
            if (columnToEdit) {
                attr = this.getAttributeFromField(columnToEdit.getField());
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

                setNewAttributePosition(newPosition);
            } else {
                setNewAttributePosition(undefined);
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
        }
    });

    return {};
}
