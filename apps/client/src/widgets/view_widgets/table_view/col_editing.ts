import { Tabulator } from "tabulator-tables";
import AttributeDetailWidget from "../../attribute_widgets/attribute_detail";
import Component from "../../../components/component";
import { CommandListenerData, EventData } from "../../../components/app_context";
import attributes from "../../../services/attributes";
import FNote from "../../../entities/fnote";
import { deleteColumn, renameColumn } from "./bulk_actions";
import dialog from "../../../services/dialog";
import { t } from "../../../services/i18n";

export default class TableColumnEditing extends Component {

    private api: Tabulator;
    private parentNote: FNote;

    private newAttribute?: Attribute;

    constructor($parent: JQuery<HTMLElement>, parentNote: FNote, api: Tabulator) {
        super();
        const parentComponent = glob.getComponentByEl($parent[0]);
        this.api = api;
        this.parentNote = parentNote;
    }

    async deleteTableColumnCommand({ columnToDelete }: CommandListenerData<"deleteTableColumn">) {
        if (!columnToDelete || !await dialog.confirm(t("table_view.delete_column_confirmation"))) {
            return;
        }

        let [ type, name ] = columnToDelete.getField()?.split(".", 2);
        if (!type || !name) {
            return;
        }
        type = type.replace("s", "");

        this.api.blockRedraw();
        try {
            await deleteColumn(this.parentNote.noteId, type as "label" | "relation", name);
            attributes.removeOwnedLabelByName(this.parentNote, `${type}:${name}`);
        } finally {
            this.api.restoreRedraw();
        }
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

    getAttributeFromField(field: string): Attribute | undefined {
        const fAttribute = this.getFAttributeFromField(field);
        if (fAttribute) {
            return {
                name: fAttribute.name,
                value: fAttribute.value,
                type: fAttribute.type,
                isInheritable: fAttribute.isInheritable
            };
        }
        return undefined;
    }

}
