import NoteContextAwareWidget from "../note_context_aware_widget.js";

const TPL = /*html*/`\
<div class="classic-toolbar-outer-container">
    <div class="classic-toolbar-widget"></div>
</div>

<style>
    .classic-toolbar-outer-container.visible {
        height: 38px;
        background-color: var(--main-background-color);
        position: relative;
        overflow: visible;
        flex-shrink: 0;
    }

    .classic-toolbar-widget {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 38px;
        overflow: scroll;
        display: flex;
        align-items: flex-end;
        user-select: none;
    }

    .classic-toolbar-widget.dropdown-active {
        height: 50vh;
    }

    .classic-toolbar-widget .ck.ck-toolbar {
        --ck-color-toolbar-background: transparent;
        --ck-color-button-default-background: transparent;
        --ck-color-button-default-disabled-background: transparent;
        position: absolute;
        background-color: transparent;
        border: none;
    }

    .classic-toolbar-widget .ck.ck-button.ck-disabled {
        opacity: 0.3;
    }
</style>
`;

/**
 * Handles the editing toolbar when the CKEditor is in decoupled mode.
 *
 * <p>
 * This toolbar is only enabled if the user has selected the classic CKEditor.
 *
 * <p>
 * The ribbon item is active by default for text notes, as long as they are not in read-only mode.
 */
export default class MobileEditorToolbar extends NoteContextAwareWidget {

    private observer: MutationObserver;
    private $innerWrapper!: JQuery<HTMLElement>;

    constructor() {
        super();
        this.observer = new MutationObserver((e) => this.#onDropdownStateChanged(e));
    }

    get name() {
        return "classicEditor";
    }

    doRender() {
        this.$widget = $(TPL);
        this.$innerWrapper = this.$widget.find(".classic-toolbar-widget");
        this.contentSized();

        // Observe when a dropdown is expanded to apply a style that allows the dropdown to be visible, since we can't have the element both visible and the toolbar scrollable.
        this.observer.disconnect();
        this.observer.observe(this.$widget[0], {
            attributeFilter: ["aria-expanded"],
            subtree: true
        });
    }

    #onDropdownStateChanged(e: MutationRecord[]) {
        const dropdownActive = e.map((e) => (e.target as any).ariaExpanded === "true").reduce((acc, e) => acc && e);
        this.$innerWrapper.toggleClass("dropdown-active", dropdownActive);
    }

    async #shouldDisplay() {
        if (!this.note || this.note.type !== "text") {
            return false;
        }

        if (await this.noteContext?.isReadOnly()) {
            return false;
        }

        return true;
    }

    async refreshWithNote() {
        this.toggleExt(await this.#shouldDisplay());
    }

}
