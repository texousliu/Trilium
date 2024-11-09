import NoteContextAwareWidget from "../note_context_aware_widget.js";

const TPL = `\
<div class="classic-toolbar-widget">
    Classic toolbar goes here.
</div>

<style>
    .classic-toolbar-widget {
        --ck-color-toolbar-background: transparent;
        --ck-color-button-default-background: transparent;
    }

    .classic-toolbar-widget .ck.ck-toolbar {
        border: none;
    }
</style>
`;

export default class ClassicEditorToolbar extends NoteContextAwareWidget {
    get name() {
        return "classicToolbar";
    }

    doRender() {
        this.$widget = $(TPL);
        this.contentSized();
    }

    getTitle(note) {
        return {
            show: true,
            activate: true,
            title: "Editor toolbar",
            icon: "bx bx-edit-alt"
        };
    }

}