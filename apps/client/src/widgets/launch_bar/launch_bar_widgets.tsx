import { createContext } from "preact";
import FNote from "../../entities/fnote";
import { escapeHtml } from "../../services/utils";
import ActionButton, { ActionButtonProps } from "../react/ActionButton";
import Dropdown, { DropdownProps } from "../react/Dropdown";
import { useNoteLabel, useNoteProperty } from "../react/hooks";
import Icon from "../react/Icon";
import { useContext } from "preact/hooks";

export const LaunchBarContext = createContext<{
    isHorizontalLayout: boolean;
}>({
    isHorizontalLayout: false
})

export function LaunchBarActionButton(props: Omit<ActionButtonProps, "className" | "noIconActionClass" | "titlePosition">) {
    const { isHorizontalLayout } = useContext(LaunchBarContext);

    return (
        <ActionButton
            className="button-widget launcher-button"
            noIconActionClass
            titlePosition={isHorizontalLayout ? "bottom" : "right"}
            {...props}
        />
    )
}

export function LaunchBarDropdownButton({ children, icon, ...props }: Pick<DropdownProps, "title" | "children" | "onShown" | "dropdownOptions" | "dropdownRef"> & { icon: string }) {
    const { isHorizontalLayout } = useContext(LaunchBarContext);

    return (
        <Dropdown
            className="right-dropdown-widget"
            buttonClassName="right-dropdown-button launcher-button"
            hideToggleArrow
            text={<Icon icon={icon} />}
            titlePosition={isHorizontalLayout ? "bottom" : "right"}
            titleOptions={{ animation: false }}
            {...props}
        >{children}</Dropdown>
    )
}

export function useLauncherIconAndTitle(note: FNote) {
    const title = useNoteProperty(note, "title");

    // React to changes.
    useNoteLabel(note, "iconClass");
    useNoteLabel(note, "workspaceIconClass");

    return {
        icon: note.getIcon(),
        title: escapeHtml(title ?? "")
    };
}
