import { t } from "i18next";
import server from "../../../services/server";
import toast from "../../../services/toast";
import ws from "../../../services/ws";

export async function renameColumn(parentNoteId: string, type: "label" | "relation", originalName: string, newName: string) {
    if (type === "label") {
        return executeBulkAction(parentNoteId, {
            name: "renameLabel",
            oldLabelName: originalName,
            newLabelName: newName
        });
    } else {
        return executeBulkAction(parentNoteId, {
            name: "renameRelation",
            oldRelationName: originalName,
            newRelationName: newName
        });
    }
}

export async function deleteColumn(parentNoteId: string, type: "label" | "relation", columnName: string) {
    if (type === "label") {
        return executeBulkAction(parentNoteId, {
            name: "deleteLabel",
            labelName: columnName
        });
    } else {
        return executeBulkAction(parentNoteId, {
            name: "deleteRelation",
            relationName: columnName
        });
    }
}

async function executeBulkAction(parentNoteId: string, action: {}) {
    await server.post("bulk-action/execute", {
        noteIds: [ parentNoteId ],
        includeDescendants: true,
        actions: [ action ]
    });

    await ws.waitForMaxKnownEntityChangeId();
    toast.showMessage(t("bulk_actions.bulk_actions_executed"), 3000);
}
