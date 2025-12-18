import { CKTextEditor, ModelTextProxy } from "@triliumnext/ckeditor5";
import { useEffect, useState } from "preact/hooks";

import { t } from "../../services/i18n";
import { useActiveNoteContext, useIsNoteReadOnly, useNoteProperty, useTextEditor } from "../react/hooks";
import RightPanelWidget from "./RightPanelWidget";

interface RawHighlight {
    id: string;
    text: string;
    attrs: Record<string, any>;
}

export default function HighlightsList() {
    const { note, noteContext } = useActiveNoteContext();
    const noteType = useNoteProperty(note, "type");
    const { isReadOnly } = useIsNoteReadOnly(note, noteContext);

    return (
        <RightPanelWidget title={t("highlights_list_2.title")}>
            {((noteType === "text" && isReadOnly) || (noteType === "doc")) && <ReadOnlyTextHighlightsList />}
            {noteType === "text" && !isReadOnly && <EditableTextHighlightsList />}
        </RightPanelWidget>
    );
}

function AbstractHighlightsList({ highlights }: {
    highlights: RawHighlight[]
}) {
    return (
        <span className="highlights-list">
            <ol>
                {highlights.map(highlight => (
                    <li>
                        <span>{highlight.text}</span>
                    </li>
                ))}
            </ol>
        </span>
    );
}

//#region Editable text (CKEditor)
interface CKHighlight extends RawHighlight {
    element: ModelTextProxy;
}

function EditableTextHighlightsList() {
    const { note, noteContext } = useActiveNoteContext();
    const textEditor = useTextEditor(noteContext);
    const [ highlights, setHighlights ] = useState<CKHighlight[]>([]);

    useEffect(() => {
        if (!textEditor) return;

        const highlights = extractHighlightsFromTextEditor(textEditor);
        setHighlights(highlights);
    }, [ textEditor, note ]);

    return <AbstractHighlightsList
        highlights={highlights}
    />;
}

function extractHighlightsFromTextEditor(editor: CKTextEditor) {
    const result: CKHighlight[] = [];
    const root = editor.model.document.getRoot();
    if (!root) return [];

    for (const { item } of editor.model.createRangeIn(root).getWalker({ ignoreElementEnd: true })) {
        if (!item.is('$textProxy')) continue;
        console.log("Got ", item);

        const attrs = {
            bold: item.hasAttribute('bold'),
            italic: item.hasAttribute('italic'),
            underline: item.hasAttribute('underline'),
            color: item.getAttribute('fontColor'),
            background: item.getAttribute('fontBackgroundColor')
        };
        console.log("Got ", attrs);

        if (Object.values(attrs).some(Boolean)) {
            result.push({
                id: crypto.randomUUID(),
                text: item.data,
                attrs,
                element: item
            });
        }
    }

    return result;
}
//#endregion

//#region Read-only text
function ReadOnlyTextHighlightsList() {
    return "Read-only";
}
//#endregion
