import { CKTextEditor, ModelElement } from "@triliumnext/ckeditor5";
import { useEffect, useState } from "preact/hooks";

import { t } from "../../services/i18n";
import { useActiveNoteContext, useIsNoteReadOnly, useNoteProperty, useTextEditor, useTriliumEvent } from "../react/hooks";
import RightPanelWidget from "./RightPanelWidget";

interface CKHeading {
    level: number;
    text: string;
    element: ModelElement;
}

export default function TableOfContents() {
    const { note, noteContext } = useActiveNoteContext();
    const noteType = useNoteProperty(note, "type");
    const { isReadOnly } = useIsNoteReadOnly(note, noteContext);

    return (
        <RightPanelWidget title={t("toc.table_of_contents")}>
            {noteType === "text" && !isReadOnly && <EditableTextTableOfContents />}
        </RightPanelWidget>
    );
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

function AbstractTableOfContents({ headings }: {
    headings: {
        level: number;
        text: string;
    }[];
}) {
    return headings.map(heading => (
        <li>{heading.text}</li>
    ));
}

function extractTocFromTextEditor(editor: CKTextEditor) {
    const headings: CKHeading[] = [];

    const root = editor.model.document.getRoot();
    if (!root) return [];

    for (const { type, item } of editor.model.createRangeIn(root).getWalker()) {
        if (type !== "elementStart" || !item.is('element') || !item.name.startsWith('heading')) continue;

        const level = Number(item.name.replace( 'heading', '' ));
        const text = Array.from( item.getChildren() )
            .map( c => c.is( '$text' ) ? c.data : '' )
            .join( '' );

        headings.push({ level, text, element: item });
    }

    return headings;
}
