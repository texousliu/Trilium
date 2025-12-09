import "./TabHistoryNavigationButtons.css";

import { t } from "../services/i18n";
import ActionButton from "./react/ActionButton";
import { useCallback, useMemo } from "preact/hooks";
import { handleHistoryContextMenu } from "./launch_bar/HistoryNavigation";
import { dynamicRequire } from "../services/utils";

export default function TabHistoryNavigationButtons() {
    const webContents = useMemo(() => dynamicRequire("@electron/remote").getCurrentWebContents(), []);
    const onContextMenu = handleHistoryContextMenu(webContents);

    return (
        <div className="tab-history-navigation-buttons">
            <ActionButton
                icon="bx bx-left-arrow-alt"
                text={t("tab_history_navigation_buttons.go-back")}
                triggerCommand="backInNoteHistory"
                onContextMenu={onContextMenu}
            />
            <ActionButton
                icon="bx bx-right-arrow-alt"
                text={t("tab_history_navigation_buttons.go-forward")}
                triggerCommand="forwardInNoteHistory"
                onContextMenu={onContextMenu}
            />
        </div>
    );
}
