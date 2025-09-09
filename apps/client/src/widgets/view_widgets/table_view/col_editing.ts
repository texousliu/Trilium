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

    getNewAttributePosition() {
        return this.newAttributePosition;
    }

    resetNewAttributePosition() {
        this.newAttribute = undefined;
        this.newAttributePosition = undefined;
        this.existingAttributeToEdit = undefined;
    }



}
