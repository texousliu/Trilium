import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks"
import { AttributeEditor as CKEditorAttributeEditor, EditorConfig, MentionFeed } from "@triliumnext/ckeditor5";
import { t } from "../../../services/i18n";
import server from "../../../services/server";
import note_autocomplete, { Suggestion } from "../../../services/note_autocomplete";
import CKEditor from "../../react/CKEditor";

const mentionSetup: MentionFeed[] = [
    {
        marker: "@",
        feed: (queryText) => note_autocomplete.autocompleteSourceForCKEditor(queryText),
        itemRenderer: (_item) => {
            const item = _item as Suggestion;
            const itemElement = document.createElement("button");

            itemElement.innerHTML = `${item.highlightedNotePathTitle} `;

            return itemElement;
        },
        minimumCharacters: 0
    },
    {
        marker: "#",
        feed: async (queryText) => {
            const names = await server.get<string[]>(`attribute-names/?type=label&query=${encodeURIComponent(queryText)}`);

            return names.map((name) => {
                return {
                    id: `#${name}`,
                    name: name
                };
            });
        },
        minimumCharacters: 0
    },
    {
        marker: "~",
        feed: async (queryText) => {
            const names = await server.get<string[]>(`attribute-names/?type=relation&query=${encodeURIComponent(queryText)}`);

            return names.map((name) => {
                return {
                    id: `~${name}`,
                    name: name
                };
            });
        },
        minimumCharacters: 0
    }
];


export default function AttributeEditor() {
    
    const [ attributeDetailVisible, setAttributeDetailVisible ] = useState(false);

    return (
        <div style="position: relative; padding-top: 10px; padding-bottom: 10px">
            <CKEditor
                className="attribute-list-editor"
                tabIndex={200}
                editor={CKEditorAttributeEditor}
                config={{
                    toolbar: { items: [] },
                    placeholder: t("attribute_editor.placeholder"),
                    mention: { feeds: mentionSetup },
                    licenseKey: "GPL"
                }}
                onChange={() => {
                    console.log("Data changed!");
                }}
                disableNewlines disableSpellcheck
            />
        </div>
    )   
}