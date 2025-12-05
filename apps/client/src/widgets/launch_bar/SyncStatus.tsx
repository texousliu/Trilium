import { useEffect, useRef, useState } from "preact/hooks";
import "./SyncStatus.css";
import { t } from "../../services/i18n";
import clsx from "clsx";
import { escapeQuotes } from "../../services/utils";
import { useStaticTooltip, useTriliumOption } from "../react/hooks";
import sync from "../../services/sync";
import ws, { subscribeToMessages, unsubscribeToMessage } from "../../services/ws";
import { WebSocketMessage } from "@triliumnext/commons";

type SyncState = "unknown" | "in-progress"
    | "connected-with-changes" | "connected-no-changes"
    | "disconnected-with-changes" | "disconnected-no-changes";

interface StateMapping {
    title: string;
    icon: string;
    hasChanges?: boolean;
}

const STATE_MAPPINGS: Record<SyncState, StateMapping> = {
    unknown: {
        title: t("sync_status.unknown"),
        icon: "bx bx-time"
    },
    "connected-with-changes": {
        title: t("sync_status.connected_with_changes"),
        icon: "bx bx-wifi",
        hasChanges: true
    },
    "connected-no-changes": {
        title: t("sync_status.connected_no_changes"),
        icon: "bx bx-wifi"
    },
    "disconnected-with-changes": {
        title: t("sync_status.disconnected_with_changes"),
        icon: "bx bx-wifi-off",
        hasChanges: true
    },
    "disconnected-no-changes": {
        title: t("sync_status.disconnected_no_changes"),
        icon: "bx bx-wifi-off"
    },
    "in-progress": {
        title: t("sync_status.in_progress"),
        icon: "bx bx-analyse bx-spin"
    }
};

export default function SyncStatus() {
    const syncState = useSyncStatus();
    const { title, icon, hasChanges } = STATE_MAPPINGS[syncState];
    const spanRef = useRef<HTMLSpanElement>(null);
    const [ syncServerHost ] = useTriliumOption("syncServerHost");
    useStaticTooltip(spanRef, {
        html: true
        // TODO: Placement
    });

    return (syncServerHost &&
        <div class="sync-status-widget launcher-button">
            <div class="sync-status">
                <span
                    ref={spanRef}
                    className={clsx("sync-status-icon", `sync-status-${syncState}`, icon)}
                    title={escapeQuotes(title)}
                    onClick={() => {
                        if (syncState === "in-progress") return;
                        sync.syncNow();
                    }}
                >
                    {hasChanges && (
                        <span class="bx bxs-star sync-status-sub-icon"></span>
                    )}
                </span>
            </div>
        </div>
    )
}

function useSyncStatus() {
    const [ syncState, setSyncState ] = useState<SyncState>("unknown");

    useEffect(() => {
        let lastSyncedPush: number;

        function onMessage(message: WebSocketMessage) {
            // First, read last synced push.
            if ("lastSyncedPush" in message) {
                lastSyncedPush = message.lastSyncedPush;
            } else if ("data" in message && message.data && "lastSyncedPush" in message.data && lastSyncedPush) {
                lastSyncedPush = message.data.lastSyncedPush;
            }

            // Determine if all changes were pushed.
            const allChangesPushed = lastSyncedPush === ws.getMaxKnownEntityChangeSyncId();

            let syncState: SyncState = "unknown";
            if (message.type === "sync-pull-in-progress") {
                syncState = "in-progress";
            } else if (message.type === "sync-push-in-progress") {
                syncState = "in-progress";
            } else if (message.type === "sync-finished") {
                syncState = allChangesPushed ? "connected-no-changes" : "connected-with-changes";
            } else if (message.type === "sync-failed") {
                syncState = allChangesPushed ? "disconnected-no-changes" : "disconnected-with-changes";
            } else if (message.type === "frontend-update") {
                lastSyncedPush = message.data.lastSyncedPush;
            }
            setSyncState(syncState);
        }

        subscribeToMessages(onMessage);
        return () => unsubscribeToMessage(onMessage);
    }, []);

    return syncState;
}
