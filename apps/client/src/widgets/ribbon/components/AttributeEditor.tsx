import { useEffect, useRef, useState } from "preact/hooks"
import { AttributeEditor as CKEditorAttributeEditor, MentionFeed } from "@triliumnext/ckeditor5";
import { t } from "../../../services/i18n";
import server from "../../../services/server";
import note_autocomplete, { Suggestion } from "../../../services/note_autocomplete";
import CKEditor from "../../react/CKEditor";
import { useTooltip } from "../../react/hooks";
import FAttribute from "../../../entities/fattribute";
import attribute_renderer from "../../../services/attribute_renderer";
import FNote from "../../../entities/fnote";

const HELP_TEXT = `
<p>${t("attribute_editor.help_text_body1")}</p>

<p>${t("attribute_editor.help_text_body2")}</p>

<p>${t("attribute_editor.help_text_body3")}</p>`;

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


export default function AttributeEditor({ note }: { note: FNote }) {

    const [ state, setState ] = useState<"normal" | "showHelpTooltip" | "showAttributeDetail">();
    const [ currentValue, setCurrentValue ] = useState<string>("");
    const wrapperRef = useRef<HTMLDivElement>(null);
    const { showTooltip, hideTooltip } = useTooltip(wrapperRef, {
        trigger: "focus",
        html: true,
        title: HELP_TEXT,
        placement: "bottom",
        offset: "0,30"
    });

    useEffect(() => {
        if (state === "showHelpTooltip") {
            showTooltip();
        } else {
            hideTooltip();
        }
    }, [ state ]);

    async function renderOwnedAttributes(ownedAttributes: FAttribute[], saved: boolean) {
        // attrs are not resorted if position changes after the initial load
        ownedAttributes.sort((a, b) => a.position - b.position);

        let htmlAttrs = (await attribute_renderer.renderAttributes(ownedAttributes, true)).html();

        if (htmlAttrs.length > 0) {
            htmlAttrs += "&nbsp;";
        }

        setCurrentValue(htmlAttrs);
    }

    useEffect(() => {
        renderOwnedAttributes(note.getOwnedAttributes(), true);
    }, [ note ]);
    
    return (
        <div ref={wrapperRef} style="position: relative; padding-top: 10px; padding-bottom: 10px">
            <CKEditor
                className="attribute-list-editor"
                tabIndex={200}
                editor={CKEditorAttributeEditor}
                currentValue={currentValue}
                config={{
                    toolbar: { items: [] },
                    placeholder: t("attribute_editor.placeholder"),
                    mention: { feeds: mentionSetup },
                    licenseKey: "GPL"
                }}
                onChange={() => {
                    console.log("Data changed!");
                }}
                onClick={(pos) => {
                    if (pos && pos.textNode && pos.textNode.data) {
                        setState("showAttributeDetail")
                    } else {
                        setState("showHelpTooltip");
                    }
                }}
                disableNewlines disableSpellcheck
            />
        </div>
    )   
}