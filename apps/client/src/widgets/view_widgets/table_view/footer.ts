import FNote from "../../../entities/fnote.js";
import { t } from "../../../services/i18n.js";

function shouldDisplayFooter(parentNote: FNote) {
    return (parentNote.type !== "search");
}

export default function buildFooter(parentNote: FNote) {
    if (!shouldDisplayFooter(parentNote)) {
        return undefined;
    }

    return /*html*/`\
        <button class="btn btn-sm" style="padding: 0px 10px 0px 10px;" data-trigger-command="addNewRow">
            <span class="bx bx-plus"></span> ${t("table_view.new-row")}
        </button>

        <button class="btn btn-sm" style="padding: 0px 10px 0px 10px;" data-trigger-command="addNewTableColumn">
            <span class="bx bx-columns"></span> ${t("table_view.new-column")}
        </button>
    `.trimStart();
}
