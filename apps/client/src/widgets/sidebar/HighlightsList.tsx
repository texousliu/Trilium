import { CKTextEditor, ModelText } from "@triliumnext/ckeditor5";
import { useCallback, useEffect, useState } from "preact/hooks";

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

function AbstractHighlightsList<T extends RawHighlight>({ highlights, scrollToHighlight }: {
    highlights: T[],
    scrollToHighlight(highlight: T): void;
}) {
    return (
        <span className="highlights-list">
            <ol>
                {highlights.map(highlight => (
                    <li onClick={() => scrollToHighlight(highlight)}>
                        <span>{highlight.text}</span>
                    </li>
                ))}
            </ol>
        </span>
    );
}

//#region Editable text (CKEditor)
interface CKHighlight extends RawHighlight {
    textNode: ModelText;
    offset: number | null;
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

    const scrollToHeading = useCallback((highlight: CKHighlight) => {
        if (!textEditor) return;

        const modelPos = textEditor.model.createPositionAt(highlight.textNode, "before");
        const viewPos = textEditor.editing.mapper.toViewPosition(modelPos);
        const domConverter = textEditor.editing.view.domConverter;
        const domPos = domConverter.viewPositionToDom(viewPos);

        if (!domPos) return;
        (domPos.parent as HTMLElement).scrollIntoView();
    }, [ textEditor ]);

    return <AbstractHighlightsList
        highlights={highlights}
        scrollToHighlight={scrollToHeading}
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
                textNode: item.textNode,
                offset: item.startOffset
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
