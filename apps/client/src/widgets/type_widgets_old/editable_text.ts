import utils, { hasTouchBar } from "../../services/utils.js";
import keyboardActionService from "../../services/keyboard_actions.js";
import froca from "../../services/froca.js";
import noteCreateService from "../../services/note_create.js";
import AbstractTextTypeWidget from "./abstract_text_type_widget.js";
import link from "../../services/link.js";
import appContext, { type CommandListenerData, type EventData } from "../../components/app_context.js";
import dialogService from "../../services/dialog.js";
import options from "../../services/options.js";
import toast from "../../services/toast.js";
import { buildSelectedBackgroundColor } from "../../components/touch_bar.js";
import { buildConfig, BuildEditorOptions, OPEN_SOURCE_LICENSE_KEY } from "./ckeditor/config.js";
import type FNote from "../../entities/fnote.js";
import { PopupEditor, ClassicEditor, EditorWatchdog, type CKTextEditor, type MentionFeed, type WatchdogConfig, EditorConfig } from "@triliumnext/ckeditor5";
import { updateTemplateCache } from "./ckeditor/snippets.js";

export type BoxSize = "small" | "medium" | "full";

export default class EditableTextTypeWidget extends AbstractTextTypeWidget {

    private contentLanguage?: string | null;
    private watchdog!: EditorWatchdog<ClassicEditor | PopupEditor>;

