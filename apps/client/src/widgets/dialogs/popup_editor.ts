import type { EventNames, EventData } from "../../components/app_context.js";
import NoteContext from "../../components/note_context.js";
import { openDialog } from "../../services/dialog.js";
import BasicWidget, { ReactWrappedWidget } from "../basic_widget.js";
import Container from "../containers/container.js";

export default class PopupEditorDialog extends Container<BasicWidget> {

    private noteContext: NoteContext;
    private $modalHeader!: JQuery<HTMLElement>;
    private $modalBody!: JQuery<HTMLElement>;
    private $wrapper!: JQuery<HTMLDivElement>;

    constructor() {
        super();
        this.noteContext =
    }

    doRender() {
        // This will populate this.$widget with the content of the children.
        super.doRender();

        // Now we wrap it in the modal.
        const $newWidget = $(TPL);
        this.$modalHeader = $newWidget.find(".modal-title");
        this.$modalBody = $newWidget.find(".modal-body");
        this.$wrapper = $newWidget.find(".quick-edit-dialog-wrapper");

        const children = this.$widget.children();
        this.$modalHeader.append(children[0]);
        this.$modalBody.append(children.slice(1));
        this.$widget = $newWidget;
        this.setVisibility(false);
    }

    async openInPopupEvent({ noteIdOrPath }: EventData<"openInPopup">) {


        const colorClass = this.noteContext.note?.getColorClass();
        const wrapperElement = this.$wrapper.get(0)!;

        if (colorClass) {
            wrapperElement.className = "quick-edit-dialog-wrapper " + colorClass;
        } else {
            wrapperElement.className = "quick-edit-dialog-wrapper";
        }

        const customHue = getComputedStyle(wrapperElement).getPropertyValue("--custom-color-hue");
        if (customHue) {
            /* Apply the tinted-dialog class only if the custom color CSS class specifies a hue */
            wrapperElement.classList.add("tinted-quick-edit-dialog");
        }

        const activeEl = document.activeElement;
        if (activeEl && "blur" in activeEl) {
            (activeEl as HTMLElement).blur();
        }

        $dialog.on("shown.bs.modal", async () => {
            this.setVisibility(true);
            await this.handleEventInChildren("focusOnDetail", { ntxId: this.noteContext.ntxId });
        });
        $dialog.on("hidden.bs.modal", () => {
            const $typeWidgetEl = $dialog.find(".note-detail-printable");
            if ($typeWidgetEl.length) {
                const typeWidget = glob.getComponentByEl($typeWidgetEl[0]) as ReactWrappedWidget;
                typeWidget.cleanup();
            }

            this.setVisibility(false);
        });
    }

    setVisibility(visible: boolean) {
        const $bodyItems = this.$modalBody.find("> div");
        if (visible) {
            $bodyItems.fadeIn();
            this.$modalHeader.children().show();
            document.body.classList.add("popup-editor-open");

        } else {
            $bodyItems.hide();
            this.$modalHeader.children().hide();
            document.body.classList.remove("popup-editor-open");
        }
    }

    handleEventInChildren<T extends EventNames>(name: T, data: EventData<T>): Promise<unknown[] | unknown> | null {
        // Avoid events related to the current tab interfere with our popup.
        if (["noteSwitched", "noteSwitchedAndActivated", "exportAsPdf", "printActiveNote"].includes(name)) {
            return Promise.resolve();
        }

        // Avoid not showing recent notes when creating a new empty tab.
        if ("noteContext" in data && data.noteContext.ntxId !== "_popup-editor") {
            return Promise.resolve();
        }

        return super.handleEventInChildren(name, data);
    }

}
