import { useEffect, useRef } from "preact/hooks"
import { AttributeEditor as CKEditor, EditorConfig, MentionFeed } from "@triliumnext/ckeditor5";
import { t } from "../../../services/i18n";
import server from "../../../services/server";
import note_autocomplete, { Suggestion } from "../../../services/note_autocomplete";

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

const editorConfig: EditorConfig = {
    toolbar: {
        items: []
    },
    placeholder: t("attribute_editor.placeholder"),
    mention: {
        feeds: mentionSetup
    },
    licenseKey: "GPL"
};

export default function AttributeEditor() {
    const editorContainerRef = useRef<HTMLDivElement>(null);    

    useEffect(() => {        
        if (!editorContainerRef.current) return;

        CKEditor.create(editorContainerRef.current, editorConfig).then((textEditor) => {

        });
    }, []);

    return (
        <div style="position: relative; padding-top: 10px; padding-bottom: 10px">
            <div ref={editorContainerRef} class="attribute-list-editor" tabindex={200} />
        </div>
    )   
}