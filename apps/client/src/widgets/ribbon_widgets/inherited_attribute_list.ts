import NoteContextAwareWidget from "../note_context_aware_widget.js";
import AttributeDetailWidget from "../attribute_widgets/attribute_detail.js";
import attributeRenderer from "../../services/attribute_renderer.js";
import attributeService from "../../services/attributes.js";
import { t } from "../../services/i18n.js";
import type FNote from "../../entities/fnote.js";
import type { EventData } from "../../components/app_context.js";

export default class InheritedAttributesWidget extends NoteContextAwareWidget {

    private attributeDetailWidget: AttributeDetailWidget;


    constructor() {
        super();

        this.attributeDetailWidget = new AttributeDetailWidget().contentSized().setParent(this);

        this.child(this.attributeDetailWidget);
    }

    doRender() {
        this.contentSized();

        this.$widget.append(this.attributeDetailWidget.render());
    }

    async refreshWithNote(note: FNote) {
        for (const attribute of inheritedAttributes) {
            .on("click", (e) => {
                setTimeout(
                    () =>
                        this.attributeDetailWidget.showAttributeDetail({
                            attribute: {
                                noteId: attribute.noteId,
                                type: attribute.type,
                                name: attribute.name,
                                value: attribute.value,
                                isInheritable: attribute.isInheritable
                            },
                            isOwned: false,
                            x: e.pageX,
                            y: e.pageY
                        }),
                    100
                );
            });
        }
    }
}
