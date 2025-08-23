export default class AttributeEditorWidget extends NoteContextAwareWidget implements EventListener<"entitiesReloaded">, EventListener<"addNewLabel">, EventListener<"addNewRelation"> {

    // triggered from keyboard shortcut
    async addNewLabelEvent({ ntxId }: EventData<"addNewLabel">) {
        if (this.isNoteContext(ntxId)) {
            await this.refresh();

            this.handleAddNewAttributeCommand("addNewLabel");
        }
    }

    // triggered from keyboard shortcut
    async addNewRelationEvent({ ntxId }: EventData<"addNewRelation">) {
        if (this.isNoteContext(ntxId)) {
            await this.refresh();

            this.handleAddNewAttributeCommand("addNewRelation");
        }
    }

    async updateAttributeList(attributes: FAttribute[]) {
        await this.renderOwnedAttributes(attributes, false);
    }
}
