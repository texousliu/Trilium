import NoteContextAwareWidget from "../note_context_aware_widget.js";

const TPL = /*html*/`\
<div class="classic-toolbar-widget"></div>

<style>
    .classic-toolbar-widget {
        --ck-color-toolbar-background: transparent;
        --ck-color-button-default-background: transparent;
        --ck-color-button-default-disabled-background: transparent;
        min-height: 39px;
    }

    .classic-toolbar-widget .ck.ck-toolbar {
        border: none;
    }

    .classic-toolbar-widget .ck.ck-button.ck-disabled {
        opacity: 0.3;
    }

    body.mobile .classic-toolbar-widget {
        display: none;
    }

    body.mobile .classic-toolbar-widget.visible {
        display: flex;
        align-items: flex-end;
        overflow-x: auto;
        overscroll-behavior: none;
        z-index: 500;
        user-select: none;
    }

    body.mobile .classic-toolbar-widget.visible::-webkit-scrollbar {
        height: 3px;
    }

    body.mobile .classic-toolbar-widget.dropdown-active {
        height: 50vh;
    }

    body.mobile .classic-toolbar-widget .ck.ck-toolbar {
        position: absolute;
        background-color: var(--main-background-color);
    }

    body.mobile .classic-toolbar-widget .ck.ck-dropdown__panel {
        bottom: 100% !important;
        top: unset !important;
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

    constructor() {
        super();
        this.observer = new MutationObserver((e) => this.#onDropdownStateChanged(e));
    }

    get name() {
        return "classicEditor";
    }

    doRender() {
        this.$widget = $(TPL);
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
        this.$widget[0].classList.toggle("dropdown-active", dropdownActive);
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
