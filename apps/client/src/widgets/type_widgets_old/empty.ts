import noteAutocompleteService from "../../services/note_autocomplete.js";
import TypeWidget from "./type_widget.js";
import appContext from "../../components/app_context.js";
import searchService from "../../services/search.js";
import { t } from "../../services/i18n.js";

const TPL = /*html*/`
`;

export default class EmptyTypeWidget extends TypeWidget {

    private $autoComplete!: JQuery<HTMLElement>;
    private $results!: JQuery<HTMLElement>;
    private $workspaceNotes!: JQuery<HTMLElement>;

    static getType() {
        return "empty";
    }

    doRender() {
        // FIXME: this might be optimized - cleaned up after use since it's always used only for new tab

        this.$widget = $(TPL);
        this.$autoComplete = this.$widget.find(".note-autocomplete");
        this.$results = this.$widget.find(".note-detail-empty-results");
        this.$workspaceNotes = this.$widget.find(".workspace-notes");

        super.doRender();
    }

    async doRefresh() {
        const workspaceNotes = await searchService.searchForNotes("#workspace #!template");

        this.$workspaceNotes.empty();

        for (const workspaceNote of workspaceNotes) {
            this.$workspaceNotes.append(
                $('<div class="workspace-note">')
                    .append($("<div>").addClass(`${workspaceNote.getIcon()} workspace-icon`))
                    .append($("<div>").text(workspaceNote.title))
                    .attr("title", t("empty.enter_workspace", { title: workspaceNote.title }))
                    .on("click", () => this.triggerCommand("hoistNote", { noteId: workspaceNote.noteId }))
            );
        }

        this.$autoComplete.trigger("focus").trigger("select");
    }
}
