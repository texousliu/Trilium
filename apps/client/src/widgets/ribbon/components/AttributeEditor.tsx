import { useContext, useEffect, useRef, useState } from "preact/hooks"
import { AttributeEditor as CKEditorAttributeEditor, MentionFeed, ModelElement, ModelNode, ModelPosition } from "@triliumnext/ckeditor5";
import { t } from "../../../services/i18n";
import server from "../../../services/server";
import note_autocomplete, { Suggestion } from "../../../services/note_autocomplete";
import CKEditor, { CKEditorApi } from "../../react/CKEditor";
import { useLegacyWidget, useTooltip, useTriliumEventBeta } from "../../react/hooks";
import FAttribute from "../../../entities/fattribute";
import attribute_renderer from "../../../services/attribute_renderer";
import FNote from "../../../entities/fnote";
import AttributeDetailWidget from "../../attribute_widgets/attribute_detail";
import attribute_parser, { Attribute } from "../../../services/attribute_parser";
import ActionButton from "../../react/ActionButton";
import { escapeQuotes } from "../../../services/utils";
import { ParentComponent } from "../../react/react_utils";
import Component from "../../../components/component";
import link from "../../../services/link";
import froca from "../../../services/froca";
import contextMenu from "../../../menus/context_menu";
import type { CommandData, FilteredCommandNames } from "../../../components/app_context";
import { AttributeType } from "@triliumnext/commons";
import attributes from "../../../services/attributes";
import note_create from "../../../services/note_create";

type AttributeCommandNames = FilteredCommandNames<CommandData>;

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


