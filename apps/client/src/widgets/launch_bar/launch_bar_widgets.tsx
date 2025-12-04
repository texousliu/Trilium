import ActionButton, { ActionButtonProps } from "../react/ActionButton";
import Dropdown, { DropdownProps } from "../react/Dropdown";
import Icon from "../react/Icon";

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

export function LaunchBarDropdownButton({ children, icon, ...props }: Pick<DropdownProps, "title" | "children"> & { icon: string }) {
    return (
        <Dropdown
            className="right-dropdown-widget"
            buttonClassName="right-dropdown-button launcher-button"
            hideToggleArrow
            text={<Icon icon={icon} />}
            {...props}
        >{children}</Dropdown>
    )
}
