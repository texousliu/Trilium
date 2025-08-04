import { useRef } from "preact/hooks";
import { t } from "../../services/i18n";
import { use, useEffect } from "react";
import note_autocomplete, { type Suggestion } from "../../services/note_autocomplete";

interface NoteAutocompleteProps {    
    text?: string;
    allowExternalLinks?: boolean;
    allowCreatingNotes?: boolean;
    onChange?: (suggestion: Suggestion) => void;
}

export default function NoteAutocomplete({ text, allowCreatingNotes, allowExternalLinks, onChange }: NoteAutocompleteProps) {
    const ref = useRef<HTMLInputElement>(null);
    
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