import { t } from "i18next";
import attributes from "../../../services/attributes";
import froca from "../../../services/froca";
import server from "../../../services/server";
import toast from "../../../services/toast";
import ws from "../../../services/ws";

export async function renameColumn(parentNoteId: string, type: "label" | "relation", originalName: string, newName: string) {
    const bulkActionNote = await froca.getNote("_bulkAction");
    if (!bulkActionNote) {
        console.warn("Bulk action note not found");
        return;
    }

    if (type === "label") {
        attributes.setLabel("_bulkAction", "action", JSON.stringify({
            name: "renameLabel",
            oldLabelName: originalName,
            newLabelName: newName
        }));
        await server.post("bulk-action/execute", {
            noteIds: [ parentNoteId ],
            includeDescendants: true
        });

        await ws.waitForMaxKnownEntityChangeId();
        toast.showMessage(t("bulk_actions.bulk_actions_executed"), 3000);
    } else {
        console.warn("Renaming relation columns is not supported yet");
        return;
    }
}
