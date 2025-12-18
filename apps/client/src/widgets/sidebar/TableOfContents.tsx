import "./TableOfContents.css";

import { CKTextEditor, ModelElement } from "@triliumnext/ckeditor5";
import clsx from "clsx";
import { useEffect, useState } from "preact/hooks";

import { t } from "../../services/i18n";
import { useActiveNoteContext, useContentElement, useIsNoteReadOnly, useNoteProperty, useTextEditor } from "../react/hooks";
import Icon from "../react/Icon";
import RightPanelWidget from "./RightPanelWidget";

//#region Generic impl.
interface RawHeading {
    id: string;
    level: number;
    text: string;
}

interface HeadingsWithNesting extends RawHeading {
    children: HeadingsWithNesting[];
}

export default function TableOfContents() {
    const { note, noteContext } = useActiveNoteContext();
    const noteType = useNoteProperty(note, "type");
    const { isReadOnly } = useIsNoteReadOnly(note, noteContext);

    return (
        <RightPanelWidget title={t("toc.table_of_contents")}>
            {noteType === "text" && (
                isReadOnly ? <ReadOnlyTextTableOfContents /> : <EditableTextTableOfContents />
            )}
        </RightPanelWidget>
    );
}

function AbstractTableOfContents({ headings }: {
    headings: RawHeading[];
}) {
    const nestedHeadings = buildHeadingTree(headings);
    return (
        <span className="toc">
            <ol>
                {nestedHeadings.map(heading => <TableOfContentsHeading key={heading.id} heading={heading} />)}
            </ol>
        </span>
    );
}

function TableOfContentsHeading({ heading }: { heading: HeadingsWithNesting }) {
    const [ collapsed, setCollapsed ] = useState(false);
    return (
        <>
            <li className={clsx(collapsed && "collapsed")}>
                {heading.children.length > 0 && (
                    <Icon
                        className="collapse-button"
                        icon="bx bx-chevron-down"
                        onClick={() => setCollapsed(!collapsed)}
                    />
                )}
                <span className="item-content">{heading.text}</span>
            </li>
            {heading.children && (
                <ol>
                    {heading.children.map(heading => <TableOfContentsHeading key={heading.id} heading={heading} />)}
                </ol>
            )}
        </>
    );
}

function buildHeadingTree(headings: RawHeading[]): HeadingsWithNesting[] {
    const root: HeadingsWithNesting = { level: 0, text: "", children: [], id: "_root" };
    const stack: HeadingsWithNesting[] = [root];

    for (const h of headings) {
        const node: HeadingsWithNesting = { ...h, children: [] };

        // Pop until we find a parent with lower level
        while (stack.length > 1 && stack[stack.length - 1].level >= h.level) {
            stack.pop();
        }

        // Attach to current parent
        stack[stack.length - 1].children.push(node);

        // This node becomes the new parent
        stack.push(node);
    }

    return root.children;
}
//#endregion

//#region Editable text (CKEditor)
const TOC_ID = 'tocId';

interface CKHeading extends RawHeading {
    element: ModelElement;
}

function EditableTextTableOfContents() {
    const { note, noteContext } = useActiveNoteContext();
    const textEditor = useTextEditor(noteContext);
    const [ headings, setHeadings ] = useState<CKHeading[]>([]);

    useEffect(() => {
        if (!textEditor) return;
        const headings = extractTocFromTextEditor(textEditor);

        // React to changes.
        const changeCallback = () => {
            const changes = textEditor.model.document.differ.getChanges();

            const affectsHeadings = changes.some( change => {
                return (
                    change.type === 'insert' || change.type === 'remove' || (change.type === 'attribute' && change.attributeKey === 'headingLevel')
                );
            });
            if (affectsHeadings) {
                setHeadings(extractTocFromTextEditor(textEditor));
            }
        };

        textEditor.model.document.on("change:data", changeCallback);
        setHeadings(headings);

        return () => textEditor.model.document.off("change:data", changeCallback);
    }, [ textEditor, note ]);

    return <AbstractTableOfContents headings={headings} />;
}

function extractTocFromTextEditor(editor: CKTextEditor) {
    const headings: CKHeading[] = [];

    const root = editor.model.document.getRoot();
    if (!root) return [];

    editor.model.change(writer => {
        for (const { type, item } of editor.model.createRangeIn(root).getWalker()) {
            if (type !== "elementStart" || !item.is('element') || !item.name.startsWith('heading')) continue;

            const level = Number(item.name.replace( 'heading', '' ));
            const text = Array.from( item.getChildren() )
                .map( c => c.is( '$text' ) ? c.data : '' )
                .join( '' );

            // Assign a unique ID
            let tocId = item.getAttribute(TOC_ID) as string | undefined;
            if (!tocId) {
                tocId = crypto.randomUUID();
                writer.setAttribute(TOC_ID, tocId, item);
            }

            headings.push({ level, text, element: item, id: tocId });
        }
    });

    return headings;
}
//#endregion

function ReadOnlyTextTableOfContents() {
    const { noteContext } = useActiveNoteContext();
    const contentEl = useContentElement(noteContext);
    const headings = extractTocFromStaticHtml(contentEl);

    return <AbstractTableOfContents headings={headings} />;
}

function extractTocFromStaticHtml(el: HTMLElement | null) {
    if (!el) return [];

    const headings: RawHeading[] = [];
    for (const headingEl of el.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
        headings.push({
            id: crypto.randomUUID(),
            level: parseInt(headingEl.tagName.substring(1), 10),
            text: headingEl.textContent
        });
    }

    return headings;
}
