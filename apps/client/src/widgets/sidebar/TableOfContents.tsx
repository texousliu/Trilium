import { CKTextEditor, ModelElement } from "@triliumnext/ckeditor5";
import { useEffect, useState } from "preact/hooks";

import { t } from "../../services/i18n";
import { useActiveNoteContext, useTriliumEvent } from "../react/hooks";
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
    }, [ textEditor ]);

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
