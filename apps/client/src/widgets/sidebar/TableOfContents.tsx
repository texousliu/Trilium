import { CKTextEditor, ModelElement } from "@triliumnext/ckeditor5";
import { useEffect, useState } from "preact/hooks";

import FNote from "../../entities/fnote";
import { t } from "../../services/i18n";
import { useActiveNoteContext, useNoteSavedData, useTriliumEvent } from "../react/hooks";
import RightPanelWidget from "./RightPanelWidget";

interface CKHeading {
    level: number;
    text: string;
    element: ModelElement;
}

export default function TableOfContents() {
    const { ntxId } = useActiveNoteContext();
    const [ textEditor, setTextEditor ] = useState<CKTextEditor | null>(null);
    const [ headings, setHeadings ] = useState<CKHeading[]>([]);

    // Populate the cache with the toolbar of every note context.
    useTriliumEvent("textEditorRefreshed", ({ ntxId: eventNtxId, editor }) => {
        if (eventNtxId !== ntxId) return;
        setTextEditor(editor);
    });

    useEffect(() => {
        if (!textEditor) return;
        const headings  = extractTocFromTextEditor(textEditor);
        setHeadings(headings);
    }, [ textEditor ]);

    console.log("Render with ", headings);

    return (
        <RightPanelWidget title={t("toc.table_of_contents")}>
            {headings.map(heading => (
                <li>{heading.text}</li>
            ))}
        </RightPanelWidget>
    );

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
