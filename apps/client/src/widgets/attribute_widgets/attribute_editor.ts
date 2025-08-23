import { t } from "../../services/i18n.js";
import NoteContextAwareWidget from "../note_context_aware_widget.js";
import server from "../../services/server.js";
import contextMenuService from "../../menus/context_menu.js";
import attributeParser, { type Attribute } from "../../services/attribute_parser.js";
import { AttributeEditor, type EditorConfig, type ModelElement, type MentionFeed, type ModelNode, type ModelPosition } from "@triliumnext/ckeditor5";
import froca from "../../services/froca.js";
import noteCreateService from "../../services/note_create.js";
import attributeService from "../../services/attributes.js";
import linkService from "../../services/link.js";
import type AttributeDetailWidget from "./attribute_detail.js";
import type { CommandData, EventData, EventListener, FilteredCommandNames } from "../../components/app_context.js";
import type { default as FAttribute, AttributeType } from "../../entities/fattribute.js";
import type FNote from "../../entities/fnote.js";
import { escapeQuotes } from "../../services/utils.js";

const TPL = /*html*/`

    <div class="bx bx-plus add-new-attribute-button tn-tool-button" title="${escapeQuotes(t("attribute_editor.add_a_new_attribute"))}"></div>

    <div class="attribute-errors" style="display: none;"></div>
</div>
`;

type AttributeCommandNames = FilteredCommandNames<CommandData>;

export default class AttributeEditorWidget extends NoteContextAwareWidget implements EventListener<"entitiesReloaded">, EventListener<"addNewLabel">, EventListener<"addNewRelation"> {
    private attributeDetailWidget: AttributeDetailWidget;
    private $editor!: JQuery<HTMLElement>;
    private $addNewAttributeButton!: JQuery<HTMLElement>;
    private $saveAttributesButton!: JQuery<HTMLElement>;
    private $errors!: JQuery<HTMLElement>;

    private textEditor!: AttributeEditor;
    private lastUpdatedNoteId!: string | undefined;
    private lastSavedContent!: string;

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

        this.$addNewAttributeButton = this.$widget.find(".add-new-attribute-button");
        this.$addNewAttributeButton.on("click", (e) => this.addNewAttribute(e));

        this.$saveAttributesButton.on("click", () => this.save());

        this.$errors = this.$widget.find(".attribute-errors");
    }

    addNewAttribute(e: JQuery.ClickEvent) {
        contextMenuService.show<AttributeCommandNames>({
            x: e.pageX,
            y: e.pageY,
            orientation: "left",
            items: [
                { title: t("attribute_editor.add_new_label"), command: "addNewLabel", uiIcon: "bx bx-hash" },
                { title: t("attribute_editor.add_new_relation"), command: "addNewRelation", uiIcon: "bx bx-transfer" },
                { title: "----" },
                { title: t("attribute_editor.add_new_label_definition"), command: "addNewLabelDefinition", uiIcon: "bx bx-empty" },
                { title: t("attribute_editor.add_new_relation_definition"), command: "addNewRelationDefinition", uiIcon: "bx bx-empty" }
            ],
            selectMenuItemHandler: ({ command }) => this.handleAddNewAttributeCommand(command)
        });
        // Prevent automatic hiding of the context menu due to the button being clicked.
        e.stopPropagation();
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

    async handleAddNewAttributeCommand(command: AttributeCommandNames | undefined) {
        // TODO: Not sure what the relation between FAttribute[] and Attribute[] is.
        const attrs = this.parseAttributes() as FAttribute[];

        if (!attrs) {
            return;
        }

        let type: AttributeType;
        let name;
        let value;

        if (command === "addNewLabel") {
            type = "label";
            name = "myLabel";
            value = "";
        } else if (command === "addNewRelation") {
            type = "relation";
            name = "myRelation";
            value = "";
        } else if (command === "addNewLabelDefinition") {
            type = "label";
            name = "label:myLabel";
            value = "promoted,single,text";
        } else if (command === "addNewRelationDefinition") {
            type = "label";
            name = "relation:myRelation";
            value = "promoted,single";
        } else {
            return;
        }

        // TODO: Incomplete type
        //@ts-ignore
        attrs.push({
            type,
            name,
            value,
            isInheritable: false
        });

        await this.renderOwnedAttributes(attrs, false);

        this.$editor.scrollTop(this.$editor[0].scrollHeight);

        const rect = this.$editor[0].getBoundingClientRect();

        setTimeout(() => {
            // showing a little bit later because there's a conflict with outside click closing the attr detail
            this.attributeDetailWidget.showAttributeDetail({
                allAttributes: attrs,
                attribute: attrs[attrs.length - 1],
                isOwned: true,
                x: (rect.left + rect.right) / 2,
                y: rect.bottom,
                focus: "name"
            });
        }, 100);
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

        if (this.$errors.is(":visible")) {
            // using .hide() instead of .slideUp() since this will also hide the error after confirming
            // mention for relation name which suits up. When using.slideUp() error will appear and the slideUp which is weird
            this.$errors.hide();
        }
    }

    async loadReferenceLinkTitle($el: JQuery<HTMLElement>, href: string) {
        const { noteId } = linkService.parseNavigationStateFromUrl(href);
        const note = noteId ? await froca.getNote(noteId, true) : null;
        const title = note ? note.title : "[missing]";

        $el.text(title);
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
