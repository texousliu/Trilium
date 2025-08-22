import { useEffect, useMemo, useState } from "preact/hooks";
import link from "../../services/link";
import RawHtml from "./RawHtml";

interface NoteLinkOpts {
    notePath: string | string[];
    showNotePath?: boolean;
    style?: Record<string, string | number>;
}

export default function NoteLink({ notePath, showNotePath, style }: NoteLinkOpts) {
    const stringifiedNotePath = Array.isArray(notePath) ? notePath.join("/") : notePath;
    const [ jqueryEl, setJqueryEl ] = useState<JQuery<HTMLElement>>();

    useEffect(() => {
        link.createLink(stringifiedNotePath, { showNotePath })
            .then(setJqueryEl);
    }, [ stringifiedNotePath, showNotePath ]);

    if (style) {
        jqueryEl?.css(style);
    }

    return <RawHtml html={jqueryEl} />
    
}