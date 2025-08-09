import { t } from "../../../services/i18n.js";
import AbstractBulkAction, { ActionDefinition } from "../abstract_bulk_action.js";
import BulkAction, { BulkActionText } from "../BulkAction.jsx";
import NoteAutocomplete from "../../react/NoteAutocomplete.jsx";
import { useEffect, useState } from "preact/hooks";
import { useSpacedUpdate } from "../../react/hooks.jsx";
import { Suggestion } from "../../../services/note_autocomplete.js";

function MoveNoteBulkActionComponent({ bulkAction, actionDef }: { bulkAction: AbstractBulkAction, actionDef: ActionDefinition }) {
    const [ suggestion, setSuggestion ] = useState<Suggestion>();
    const spacedUpdate = useSpacedUpdate(() => {
        const noteId = suggestion?.notePath?.split("/")?.at(-1);
        return bulkAction.saveAction({ targetParentNoteId: noteId })
    });
    useEffect(() => spacedUpdate.scheduleUpdate(), [ suggestion ]);

    return (
        <BulkAction
            bulkAction={bulkAction}
            label={t("move_note.move_note")}
            helpText={<>
                <p>${t("move_note.on_all_matched_notes")}:</p>

                <ul style="margin-bottom: 0;">
                    <li>${t("move_note.move_note_new_parent")}</li>
                    <li>${t("move_note.clone_note_new_parent")}</li>
                    <li>${t("move_note.nothing_will_happen")}</li>
                </ul>
            </>}
        >
            <BulkActionText text={t("move_note.to")} />

            <NoteAutocomplete
                placeholder={t("move_note.target_parent_note")}
                onChange={setSuggestion}
            />
        </BulkAction>
    )
}

export default class MoveNoteBulkAction extends AbstractBulkAction {
    static get actionName() {
        return "moveNote";
    }
    static get actionTitle() {
        return t("move_note.move_note");
    }

    doRender() {
        return <MoveNoteBulkActionComponent bulkAction={this} actionDef={this.actionDef} />
    }
}
