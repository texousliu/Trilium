import { useRef } from "preact/hooks";
import { t } from "../../services/i18n";
import { useEffect } from "react";
import note_autocomplete, { Options, type Suggestion } from "../../services/note_autocomplete";
import type { RefObject } from "preact";

interface NoteAutocompleteProps {    
    inputRef?: RefObject<HTMLInputElement>;
    text?: string;
    placeholder?: string;
    container?: RefObject<HTMLDivElement>;
    opts?: Omit<Options, "container">;
    onChange?: (suggestion: Suggestion | null) => void;
    onTextChange?: (text: string) => void;
}

export default function NoteAutocomplete({ inputRef: _ref, text, placeholder, onChange, onTextChange, container, opts }: NoteAutocompleteProps) {
    const ref = _ref ?? useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if (!ref.current) return;
        const $autoComplete = $(ref.current);

        // clear any event listener added in previous invocation of this function
        $autoComplete
            .off("autocomplete:noteselected")
            .off("autocomplete:commandselected")

        note_autocomplete.initNoteAutocomplete($autoComplete, {
            ...opts,
            container: container?.current
        });
        if (onChange) {
            const listener = (_e, suggestion) => onChange(suggestion);
            $autoComplete
                .on("autocomplete:noteselected", listener)
                .on("autocomplete:externallinkselected", listener)
                .on("autocomplete:commandselected", listener)
                .on("autocomplete:closed", (e) => {
                    if (!ref.current?.value) {
                        listener(e, null);
                    }
                });
        }
        if (onTextChange) {
            $autoComplete.on("input", () => onTextChange($autoComplete[0].value));
        }
    }, [opts, container?.current]);

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
                placeholder={placeholder ?? t("add_link.search_note")} />
        </div>
    );
}