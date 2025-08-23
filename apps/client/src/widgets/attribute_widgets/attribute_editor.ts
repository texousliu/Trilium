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

    dataChanged() {
        this.lastUpdatedNoteId = this.noteId;
    }

    async createNoteForReferenceLink(title: string) {
        let result;
        if (this.notePath) {
            result = await noteCreateService.createNoteWithTypePrompt(this.notePath, {
                activate: false,
                title: title
            });
        }

        return result?.note?.getBestNotePathString();
    }

    async updateAttributeList(attributes: FAttribute[]) {
        await this.renderOwnedAttributes(attributes, false);
    }

    focus() {
        this.$editor.trigger("focus");


    }
}
