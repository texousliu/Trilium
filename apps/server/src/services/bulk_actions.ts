import log from "./log.js";
import becca from "../becca/becca.js";
import cloningService from "./cloning.js";
import branchService from "./branches.js";
import { randomString } from "./utils.js";
import eraseService from "./erase.js";
import type BNote from "../becca/entities/bnote.js";

interface AddLabelAction {
    labelName: string;
    labelValue?: string;
}

interface AddRelationAction {
    relationName: string;
    targetNoteId: string;
}

interface DeleteRevisionsAction {}
interface DeleteLabelAction {
    labelName: string;
}

interface DeleteRelationAction {
    relationName: string;
}

interface RenameNoteAction {
    newTitle: string;
}

interface RenameLabelAction {
    oldLabelName: string;
    newLabelName: string;
}

interface RenameRelationAction {
    oldRelationName: string;
    newRelationName: string;
}

interface UpdateLabelValueAction {
    labelName: string;
    labelValue: string;
}

interface UpdateRelationTargetAction {
    relationName: string;
    targetNoteId: string;
}

interface MoveNoteAction {
    targetParentNoteId: string;
}

interface ExecuteScriptAction {
    script: string;
}

interface DeleteNoteAction { }

type BulkAction = AddLabelAction | AddRelationAction | DeleteNoteAction | DeleteRevisionsAction | DeleteLabelAction | DeleteRelationAction | RenameNoteAction | RenameLabelAction | RenameRelationAction | UpdateLabelValueAction | UpdateRelationTargetAction | MoveNoteAction | ExecuteScriptAction;

type ActionHandler<T> = (action: T, note: BNote) => void;

type ActionHandlerMap = {
    [K in keyof BulkAction]: ActionHandler<K>;
}

const ACTION_HANDLERS: ActionHandlerMap = {
    addLabel: (action: AddLabelAction, note: BNote) => {
        note.addLabel(action.labelName, action.labelValue);
    },
    addRelation: (action: AddRelationAction, note: BNote) => {
        note.addRelation(action.relationName, action.targetNoteId);
    },
    deleteNote: (action: DeleteNoteAction, note: BNote) => {
        const deleteId = `searchbulkaction-${randomString(10)}`;

        note.deleteNote(deleteId);
    },
    deleteRevisions: (action: DeleteRevisionsAction, note: BNote) => {
        const revisionIds = note
            .getRevisions()
            .map((rev) => rev.revisionId)
            .filter((rev) => !!rev) as string[];
        eraseService.eraseRevisions(revisionIds);
    },
    deleteLabel: (action: DeleteLabelAction, note: BNote) => {
        for (const label of note.getOwnedLabels(action.labelName)) {
            label.markAsDeleted();
        }
    },
    deleteRelation: (action: DeleteRelationAction, note: BNote) => {
        for (const relation of note.getOwnedRelations(action.relationName)) {
            relation.markAsDeleted();
        }
    },
    renameNote: (action: RenameNoteAction, note: BNote) => {
        // "officially" injected value:
        // - note

        const newTitle = eval(`\`${action.newTitle}\``);

        if (note.title !== newTitle) {
            note.title = newTitle;
            note.save();
        }
    },
    renameLabel: (action: RenameLabelAction, note: BNote) => {
        for (const label of note.getOwnedLabels(action.oldLabelName)) {
            // attribute name is immutable, renaming means delete old + create new
            const newLabel = label.createClone("label", action.newLabelName, label.value);

            newLabel.save();
            label.markAsDeleted();
        }
    },
    renameRelation: (action: RenameRelationAction, note: BNote) => {
        for (const relation of note.getOwnedRelations(action.oldRelationName)) {
            // attribute name is immutable, renaming means delete old + create new
            const newRelation = relation.createClone("relation", action.newRelationName, relation.value);

            newRelation.save();
            relation.markAsDeleted();
        }
    },
    updateLabelValue: (action: UpdateLabelValueAction, note: BNote) => {
        for (const label of note.getOwnedLabels(action.labelName)) {
            label.value = action.labelValue;
            label.save();
        }
    },
    updateRelationTarget: (action: UpdateRelationTargetAction, note: BNote) => {
        for (const relation of note.getOwnedRelations(action.relationName)) {
            relation.value = action.targetNoteId;
            relation.save();
        }
    },
    moveNote: (action: MoveNoteAction, note: BNote) => {
        const targetParentNote = becca.getNote(action.targetParentNoteId);

        if (!targetParentNote) {
            log.info(`Cannot execute moveNote because note ${action.targetParentNoteId} doesn't exist.`);

            return;
        }

        let res;

        if (note.getParentBranches().length > 1) {
            res = cloningService.cloneNoteToParentNote(note.noteId, action.targetParentNoteId);
        } else {
            res = branchService.moveBranchToNote(note.getParentBranches()[0], action.targetParentNoteId);
        }

        if ("success" in res && !res.success) {
            log.info(`Moving/cloning note ${note.noteId} to ${action.targetParentNoteId} failed with error ${JSON.stringify(res)}`);
        }
    },
    executeScript: (action: ExecuteScriptAction, note: BNote) => {
        if (!action.script || !action.script.trim()) {
            log.info("Ignoring executeScript since the script is empty.");
            return;
        }

        const scriptFunc = new Function("note", action.script);
        scriptFunc(note);

        note.save();
    }
};

function getActions(note: BNote) {
    return note
        .getLabels("action")
        .map((actionLabel) => {
            let action;

            try {
                action = JSON.parse(actionLabel.value);
            } catch (e) {
                log.error(`Cannot parse '${actionLabel.value}' into search action, skipping.`);
                return null;
            }

            if (!(action.name in ACTION_HANDLERS)) {
                log.error(`Cannot find '${action.name}' search action handler, skipping.`);
                return null;
            }

            return action;
        })
        .filter((a) => !!a);
}

function executeActions(note: BNote, searchResultNoteIds: string[] | Set<string>) {
    const actions = getActions(note);

    for (const resultNoteId of searchResultNoteIds) {
        const resultNote = becca.getNote(resultNoteId);

        if (!resultNote) {
            continue;
        }

        for (const action of actions) {
            try {
                log.info(`Applying action handler to note ${resultNote.noteId}: ${JSON.stringify(action)}`);

                ACTION_HANDLERS[action.name](action, resultNote);
            } catch (e: any) {
                log.error(`ExecuteScript search action failed with ${e.message}`);
            }
        }
    }
}

export default {
    executeActions
};
