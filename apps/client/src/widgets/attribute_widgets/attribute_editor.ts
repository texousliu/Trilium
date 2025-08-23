import { t } from "../../services/i18n.js";
import NoteContextAwareWidget from "../note_context_aware_widget.js";
import contextMenuService from "../../menus/context_menu.js";
import { AttributeEditor, type EditorConfig, type ModelElement, type MentionFeed, type ModelNode, type ModelPosition } from "@triliumnext/ckeditor5";
import noteCreateService from "../../services/note_create.js";
import attributeService from "../../services/attributes.js";
import type AttributeDetailWidget from "./attribute_detail.js";
import type { CommandData, EventData, EventListener, FilteredCommandNames } from "../../components/app_context.js";
import type { default as FAttribute, AttributeType } from "../../entities/fattribute.js";

export default class AttributeEditorWidget extends NoteContextAwareWidget implements EventListener<"entitiesReloaded">, EventListener<"addNewLabel">, EventListener<"addNewRelation"> {
    private attributeDetailWidget: AttributeDetailWidget;
    private $editor!: JQuery<HTMLElement>;
    private $addNewAttributeButton!: JQuery<HTMLElement>;
    private $saveAttributesButton!: JQuery<HTMLElement>;

    private textEditor!: AttributeEditor;
    private lastUpdatedNoteId!: string | undefined;

    constructor(attributeDetailWidget: AttributeDetailWidget) {
        super();

        this.attributeDetailWidget = attributeDetailWidget;
    }

    doRender() {
        this.$widget = $(TPL);
        this.$editor = this.$widget.find(".attribute-list-editor");

        this.initialized = this.initEditor();

        this.$editor.on("keydown", async (e) => {
            this.attributeDetailWidget.hide();
        });

        this.$editor.on("blur", () => setTimeout(() => this.save(), 100)); // Timeout to fix https://github.com/zadam/trilium/issues/4160

        this.$saveAttributesButton.on("click", () => this.save());
    }

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
