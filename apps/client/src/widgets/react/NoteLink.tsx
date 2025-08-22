import { useEffect, useMemo, useState } from "preact/hooks";
import link from "../../services/link";
import RawHtml from "./RawHtml";

interface NoteLinkOpts {
    notePath: string | string[];
    showNotePath?: boolean;
    style?: Record<string, string | number>;
    noPreview?: boolean;
}

export default function NoteLink({ notePath, showNotePath, style, noPreview }: NoteLinkOpts) {
    const stringifiedNotePath = Array.isArray(notePath) ? notePath.join("/") : notePath;
    const [ jqueryEl, setJqueryEl ] = useState<JQuery<HTMLElement>>();

    useEffect(() => {
        link.createLink(stringifiedNotePath, { showNotePath })
            .then(setJqueryEl);
    }, [ stringifiedNotePath, showNotePath ]);

    if (style) {
        jqueryEl?.css(style);
    }

    const $linkEl = jqueryEl?.find("a");
    if (noPreview) {
        $linkEl?.addClass("no-tooltip-preview");
    }

    $linkEl?.addClass("tn-link");

    return <RawHtml html={jqueryEl} />
    
}