import ActionButton from "./react/ActionButton";
import "./TabHistoryNavigationButtons.css";

export default function TabHistoryNavigationButtons() {
    return (
        <div className="tab-history-navigation-buttons">
            <ActionButton icon="bx bx-left-arrow-alt" />
            <ActionButton icon="bx bx-right-arrow-alt" />
        </div>
    )
}
