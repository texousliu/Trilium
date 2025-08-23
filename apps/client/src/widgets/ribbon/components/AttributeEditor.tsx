import { useEffect, useRef, useState } from "preact/hooks"
import { AttributeEditor as CKEditorAttributeEditor, MentionFeed, ModelElement, ModelNode, ModelPosition } from "@triliumnext/ckeditor5";
import { t } from "../../../services/i18n";
import server from "../../../services/server";
import note_autocomplete, { Suggestion } from "../../../services/note_autocomplete";
import CKEditor from "../../react/CKEditor";
import { useLegacyWidget, useTooltip } from "../../react/hooks";
import FAttribute from "../../../entities/fattribute";
import attribute_renderer from "../../../services/attribute_renderer";
import FNote from "../../../entities/fnote";
import AttributeDetailWidget from "../../attribute_widgets/attribute_detail";
import attribute_parser, { Attribute } from "../../../services/attribute_parser";

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
    const [ initialValue, setInitialValue ] = useState<string>("");
    const currentValueRef = useRef(initialValue);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const { showTooltip, hideTooltip } = useTooltip(wrapperRef, {
        trigger: "focus",
        html: true,
        title: HELP_TEXT,
        placement: "bottom",
        offset: "0,30"
    });

    const [ attributeDetailWidgetEl, attributeDetailWidget ] = useLegacyWidget(() => new AttributeDetailWidget());

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

        setInitialValue(htmlAttrs);
    }

    useEffect(() => {
        renderOwnedAttributes(note.getOwnedAttributes(), true);
    }, [ note ]);
    
    return (
        <>
            <div ref={wrapperRef} style="position: relative; padding-top: 10px; padding-bottom: 10px">
                <CKEditor
                    className="attribute-list-editor"
                    tabIndex={200}
                    editor={CKEditorAttributeEditor}
                    currentValue={initialValue}
                    config={{
                        toolbar: { items: [] },
                        placeholder: t("attribute_editor.placeholder"),
                        mention: { feeds: mentionSetup },
                        licenseKey: "GPL"
                    }}
                    onChange={(currentValue) => {
                        currentValueRef.current = currentValue ?? "";
                    }}
                    onClick={(e, pos) => {
                        if (pos && pos.textNode && pos.textNode.data) {
                            const clickIndex = getClickIndex(pos);

                            let parsedAttrs;

                            try {
                                parsedAttrs = attribute_parser.lexAndParse(getPreprocessedData(currentValueRef.current), true);
                            } catch (e) {
                                // the input is incorrect because the user messed up with it and now needs to fix it manually
                                return null;
                            }

                            let matchedAttr: Attribute | null = null;

                            for (const attr of parsedAttrs) {
                                if (attr.startIndex && clickIndex > attr.startIndex && attr.endIndex && clickIndex <= attr.endIndex) {
                                    matchedAttr = attr;
                                    break;
                                }
                            }

                            setTimeout(() => {
                                if (matchedAttr) {
                                    attributeDetailWidget.showAttributeDetail({
                                        allAttributes: parsedAttrs,
                                        attribute: matchedAttr,
                                        isOwned: true,
                                        x: e.pageX,
                                        y: e.pageY
                                    });
                                    setState("showAttributeDetail");                                    
                                } else {
                                    setState("showHelpTooltip");
                                }
                            }, 100);
                        } else {
                            setState("showHelpTooltip");
                        }
                    }}
                    disableNewlines disableSpellcheck
                />
            </div>

            {attributeDetailWidgetEl}
        </>
    )   
}

function getPreprocessedData(currentValue: string) {
    const str = currentValue
        .replace(/<a[^>]+href="(#[A-Za-z0-9_/]*)"[^>]*>[^<]*<\/a>/g, "$1")
        .replace(/&nbsp;/g, " "); // otherwise .text() below outputs non-breaking space in unicode

    return $("<div>").html(str).text();
}

function getClickIndex(pos: ModelPosition) {
    let clickIndex = pos.offset - (pos.textNode?.startOffset ?? 0);

    let curNode: ModelNode | Text | ModelElement | null = pos.textNode;

    while (curNode?.previousSibling) {
        curNode = curNode.previousSibling;

        if ((curNode as ModelElement).name === "reference") {
            clickIndex += (curNode.getAttribute("href") as string).length + 1;
        } else if ("data" in curNode) {
            clickIndex += (curNode.data as string).length;
        }
    }

    return clickIndex;
}