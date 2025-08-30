import { useEffect, useState } from "preact/hooks";
import link from "../../services/link";
import RawHtml from "./RawHtml";

interface NoteLinkOpts {
    className?: string;
    notePath: string | string[];
    showNotePath?: boolean;
    showNoteIcon?: boolean;
    style?: Record<string, string | number>;
    noPreview?: boolean;
    noTnLink?: boolean;
}

export default function NoteLink({ className, notePath, showNotePath, showNoteIcon, style, noPreview, noTnLink }: NoteLinkOpts) {
    const stringifiedNotePath = Array.isArray(notePath) ? notePath.join("/") : notePath;
    const [ jqueryEl, setJqueryEl ] = useState<JQuery<HTMLElement>>();

    useEffect(() => {
        link.createLink(stringifiedNotePath, { showNotePath, showNoteIcon })
            .then(setJqueryEl);
    }, [ stringifiedNotePath, showNotePath ]);

    if (style) {
        jqueryEl?.css(style);
    }

    const $linkEl = jqueryEl?.find("a");
    if (noPreview) {
        $linkEl?.addClass("no-tooltip-preview");
    }

    if (!noTnLink) {
        $linkEl?.addClass("tn-link");
    }

    if (className) {
        $linkEl?.addClass(className);
    }

    return <RawHtml html={jqueryEl} />
    
}