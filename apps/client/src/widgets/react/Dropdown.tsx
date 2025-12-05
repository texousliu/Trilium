import { Dropdown as BootstrapDropdown, Tooltip } from "bootstrap";
import { ComponentChildren, HTMLAttributes } from "preact";
import { CSSProperties, HTMLProps } from "preact/compat";
import { MutableRef, useCallback, useEffect, useRef, useState } from "preact/hooks";
import { useStaticTooltip, useUniqueName } from "./hooks";

type DataAttributes = {
  [key: `data-${string}`]: string | number | boolean | undefined;
};

export interface DropdownProps extends Pick<HTMLProps<HTMLDivElement>, "id" | "className"> {
    buttonClassName?: string;
    buttonProps?: Partial<HTMLAttributes<HTMLButtonElement> & DataAttributes>;
    isStatic?: boolean;
    children: ComponentChildren;
    title?: string;
    dropdownContainerStyle?: CSSProperties;
    dropdownContainerClassName?: string;
    hideToggleArrow?: boolean;
    /** If set to true, then the dropdown button will be considered an icon action (without normal border and sized for icons only). */
    iconAction?: boolean;
    noSelectButtonStyle?: boolean;
    noDropdownListStyle?: boolean;
    disabled?: boolean;
    text?: ComponentChildren;
    forceShown?: boolean;
    onShown?: () => void;
    onHidden?: () => void;
    dropdownOptions?: Partial<BootstrapDropdown.Options>;
    dropdownRef?: MutableRef<BootstrapDropdown | null>;
    titlePosition?: "top" | "right" | "bottom" | "left";
    titleOptions?: Partial<Tooltip.Options>;
}

export default function Dropdown({ id, className, buttonClassName, isStatic, children, title, text, dropdownContainerStyle, dropdownContainerClassName, hideToggleArrow, iconAction, disabled, noSelectButtonStyle, noDropdownListStyle, forceShown, onShown: externalOnShown, onHidden: externalOnHidden, dropdownOptions, buttonProps, dropdownRef, titlePosition, titleOptions }: DropdownProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    useStaticTooltip(triggerRef, {
        ...titleOptions,
        placement: titlePosition ?? "bottom",
        fallbackPlacements: [ titlePosition ?? "bottom" ],
    });

    const [ shown, setShown ] = useState(false);

    useEffect(() => {
        if (!triggerRef.current) return;

        const dropdown = BootstrapDropdown.getOrCreateInstance(triggerRef.current, dropdownOptions);
        if (dropdownRef) {
            dropdownRef.current = dropdown;
        }
        if (forceShown) {
            dropdown.show();
            setShown(true);
        }
        return () => dropdown.dispose();
    }, []);

    const onShown = useCallback(() => {
        setShown(true);
        externalOnShown?.();
    }, [])

    const onHidden = useCallback(() => {
        setShown(false);
        externalOnHidden?.();
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        const $dropdown = $(containerRef.current);
        $dropdown.on("show.bs.dropdown", onShown);
        $dropdown.on("hide.bs.dropdown", onHidden);

        // Add proper cleanup
        return () => {
            $dropdown.off("show.bs.dropdown", onShown);
            $dropdown.off("hide.bs.dropdown", onHidden);
        };
    }, []); // Add dependency array

    const ariaId = useUniqueName("button");

    return (
        <div ref={containerRef} class={`dropdown ${className ?? ""}`} style={{ display: "flex" }}>
            <button
                className={`${iconAction ? "icon-action" : "btn"} ${!noSelectButtonStyle ? "select-button" : ""} ${buttonClassName ?? ""} ${!hideToggleArrow ? "dropdown-toggle" : ""}`}
                ref={triggerRef}
                type="button"
                data-bs-toggle="dropdown"
                data-bs-display={ isStatic ? "static" : undefined }
                aria-haspopup="true"
                aria-expanded="false"
                title={title}
                id={id ?? ariaId}
                disabled={disabled}
                {...buttonProps}
            >
                {text}
                <span className="caret"></span>
            </button>

            <ul
                class={`dropdown-menu ${isStatic ? "static" : ""} ${dropdownContainerClassName ?? ""} ${!noDropdownListStyle ? "tn-dropdown-list" : ""}`}
                style={dropdownContainerStyle}
                aria-labelledby={ariaId}
            >
                {shown && children}
            </ul>
        </div>
    )
}
