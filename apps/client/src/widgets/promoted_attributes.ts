export default class PromotedAttributesWidget extends NoteContextAwareWidget {

    focus() {
        this.$widget.find(".promoted-attribute-input:first").focus();
    }

    entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.getAttributeRows(this.componentId).find((attr) => attributeService.isAffecting(attr, this.note))) {
            this.refresh();
        }
    }
}
