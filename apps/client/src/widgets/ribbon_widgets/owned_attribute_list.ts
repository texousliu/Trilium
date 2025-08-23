import { t } from "../../services/i18n.js";
import NoteContextAwareWidget from "../note_context_aware_widget.js";
import AttributeDetailWidget from "../attribute_widgets/attribute_detail.js";
import AttributeEditorWidget from "../attribute_widgets/attribute_editor.js";
import type { CommandListenerData } from "../../components/app_context.js";
import type FAttribute from "../../entities/fattribute.js";

export default class OwnedAttributeListWidget extends NoteContextAwareWidget {

    private attributeDetailWidget: AttributeDetailWidget;
    private attributeEditorWidget: AttributeEditorWidget;
    private $title!: JQuery<HTMLElement>;

    constructor() {
        super();

        this.attributeDetailWidget = new AttributeDetailWidget().contentSized().setParent(this);

        this.attributeEditorWidget = new AttributeEditorWidget(this.attributeDetailWidget).contentSized().setParent(this);

        this.child(this.attributeEditorWidget, this.attributeDetailWidget);
    }

    async saveAttributesCommand() {
        await this.attributeEditorWidget.save();
    }

    async reloadAttributesCommand() {
        await this.attributeEditorWidget.refresh();
    }

    async updateAttributeListCommand({ attributes }: CommandListenerData<"updateAttributeList">) {
        // TODO: See why we need FAttribute[] and Attribute[]
        await this.attributeEditorWidget.updateAttributeList(attributes as FAttribute[]);
    }

    focus() {
        this.attributeEditorWidget.focus();
    }
}
