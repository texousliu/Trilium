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

    async save() {
        if (this.lastUpdatedNoteId !== this.noteId) {
            // https://github.com/zadam/trilium/issues/3090
            console.warn("Ignoring blur event because a different note is loaded.");
            return;
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

        this.textEditor.model.change((writer) => {
            const documentRoot = this.textEditor.editing.model.document.getRoot();
            if (!documentRoot) {
                return;
            }

            const positionAt = writer.createPositionAt(documentRoot, "end");
            writer.setSelection(positionAt);
        });
    }

    entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.getAttributeRows(this.componentId).find((attr) => attributeService.isAffecting(attr, this.note))) {
            this.refresh();
        }
    }
}
