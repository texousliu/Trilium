import { useEffect, useMemo, useState } from "preact/hooks";
import link from "../../services/link";
import RawHtml from "./RawHtml";

interface NoteLinkOpts {
    notePath: string | string[];
    showNotePath?: boolean;
}

export default function NoteLink({ notePath, showNotePath }: NoteLinkOpts) {
    const stringifiedNotePath = Array.isArray(notePath) ? notePath.join("/") : notePath;
    const [ jqueryEl, setJqueryEl ] = useState<JQuery<HTMLElement>>();

    useEffect(() => {
        link.createLink(stringifiedNotePath, { showNotePath: true })
            .then(setJqueryEl);
    }, [ stringifiedNotePath, showNotePath ])

    return <RawHtml html={jqueryEl} />
    
}