    private $editor!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);
        this.$editor = this.$widget.find(".note-detail-editable-text-editor");

        this.initialized = this.initEditor();

        keyboardActionService.setupActionsForElement("text-detail", this.$widget, this);

        this.setupImageOpening(false);

        super.doRender();
    }

    async initEditor() {
        this.watchdog.on("stateChange", () => {
            const currentState = this.watchdog.state;
            logInfo(`CKEditor state changed to ${currentState}`);

            if (!["crashed", "crashedPermanently"].includes(currentState)) {
                return;
            }

            logError(`CKEditor crash logs: ${JSON.stringify(this.watchdog.crashes, null, 4)}`);

            if (currentState === "crashedPermanently") {
                dialogService.info(`Editing component keeps crashing. Please try restarting Trilium. If problem persists, consider creating a bug report.`);

                this.watchdog.editor?.enableReadOnlyMode("crashed-editor");
            }
        });

        this.watchdog.setCreator(async (_, editorConfig) => {
            logInfo("Creating new CKEditor");

            const notificationsPlugin = editor.plugins.get("Notification");
            notificationsPlugin.on("show:warning", (evt, data) => {
                const title = data.title;
                const message = data.message.message;

                if (title && message) {
                    toast.showErrorTitleAndMessage(data.title, data.message.message);
                } else if (title) {
                    toast.showError(title || message);
                }

                evt.stop();
            });

            if (isClassicEditor) {
                const $classicToolbarWidget = this.findClassicToolbar();

                $classicToolbarWidget.empty();
                if ($classicToolbarWidget.length) {
                    const toolbarView = (editor as ClassicEditor).ui.view.toolbar;
                    if (toolbarView.element) {
                        $classicToolbarWidget[0].appendChild(toolbarView.element);
                    }
                }

                if (utils.isMobile()) {
                    $classicToolbarWidget.addClass("visible");

                    // Reposition all dropdowns to point upwards instead of downwards.
                    // See https://ckeditor.com/docs/ckeditor5/latest/examples/framework/bottom-toolbar-editor.html for more info.
                    const toolbarView = (editor as ClassicEditor).ui.view.toolbar;
                    for (const item of toolbarView.items) {
                        if (!("panelView" in item)) {
                            continue;
                        }

                        item.on("change:isOpen", () => {
                            if (!("isOpen" in item) || !item.isOpen) {
                                return;
                            }

                            // @ts-ignore
                            item.panelView.position = item.panelView.position.replace("s", "n");
                        });
                    }
                }
            }

            editor.model.document.on("change:data", () => this.spacedUpdate.scheduleUpdate());

            if (import.meta.env.VITE_CKEDITOR_ENABLE_INSPECTOR === "true") {
                const CKEditorInspector = (await import("@ckeditor/ckeditor5-inspector")).default;
                CKEditorInspector.attach(editor);
            }

            // Touch bar integration
            if (hasTouchBar) {
                for (const event of [ "bold", "italic", "underline", "paragraph", "heading" ]) {
                    editor.commands.get(event)?.on("change", () => this.triggerCommand("refreshTouchBar"));
                }
            }

            return editor;
        });

        await this.createEditor();
    }

    async doRefresh(note: FNote) {
        const blob = await note.getBlob();

        await this.spacedUpdate.allowUpdateWithoutChange(async () => {
            const data = blob?.content || "";
            const newContentLanguage = this.note?.getLabelValue("language");
            if (this.contentLanguage !== newContentLanguage) {
                await this.reinitializeWithData(data);
            } else {
                this.watchdog.editor?.setData(data);
            }
        });
    }

    getData() {
        if (!this.watchdog.editor) {
            // There is nothing to save, most likely a result of the editor crashing and reinitializing.
            return;
        }

        const content = this.watchdog.editor?.getData() ?? "";

        // if content is only tags/whitespace (typically <p>&nbsp;</p>), then just make it empty,
        // this is important when setting a new note to code
        return {
            content: utils.isHtmlEmpty(content) ? "" : content
        };
    }

    focus() {
        const editor = this.watchdog.editor;
        if (editor) {
            editor.editing.view.focus();
        } else {
            this.$editor.trigger("focus");
        }
    }

    scrollToEnd() {
        this.watchdog?.editor?.model.change((writer) => {
            const rootItem = this.watchdog?.editor?.model.document.getRoot();
            if (rootItem) {
                writer.setSelection(writer.createPositionAt(rootItem, "end"));
            }
        });

        this.watchdog?.editor?.editing.view.focus();
    }

    show() { }

    getEditor() {
        return this.watchdog?.editor;
    }

    cleanup() {
        if (this.watchdog?.editor) {
            this.spacedUpdate.allowUpdateWithoutChange(() => {
                this.watchdog.editor?.setData("");
            });
        }
    }

    insertDateTimeToTextCommand() {
        const date = new Date();
        const customDateTimeFormat = options.get("customDateTimeFormat");
        const dateString = utils.formatDateTime(date, customDateTimeFormat);

        this.addTextToEditor(dateString);
    }

    async addLinkToEditor(linkHref: string, linkTitle: string) {
        await this.initialized;

        this.watchdog.editor?.model.change((writer) => {
            const insertPosition = this.watchdog.editor?.model.document.selection.getFirstPosition();
            if (insertPosition) {
                writer.insertText(linkTitle, { linkHref: linkHref }, insertPosition);
            }
        });
    }

    async addTextToEditor(text: string) {
        await this.initialized;

        this.watchdog.editor?.model.change((writer) => {
            const insertPosition = this.watchdog.editor?.model.document.selection.getLastPosition();
            if (insertPosition) {
                writer.insertText(text, insertPosition);
            }
        });
    }

    addTextToActiveEditorEvent({ text }: EventData<"addTextToActiveEditor">) {
        if (!this.isActive()) {
            return;
        }

        this.addTextToEditor(text);
    }

    async addLink(notePath: string, linkTitle: string | null, externalLink: boolean = false) {
        await this.initialized;

        if (linkTitle) {
            if (this.hasSelection()) {
                this.watchdog.editor?.execute("link", externalLink ? `${notePath}` : `#${notePath}`);
            } else {
                await this.addLinkToEditor(externalLink ? `${notePath}` : `#${notePath}`, linkTitle);
            }
        } else {
            this.watchdog.editor?.execute("referenceLink", { href: "#" + notePath });
        }

        this.watchdog.editor?.editing.view.focus();
    }

    // returns true if user selected some text, false if there's no selection
    hasSelection() {
        const model = this.watchdog.editor?.model;
        const selection = model?.document.selection;

        return !selection?.isCollapsed;
    }

    async executeWithTextEditorEvent({ callback, resolve, ntxId }: EventData<"executeWithTextEditor">) {
        if (!this.isNoteContext(ntxId)) {
            return;
        }

        await this.initialized;

        if (!this.watchdog.editor) {
            return;
        }

        if (callback) {
            callback(this.watchdog.editor as CKTextEditor);
        }

        resolve(this.watchdog.editor as CKTextEditor);
    }

    addLinkToTextCommand() {
        const selectedText = this.getSelectedText();

        this.triggerCommand("showAddLinkDialog", { textTypeWidget: this, text: selectedText });
    }

    getSelectedText() {
        const range = this.watchdog.editor?.model.document.selection.getFirstRange();
        let text = "";

        if (!range) {
            return text;
        }

        for (const item of range.getItems()) {
            if ("data" in item && item.data) {
                text += item.data;
            }
        }

        return text;
    }

    async followLinkUnderCursorCommand() {
        await this.initialized;

        const selection = this.watchdog.editor?.model.document.selection;
        const selectedElement = selection?.getSelectedElement();

        if (selectedElement?.name === "reference") {
            // reference link
            const notePath = selectedElement.getAttribute("notePath") as string | undefined;

            if (notePath) {
                await appContext.tabManager.getActiveContext()?.setNote(notePath);
                return;
            }
        }

        if (!selection?.hasAttribute("linkHref")) {
            return;
        }

        const selectedLinkUrl = selection.getAttribute("linkHref") as string;
        const notePath = link.getNotePathFromUrl(selectedLinkUrl);

        if (notePath) {
            await appContext.tabManager.getActiveContext()?.setNote(notePath);
        } else {
            window.open(selectedLinkUrl, "_blank");
        }
    }

    addIncludeNoteToTextCommand() {
        this.triggerCommand("showIncludeNoteDialog", { textTypeWidget: this });
    }

    addIncludeNote(noteId: string, boxSize?: BoxSize) {
        this.watchdog.editor?.model.change((writer) => {
            // Insert <includeNote>*</includeNote> at the current selection position
            // in a way that will result in creating a valid model structure
            this.watchdog.editor?.model.insertContent(
                writer.createElement("includeNote", {
                    noteId: noteId,
                    boxSize: boxSize
                })
            );
        });
    }

    async addImage(noteId: string) {
        const note = await froca.getNote(noteId);
        if (!note || !this.watchdog.editor) {
            return;
        }

        this.watchdog.editor.model.change((writer) => {
            const encodedTitle = encodeURIComponent(note.title);
            const src = `api/images/${note.noteId}/${encodedTitle}`;

            this.watchdog.editor?.execute("insertImage", { source: src });
        });
    }

    async createNoteForReferenceLink(title: string) {
        if (!this.notePath) {
            return;
        }

        const resp = await noteCreateService.createNoteWithTypePrompt(this.notePath, {
            activate: false,
            title: title
        });

        if (!resp || !resp.note) {
            return;
        }

        return resp.note.getBestNotePathString();
    }

    async refreshIncludedNoteEvent({ noteId }: EventData<"refreshIncludedNote">) {
        this.refreshIncludedNote(this.$editor, noteId);
    }

    async reinitializeWithData(data: string) {
        if (!this.watchdog) {
            return;
        }

        this.watchdog.destroy();
        await this.createEditor();
        this.watchdog.editor?.setData(data);
    }

    async reinitialize() {
        const data = this.watchdog.editor?.getData();
        await this.reinitializeWithData(data ?? "");
    }

    async reloadTextEditorEvent() {
        await this.reinitialize();
    }

    async onLanguageChanged() {
        await this.reinitialize();
    }

    async entitiesReloadedEvent(e: EventData<"entitiesReloaded">) {
        await super.entitiesReloadedEvent(e);

        if (updateTemplateCache(e.loadResults)) {
            await this.reinitialize();
        }
    }

    findClassicToolbar(): JQuery<HTMLElement> {
        if (!utils.isMobile()) {
            const $parentSplit = this.$widget.parents(".note-split.type-text");

            if ($parentSplit.length) {
                // The editor is in a normal tab.
                return $parentSplit.find("> .ribbon-container .classic-toolbar-widget");
            } else {
                // The editor is in a popup.
                return this.$widget.closest(".modal-body").find(".classic-toolbar-widget");
            }
        } else {
            return $("body").find(".classic-toolbar-widget");
        }
    }

    buildTouchBarCommand(data: CommandListenerData<"buildTouchBar">) {
        const { TouchBar, buildIcon } = data;
        const { TouchBarSegmentedControl, TouchBarGroup, TouchBarButton } = TouchBar;
        const { editor } = this.watchdog;

        if (!editor) {
            return;
        }

        const commandButton = (icon: string, command: string) => new TouchBarButton({
            icon: buildIcon(icon),
            click: () => editor.execute(command),
            backgroundColor: buildSelectedBackgroundColor(editor.commands.get(command)?.value as boolean)
        });

        let headingSelectedIndex: number | undefined = undefined;
        const headingCommand = editor.commands.get("heading");
        const paragraphCommand = editor.commands.get("paragraph");
        if (paragraphCommand?.value) {
            headingSelectedIndex = 0;
        } else if (headingCommand?.value === "heading2") {
            headingSelectedIndex = 1;
        } else if (headingCommand?.value === "heading3") {
            headingSelectedIndex = 2;
        }

        return [
            new TouchBarSegmentedControl({
                segments: [
                    { label: "P" },
                    { label: "H2" },
                    { label: "H3" }
                ],
                change(selectedIndex: number, isSelected: boolean) {
                    switch (selectedIndex) {
                        case 0:
                            editor.execute("paragraph")
                            break;
                        case 1:
                            editor.execute("heading", { value: "heading2" });
                            break;
                        case 2:
                            editor.execute("heading", { value: "heading3" });
                            break;
                    }
                },
                selectedIndex: headingSelectedIndex
            }),
            new TouchBarGroup({
                items: new TouchBar({
                    items: [
                        commandButton("NSTouchBarTextBoldTemplate", "bold"),
                        commandButton("NSTouchBarTextItalicTemplate", "italic"),
                        commandButton("NSTouchBarTextUnderlineTemplate", "underline")
                    ]
                })
            })
        ];
    }

}
