import "./TabHistoryNavigationButtons.css";

import { t } from "../services/i18n";
import ActionButton from "./react/ActionButton";

export default function TabHistoryNavigationButtons() {
    return (
        <div className="tab-history-navigation-buttons">
            <ActionButton
                icon="bx bx-left-arrow-alt"
                text={t("tab_history_navigation_buttons.go-back")}
                triggerCommand="backInNoteHistory"
            />
            <ActionButton
                icon="bx bx-right-arrow-alt"
                text={t("tab_history_navigation_buttons.go-forward")}
                triggerCommand="forwardInNoteHistory"
            />
        </div>
    );
}
