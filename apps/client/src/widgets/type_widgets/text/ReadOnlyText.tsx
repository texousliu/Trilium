import { useEffect, useMemo, useRef } from "preact/hooks";
import { TypeWidgetProps } from "../type_widget";
import "./ReadOnlyText.css";
import { useNoteBlob, useNoteLabel } from "../../react/hooks";
import RawHtml from "../../react/RawHtml";

// we load CKEditor also for read only notes because they contain content styles required for correct rendering of even read only notes
// we could load just ckeditor-content.css but that causes CSS conflicts when both build CSS and this content CSS is loaded at the same time
// (see https://github.com/zadam/trilium/issues/1590 for example of such conflict)
import "@triliumnext/ckeditor5";
import FNote from "../../../entities/fnote";
import { getLocaleById } from "../../../services/i18n";

export default function ReadOnlyText({ note }: TypeWidgetProps) {
    const blob = useNoteBlob(note);
    const contentRef = useRef<HTMLDivElement>(null);
    const { isRtl } = useNoteLanguage(note);

    return (
        <div
            className="note-detail-readonly-text note-detail-printable"
            tabindex={100}
            dir={isRtl ? "rtl" : "ltr"}
        >
            <RawHtml
                containerRef={contentRef}
                className="note-detail-readonly-text-content ck-content use-tn-links"
                html={blob?.content}
            />
        </div>
    )
}

function useNoteLanguage(note: FNote) {
    const [ language ] = useNoteLabel(note, "language");
    const isRtl = useMemo(() => {
        const correspondingLocale = getLocaleById(language);
        return correspondingLocale?.rtl;
    }, [ language ]);
    return { isRtl };
}
