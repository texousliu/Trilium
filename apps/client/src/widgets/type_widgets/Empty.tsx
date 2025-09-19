import { useEffect, useRef } from "preact/hooks";
import { t } from "../../services/i18n";
import FormGroup from "../react/FormGroup";
import NoteAutocomplete from "../react/NoteAutocomplete";
import "./Empty.css";
import { refToJQuerySelector } from "../react/react_utils";
import note_autocomplete from "../../services/note_autocomplete";
import appContext from "../../components/app_context";

export default function Empty() {
    return (
        <div class="note-detail-empty note-detail-printable">
            <div class="workspace-notes"></div>

            <NoteSearch />
        </div>
    )
}

function NoteSearch() {
    const resultsContainerRef = useRef<HTMLDivElement>(null);
    const autocompleteRef = useRef<HTMLInputElement>(null);

    // Show recent notes.
    useEffect(() => {
        const $autoComplete = refToJQuerySelector(autocompleteRef);
        note_autocomplete.showRecentNotes($autoComplete);
    }, []);

    return (
        <>
            <FormGroup name="empty-tab-search" label={t("empty.open_note_instruction")} className="empty-tab-search">
                <NoteAutocomplete
                    placeholder={t("empty.search_placeholder")}
                    container={resultsContainerRef}
                    inputRef={autocompleteRef}
                    opts={{
                        hideGoToSelectedNoteButton: true,
                        allowCreatingNotes: true,
                        allowJumpToSearchNotes: true,
                    }}
                    onChange={suggestion => {
                        if (!suggestion?.notePath) {
                            return false;
                        }

                        const activeContext = appContext.tabManager.getActiveContext();
                        if (activeContext) {
                            activeContext.setNote(suggestion.notePath);
                        }
                    }}
                />
            </FormGroup>
            <div ref={resultsContainerRef} className="note-detail-empty-results" />
        </>
    );
}
