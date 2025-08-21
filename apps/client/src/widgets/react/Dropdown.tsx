import { Dropdown as BootstrapDropdown } from "bootstrap";
import { ComponentChildren } from "preact";
import { CSSProperties } from "preact/compat";
import { useEffect, useRef } from "preact/hooks";
import { useUniqueName } from "./hooks";

interface DropdownProps {
    className?: string;
    buttonClassName?: string;
    isStatic?: boolean;
    children: ComponentChildren;
    title?: string;
    dropdownContainerStyle?: CSSProperties;
    hideToggleArrow?: boolean;
}

export default function Dropdown({ className, buttonClassName, isStatic, children, title, dropdownContainerStyle, hideToggleArrow }: DropdownProps) {
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!triggerRef.current) return;
        
        const dropdown = BootstrapDropdown.getOrCreateInstance(triggerRef.current);
        return () => dropdown.dispose();
    }, []); // Add dependency array

    useEffect(() => {
        if (!dropdownRef.current) return;
        
        const handleHide = () => {
            // Remove console.log from production code
        };
        
        const $dropdown = $(dropdownRef.current);
        $dropdown.on("hide.bs.dropdown", handleHide);
        
        // Add proper cleanup
        return () => {
            $dropdown.off("hide.bs.dropdown", handleHide);
        };
    }, []); // Add dependency array

    const ariaId = useUniqueName("button");

    return (
        <div ref={dropdownRef} class={`dropdown ${className ?? ""}`} style={{ display: "flex" }}>
            <button
                className={`btn ${buttonClassName ?? ""} ${!hideToggleArrow ? "dropdown-toggle" : ""}`}
                ref={triggerRef}
                type="button"
                data-bs-toggle="dropdown"
                data-bs-display={ isStatic ? "static" : undefined }
                aria-haspopup="true"
                aria-expanded="false"
                title={title}
                id={ariaId}
            />

            <div
                class={`dropdown-menu ${isStatic ? "static" : undefined}`}
                style={dropdownContainerStyle}
                aria-labelledby={ariaId}
            >
                {children}
            </div>
        </div>
    )
}