export default function AttributeEditor({ note, componentId, notePath }: { note: FNote, componentId: string, notePath?: string | null }) {
    const parentComponent = useContext(ParentComponent);
    injectLoadReferenceLinkTitle(parentComponent, notePath);

    const [ state, setState ] = useState<"normal" | "showHelpTooltip" | "showAttributeDetail">();
    const [ error, setError ] = useState<unknown>();
    const [ needsSaving, setNeedsSaving ] = useState(false);
    const [ initialValue, setInitialValue ] = useState<string>("");

    const lastSavedContent = useRef<string>();
    const currentValueRef = useRef(initialValue);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<CKEditorApi>();

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

        let htmlAttrs = ("<p>" + (await attribute_renderer.renderAttributes(ownedAttributes, true)).html() + "</p>");

        if (saved) {
            lastSavedContent.current = htmlAttrs;
            setNeedsSaving(false);
        }

        if (htmlAttrs.length > 0) {
            htmlAttrs += "&nbsp;";
        }        

        setInitialValue(htmlAttrs);
    }

    function parseAttributes() {
        try {
            return attribute_parser.lexAndParse(getPreprocessedData(currentValueRef.current));
        } catch (e: any) {
            setError(e);
        }
    }

    async function save() {
        const attributes = parseAttributes();
        if (!attributes) {
            // An error occurred and will be reported to the user.
            return;
        }

        await server.put(`notes/${note.noteId}/attributes`, attributes, componentId);
        setNeedsSaving(false);

        // blink the attribute text to give a visual hint that save has been executed
        if (wrapperRef.current) {
            wrapperRef.current.style.opacity = "0";
            setTimeout(() => wrapperRef.current!.style.opacity = "1", 100);
        }
    }

    async function handleAddNewAttributeCommand(command: AttributeCommandNames | undefined) {
        // TODO: Not sure what the relation between FAttribute[] and Attribute[] is.
        const attrs = parseAttributes() as FAttribute[];

        if (!attrs) {
            return;
        }

        let type: AttributeType;
        let name;
        let value;

        if (command === "addNewLabel") {
            type = "label";
            name = "myLabel";
            value = "";
        } else if (command === "addNewRelation") {
            type = "relation";
            name = "myRelation";
            value = "";
        } else if (command === "addNewLabelDefinition") {
            type = "label";
            name = "label:myLabel";
            value = "promoted,single,text";
        } else if (command === "addNewRelationDefinition") {
            type = "label";
            name = "relation:myRelation";
            value = "promoted,single";
        } else {
            return;
        }

        // TODO: Incomplete type
        //@ts-ignore
        attrs.push({
            type,
            name,
            value,
            isInheritable: false
        });

        await renderOwnedAttributes(attrs, false);

        // this.$editor.scrollTop(this.$editor[0].scrollHeight);
        const rect = wrapperRef.current?.getBoundingClientRect();

        setTimeout(() => {
            // showing a little bit later because there's a conflict with outside click closing the attr detail
            attributeDetailWidget.showAttributeDetail({
                allAttributes: attrs,
                attribute: attrs[attrs.length - 1],
                isOwned: true,
                x: rect ? (rect.left + rect.right) / 2 : 0,
                y: rect?.bottom ?? 0,
                focus: "name"
            });
        }, 100);
    }

    // Refresh with note
    function refresh() {
        renderOwnedAttributes(note.getOwnedAttributes(), true);
    }

    useEffect(() => refresh(), [ note ]);
    useTriliumEventBeta("entitiesReloaded", ({ loadResults }) => {
        if (loadResults.getAttributeRows(componentId).find((attr) => attributes.isAffecting(attr, note))) {
            console.log("Trigger due to entities reloaded");
            refresh();
        }
    });

    // Focus on show.
    useEffect(() => {
        setTimeout(() => editorRef.current?.focus(), 0);
    }, []);
    
    return (
        <>
            <div
                ref={wrapperRef}
                style="position: relative; padding-top: 10px; padding-bottom: 10px"
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        // allow autocomplete to fill the result textarea
                        setTimeout(() => save(), 100);
                    }
                }}
            >
                <CKEditor
                    apiRef={editorRef}
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
                        
                        const oldValue = getPreprocessedData(lastSavedContent.current ?? "").trimEnd();
                        const newValue = getPreprocessedData(currentValue ?? "").trimEnd();                
                        setNeedsSaving(oldValue !== newValue);
                        setError(undefined);
                    }}
                    onClick={(e, pos) => {
                        if (pos && pos.textNode && pos.textNode.data) {
                            const clickIndex = getClickIndex(pos);

                            let parsedAttrs: Attribute[];

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
                    onKeyDown={() => attributeDetailWidget.hide()}
                    onBlur={() => save()}
                    disableNewlines disableSpellcheck
                />

                { needsSaving && <ActionButton
                    icon="bx bx-save"
                    className="save-attributes-button"
                    text={escapeQuotes(t("attribute_editor.save_attributes"))}
                    onClick={save}
                /> }

                <ActionButton 
                    icon="bx bx-plus"
                    className="add-new-attribute-button"
                    text={escapeQuotes(t("attribute_editor.add_a_new_attribute"))}
                    onClick={(e) => {
                        // Prevent automatic hiding of the context menu due to the button being clicked.
                        e.stopPropagation();

                        contextMenu.show<AttributeCommandNames>({
                            x: e.pageX,
                            y: e.pageY,
                            orientation: "left",
                            items: [
                                { title: t("attribute_editor.add_new_label"), command: "addNewLabel", uiIcon: "bx bx-hash" },
                                { title: t("attribute_editor.add_new_relation"), command: "addNewRelation", uiIcon: "bx bx-transfer" },
                                { title: "----" },
                                { title: t("attribute_editor.add_new_label_definition"), command: "addNewLabelDefinition", uiIcon: "bx bx-empty" },
                                { title: t("attribute_editor.add_new_relation_definition"), command: "addNewRelationDefinition", uiIcon: "bx bx-empty" }
                            ],
                            selectMenuItemHandler: (item) => handleAddNewAttributeCommand(item.command)
                        });
                    }}
                />

                { error && (
                    <div className="attribute-errors">
                        {typeof error === "object" && "message" in error && typeof error.message === "string" && error.message}
                    </div>
                )}
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

function injectLoadReferenceLinkTitle(component: Component | null, notePath?: string | null) {
    if (!component) return;
    (component as any).loadReferenceLinkTitle = async ($el: JQuery<HTMLElement>, href: string) => {
        const { noteId } = link.parseNavigationStateFromUrl(href);
        const note = noteId ? await froca.getNote(noteId, true) : null;
        const title = note ? note.title : "[missing]";

        $el.text(title);
    }
    (component as any).createNoteForReferenceLink = async (title: string) => {
        let result;
        if (notePath) {
            result = await note_create.createNoteWithTypePrompt(notePath, {
                activate: false,
                title: title
            });
        }

        return result?.note?.getBestNotePathString();
    }
}