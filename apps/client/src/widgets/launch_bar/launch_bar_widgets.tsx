import ActionButton, { ActionButtonProps } from "../react/ActionButton";
import Dropdown, { DropdownProps } from "../react/Dropdown";

export interface LaunchBarWidgetProps {
    isHorizontalLayout: boolean;
}

export function LaunchBarActionButton(props: Omit<ActionButtonProps, "className" | "noIconActionClass" | "titlePosition">) {
    return (
        <ActionButton
            className="button-widget launcher-button"
            noIconActionClass
            titlePosition="right"
            {...props}
        />
    )
}

export function LaunchBarDropdownButton({ children, ...props }: Pick<DropdownProps, "title" | "text" | "children">) {
    return (
        <Dropdown
            className="right-dropdown-widget"
            buttonClassName="right-dropdown-button launcher-button"
            hideToggleArrow
            {...props}
        >{children}</Dropdown>
    )
}
