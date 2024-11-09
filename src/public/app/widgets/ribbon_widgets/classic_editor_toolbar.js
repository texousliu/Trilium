import NoteContextAwareWidget from "../note_context_aware_widget.js";

const TPL = `\
<div class="classic-toolbar-widget"></div>

<style>
    .classic-toolbar-widget {
        --ck-color-toolbar-background: transparent;
        --ck-color-button-default-background: transparent;
        min-height: 39px;
    }

    .classic-toolbar-widget .ck.ck-toolbar {
        border: none;
    }
</style>
`;

/**
 * Handles the editing toolbar when the CKEditor is in decoupled mode.
 * 
 * <p>
 * The ribbon item is active by default for text notes, as long as they are not in read-only mode.
 */
export default class ClassicEditorToolbar extends NoteContextAwareWidget {
    get name() {
        return "classicToolbar";
    }

    doRender() {
        this.$widget = $(TPL);
        this.contentSized();
    }

    async getTitle() {
        return {
            show: await this.#shouldDisplay(),
            activate: true,
            title: "Editor toolbar",
            icon: "bx bx-edit-alt"
        };
    }

    async #shouldDisplay() {
        if (this.note.type !== "text") {
            return false;
        }

        if (await this.noteContext.isReadOnly()) {
            return false;
        }

        return true;
    }

}