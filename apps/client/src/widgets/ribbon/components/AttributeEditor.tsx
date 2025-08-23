import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks"
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
    const [ attributeDetailVisible, setAttributeDetailVisible ] = useState(false);

    const onClick = useCallback(() => {
        console.log("Clicked");
    }, []);

    useEffect(() => {        
        if (!editorContainerRef.current) return;

        CKEditor.create(editorContainerRef.current, editorConfig).then((textEditor) => {
            function onDataChanged() {
                console.log("Data changed");
            }

            // Prevent newlines
            textEditor.editing.view.document.on(
                "enter",
                (event, data) => {
                    // disable entering new line - see https://github.com/ckeditor/ckeditor5/issues/9422
                    data.preventDefault();
                    event.stop();
                },
                { priority: "high" }
            );

            // disable spellcheck for attribute editor
            const documentRoot = textEditor.editing.view.document.getRoot();
            if (documentRoot) {
                textEditor.editing.view.change((writer) => writer.setAttribute("spellcheck", "false", documentRoot));
            }

            textEditor.model.document.on("change:data", onDataChanged);
        });
    }, []);

    return (
        <div style="position: relative; padding-top: 10px; padding-bottom: 10px" onClick={onClick}>
            <div ref={editorContainerRef} class="attribute-list-editor" tabindex={200} />
        </div>
    )   
}