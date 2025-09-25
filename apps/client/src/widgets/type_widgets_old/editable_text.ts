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


export default class EditableTextTypeWidget extends AbstractTextTypeWidget {

    private contentLanguage?: string | null;
    private watchdog!: EditorWatchdog<ClassicEditor | PopupEditor>;

    private $editor!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);
        this.$editor = this.$widget.find(".note-detail-editable-text-editor");

        this.initialized = this.initEditor();

        this.setupImageOpening(false);

        super.doRender();
    }

    async initEditor() {
        this.watchdog.setCreator(async (_, editorConfig) => {
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

    show() { }

    getEditor() {
        return this.watchdog?.editor;
    }

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

    async reinitialize() {
        const data = this.watchdog.editor?.getData();
        await this.reinitializeWithData(data ?? "");
    }

    async reloadTextEditorEvent() {
        await this.reinitialize();
    }

    async entitiesReloadedEvent(e: EventData<"entitiesReloaded">) {
        await super.entitiesReloadedEvent(e);

        if (updateTemplateCache(e.loadResults)) {
            await this.reinitialize();
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
