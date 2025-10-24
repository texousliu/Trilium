import { useEffect, useState } from "preact/hooks";
import { t } from "../services/i18n";
import Alert from "./react/Alert";
import { useNoteContext, useTriliumEvent, useTriliumOption } from "./react/hooks";
import FNote from "../entities/fnote";
import attributes from "../services/attributes";
import RawHtml from "./react/RawHtml";
import HelpButton from "./react/HelpButton";

export default function SharedInfo() {
    const { note } = useNoteContext();
    const [ syncServerHost ] = useTriliumOption("syncServerHost");
    const [ link, setLink ] = useState<string>();

    function refresh() {
        if (!note) return;
        if (note.noteId === "_share" || !note?.hasAncestor("_share")) {
            setLink(undefined);
            return;
        }

        let link;
        const shareId = getShareId(note);

        if (syncServerHost) {
            link = `${syncServerHost}/share/${shareId}`;
        } else {
            let host = location.host;
            if (host.endsWith("/")) {
                // seems like IE has trailing slash
                // https://github.com/zadam/trilium/issues/3782
                host = host.substring(0, host.length - 1);
            }

            link = `${location.protocol}//${host}${location.pathname}share/${shareId}`;
        }

        setLink(`<a href="${link}" class="external">${link}</a>`);
    }

    useEffect(refresh, [ note ]);
    useTriliumEvent("entitiesReloaded", ({ loadResults }) => {
        if (loadResults.getAttributeRows().find((attr) => attr.name?.startsWith("_share") && attributes.isAffecting(attr, note))) {
            refresh();
        } else if (loadResults.getBranchRows().find((branch) => branch.noteId === note?.noteId)) {
            refresh();
        }
    });

    return (
        <Alert className="shared-info-widget" type="warning" style={{
            contain: "none",
            margin: "10px",
            padding: "10px",
            fontWeight: "bold",
            display: !link ? "none" : undefined
        }}>
            {link && (
                <RawHtml html={syncServerHost
                ? t("shared_info.shared_publicly", { link })
                : t("shared_info.shared_locally", { link })} />                
            )}
            <HelpButton helpPage="R9pX4DGra2Vt" style={{ width: "24px", height: "24px" }} />
        </Alert>
    )
}

function getShareId(note: FNote) {
    if (note.hasOwnedLabel("shareRoot")) {
        return "";
    }

    return note.getOwnedLabelValue("shareAlias") || note.noteId;
}