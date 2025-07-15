import { Tabulator } from "tabulator-tables";
import AttributeDetailWidget from "../../attribute_widgets/attribute_detail";
import { Attribute } from "../../../services/attribute_parser";
import Component from "../../../components/component";
import { CommandListenerData, EventData } from "../../../components/app_context";
import attributes from "../../../services/attributes";
import FNote from "../../../entities/fnote";

export default class TableColumnEditing extends Component {

    private attributeDetailWidget: AttributeDetailWidget;
    private newAttributePosition?: number;
    private api: Tabulator;
    private newAttribute?: Attribute;
    private parentNote: FNote;

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

    addNewTableColumnEvent({ referenceColumn, direction }: EventData<"addNewTableColumn">) {
        const attr: Attribute = {
            type: "label",
            name: "label:myLabel",
            value: "promoted,single,text"
        };

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
            y: 75,
            focus: "name"
        });
    }

    async reloadAttributesEvent() {
        console.log("Reload attributes");
    }

    async updateAttributeListEvent({ attributes }: CommandListenerData<"updateAttributeList">) {
        this.newAttribute = attributes[0];
    }

    async saveAttributesEvent() {
        if (!this.newAttribute) {
            return;
        }

        const { name, value } = this.newAttribute;
        attributes.addLabel(this.parentNote.noteId, name, value, true);
    }

    getNewAttributePosition() {
        return this.newAttributePosition;
    }

    resetNewAttributePosition() {
        this.newAttributePosition = 0;
    }

}
