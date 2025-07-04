import { t } from "../../../services/i18n.js";

export default function buildFooter() {
    return /*html*/`\
        <button class="btn btn-sm" style="padding: 0px 10px 0px 10px;" data-trigger-command="addNewRow">
            <span class="bx bx-plus"></span> ${t("table_view.new-row")}
        </button>

        <button class="btn btn-sm" style="padding: 0px 10px 0px 10px;" data-trigger-command="addNoteListItem">
            <span class="bx bx-columns"></span> ${t("table_view.new-column")}
        </button>
    `.trimStart();
}
