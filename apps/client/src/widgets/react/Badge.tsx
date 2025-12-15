import "./Badge.css";

import clsx from "clsx";
import { ComponentChildren, MouseEventHandler } from "preact";
import { useRef } from "preact/hooks";

import Dropdown, { DropdownProps } from "./Dropdown";
import { useStaticTooltip } from "./hooks";
import Icon from "./Icon";

interface SimpleBadgeProps {
    className?: string;
    title: ComponentChildren;
}

interface BadgeProps {
    text?: string;
    icon?: string;
    className?: string;
    tooltip?: string;
    onClick?: MouseEventHandler<HTMLDivElement>;
    href?: string;
}

export default function SimpleBadge({ title, className }: SimpleBadgeProps) {
    return <span class={`badge ${className ?? ""}`}>{title}</span>;
}

export function Badge({ icon, className, text, tooltip, onClick, href }: BadgeProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    useStaticTooltip(containerRef, {
        placement: "bottom",
        fallbackPlacements: [ "bottom" ],
        animation: false,
        html: true,
        title: tooltip
    });

    const content = <>
        {icon && <><Icon icon={icon} />&nbsp;</>}
        <span class="text">{text}</span>
    </>;

    return (
        <div
            ref={containerRef}
            className={clsx("ext-badge", className, { "clickable": !!onClick })}
            onClick={onClick}
        >
            {href ? <a href={href}>{content}</a> : <span>{content}</span>}
        </div>
    );
}

export function BadgeWithDropdown({ children, tooltip, className, dropdownOptions, ...props }: BadgeProps & {
    children: ComponentChildren,
    dropdownOptions?: Partial<DropdownProps>
}) {
    return (
        <Dropdown
            className={`dropdown-badge dropdown-${className}`}
            text={<Badge className={className} {...props} />}
            noDropdownListStyle
            noSelectButtonStyle
            hideToggleArrow
            title={tooltip}
            titlePosition="bottom"
            {...dropdownOptions}
            dropdownOptions={{
                ...dropdownOptions?.dropdownOptions,
                popperConfig: {
                    ...dropdownOptions?.dropdownOptions?.popperConfig,
                    placement: "bottom", strategy: "fixed"
                }
            }}
        >{children}</Dropdown>
    );
}
