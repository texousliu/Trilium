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

    getEditor() {
        return this.watchdog?.editor;
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

    async reinitialize() {
        const data = this.watchdog.editor?.getData();
        await this.reinitializeWithData(data ?? "");
    }

    async reloadTextEditorEvent() {
        await this.reinitialize();
    }


}
