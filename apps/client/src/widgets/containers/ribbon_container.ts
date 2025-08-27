import NoteContextAwareWidget from "../note_context_aware_widget.js";
import keyboardActionsService from "../../services/keyboard_actions.js";
import attributeService from "../../services/attributes.js";
import type CommandButtonWidget from "../buttons/command_button.js";
import type FNote from "../../entities/fnote.js";
import type { NoteType } from "../../entities/fnote.js";
import type { EventData, EventNames } from "../../components/app_context.js";
import type NoteActionsWidget from "../buttons/note_actions.js";

type ButtonWidget = (CommandButtonWidget | NoteActionsWidget);

export default class RibbonContainer extends NoteContextAwareWidget {

    private lastActiveComponentId?: string | null;
    private lastNoteType?: NoteType;

    private ribbonWidgets: NoteContextAwareWidget[];
    private buttonWidgets: ButtonWidget[];
    private $tabContainer!: JQuery<HTMLElement>;
    private $buttonContainer!: JQuery<HTMLElement>;
    private $bodyContainer!: JQuery<HTMLElement>;

    constructor() {
        super();

        this.contentSized();
        this.ribbonWidgets = [];
        this.buttonWidgets = [];
    }


    async handleEventInChildren<T extends EventNames>(name: T, data: EventData<T>) {
        if (["activeContextChanged", "setNoteContext"].includes(name)) {
            // won't trigger .refresh();
            await super.handleEventInChildren("setNoteContext", data as EventData<"activeContextChanged" | "setNoteContext">);
        } else if (this.isEnabled() || name === "initialRenderComplete") {
            const activeRibbonWidget = this.getActiveRibbonWidget();

            // forward events only to active ribbon tab, inactive ones don't need to be updated
            if (activeRibbonWidget) {
                await activeRibbonWidget.handleEvent(name, data);
            }

            for (const buttonWidget of this.buttonWidgets) {
                await buttonWidget.handleEvent(name, data);
            }
        }
    }

    entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (!this.note) {
            return;
        }

        if (this.noteId && loadResults.isNoteReloaded(this.noteId) && this.lastNoteType !== this.note.type) {
            // note type influences the list of available ribbon tabs the most
            // check for the type is so that we don't update on each title rename
            this.lastNoteType = this.note.type;

            this.refresh();
        } else if (loadResults.getAttributeRows(this.componentId).find((attr) => attributeService.isAffecting(attr, this.note))) {
            this.refreshWithNote(this.note, true);
        }
    }

    async noteTypeMimeChangedEvent() {
        // We are ignoring the event which triggers a refresh since it is usually already done by a different
        // event and causing a race condition in which the items appear twice.
    }

    /**
     * Executed as soon as the user presses the "Edit" floating button in a read-only text note.
     *
     * <p>
     * We need to refresh the ribbon for cases such as the classic editor which relies on the read-only state.
     */
    readOnlyTemporarilyDisabledEvent() {
        this.refresh();
    }

    getActiveRibbonWidget() {
        return this.ribbonWidgets.find((ch) => ch.componentId === this.lastActiveComponentId);
    }
}
