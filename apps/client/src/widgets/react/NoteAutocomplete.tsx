import { useRef } from "preact/hooks";
import { t } from "../../services/i18n";
import { useEffect } from "react";
import note_autocomplete, { type Suggestion } from "../../services/note_autocomplete";
import type { RefObject } from "preact";

interface NoteAutocompleteProps {    
    inputRef?: RefObject<HTMLInputElement>;
    text?: string;
    allowExternalLinks?: boolean;
    allowCreatingNotes?: boolean;
    onChange?: (suggestion: Suggestion) => void;
}

export default function NoteAutocomplete({ inputRef: _ref, text, allowCreatingNotes, allowExternalLinks, onChange }: NoteAutocompleteProps) {
    const ref = _ref ?? useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if (!ref.current) return;
        const $autoComplete = $(ref.current);

        note_autocomplete.initNoteAutocomplete($autoComplete, {
            allowExternalLinks,
            allowCreatingNotes
        });
        if (onChange) {
            $autoComplete.on("autocomplete:noteselected", (_e, suggestion) => onChange(suggestion));
            $autoComplete.on("autocomplete:externallinkselected", (_e, suggestion) => onChange(suggestion));
        }        
    }, [allowExternalLinks, allowCreatingNotes]);

    useEffect(() => {
        if (!ref.current) return;
        if (text) {
            const $autoComplete = $(ref.current);
            note_autocomplete.setText($autoComplete, text);
        } else {
            ref.current.value = "";
        }
    }, [text]);

    return (
        <div className="input-group">
            <input
                ref={ref}
                className="note-autocomplete form-control"
                placeholder={t("add_link.search_note")} />
        </div>
    );
}