import { Tabulator } from "tabulator-tables";
import AttributeDetailWidget from "../../attribute_widgets/attribute_detail";
import { Attribute } from "../../../services/attribute_parser";
import Component from "../../../components/component";
import { CommandListenerData, EventData } from "../../../components/app_context";
import attributes from "../../../services/attributes";
import FNote from "../../../entities/fnote";
import { renameColumn } from "./bulk_actions";

export default class TableColumnEditing extends Component {

    private attributeDetailWidget: AttributeDetailWidget;
    private api: Tabulator;
    private parentNote: FNote;

    private newAttribute?: Attribute;
    private newAttributePosition?: number;
    private existingAttributeToEdit?: Attribute;

    constructor($parent: JQuery<HTMLElement>, parentNote: FNote, api: Tabulator) {
        super();
        const parentComponent = glob.getComponentByEl($parent[0]);
        this.attributeDetailWidget = new AttributeDetailWidget()
                .contentSized()
                .setParent(parentComponent);
        $parent.append(this.attributeDetailWidget.render());
        this.api = api;
        this.parentNote = parentNote;
    }

    addNewTableColumnCommand({ referenceColumn, columnToEdit, direction }: EventData<"addNewTableColumn">) {
        let attr: Attribute | undefined;

        this.existingAttributeToEdit = undefined;
        if (columnToEdit) {
            attr = this.getAttributeFromField(columnToEdit.getField());
            if (attr) {
                this.existingAttributeToEdit = { ...attr };
            }
        }

        if (!attr) {
            attr = {
                type: "label",
                name: "label:myLabel",
                value: "promoted,single,text"
            };
        }

        if (referenceColumn && this.api) {
            this.newAttributePosition = this.api.getColumns().indexOf(referenceColumn);

            if (direction === "after") {
                this.newAttributePosition++;
            }
        } else {
            this.newAttributePosition = undefined;
        }

        this.attributeDetailWidget!.showAttributeDetail({
            attribute: attr,
            allAttributes: [ attr ],
            isOwned: true,
            x: 0,
            y: 150,
            focus: "name"
        });
    }

    async updateAttributeListCommand({ attributes }: CommandListenerData<"updateAttributeList">) {
        this.newAttribute = attributes[0];
    }

    async saveAttributesCommand() {
        if (!this.newAttribute) {
            return;
        }

        const { name, type, value } = this.newAttribute;

        this.api.blockRedraw();

        if (this.existingAttributeToEdit && this.existingAttributeToEdit.name !== name) {
            const oldName = this.existingAttributeToEdit.name.split(":")[1];
            const newName = name.split(":")[1];
            await renameColumn(this.parentNote.noteId, type, oldName, newName);
        }

        attributes.setLabel(this.parentNote.noteId, name, value);
        if (this.existingAttributeToEdit) {
            attributes.removeOwnedLabelByName(this.parentNote, this.existingAttributeToEdit.name);
        }
        this.api.restoreRedraw();
    }

    getNewAttributePosition() {
        return this.newAttributePosition;
    }

    resetNewAttributePosition() {
        this.newAttribute = undefined;
        this.newAttributePosition = undefined;
        this.existingAttributeToEdit = undefined;
    }

    getFAttributeFromField(field: string) {
        const [ type, name ] = field.split(".", 2);
        const attrName = `${type.replace("s", "")}:${name}`;
        return this.parentNote.getLabel(attrName);
    }

    getAttributeFromField(field: string) {
        const fAttribute = this.getFAttributeFromField(field);
        if (fAttribute) {
            return {
                name: fAttribute.name,
                value: fAttribute.value,
                type: fAttribute.type
            };
        }
        return undefined;
    }

}

