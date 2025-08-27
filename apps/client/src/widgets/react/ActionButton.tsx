import { useEffect, useRef, useState } from "preact/hooks";
import { CommandNames } from "../../components/app_context";
import { useStaticTooltip } from "./hooks";
import keyboard_actions from "../../services/keyboard_actions";

interface ActionButtonProps {
    text: string;
    titlePosition?: "bottom" | "left"; // TODO: Use it
    icon: string;
    className?: string;
    onClick?: (e: MouseEvent) => void;
    triggerCommand?: CommandNames;
}

export default function ActionButton({ text, icon, className, onClick, triggerCommand, titlePosition }: ActionButtonProps) {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [ keyboardShortcut, setKeyboardShortcut ] = useState<string[]>();
    
    useStaticTooltip(buttonRef, {
        title: keyboardShortcut?.length ? `${text} (${keyboardShortcut?.join(",")})` : text,
        placement: titlePosition ?? "bottom",
        fallbackPlacements: [ titlePosition ?? "bottom" ]
    });
    
    useEffect(() => {
        if (triggerCommand) {
            keyboard_actions.getAction(triggerCommand).then(action => setKeyboardShortcut(action?.effectiveShortcuts));
        }
    }, [triggerCommand]);

    return <button
        ref={buttonRef}
        class={`icon-action ${icon} ${className ?? ""}`}
        onClick={onClick}        
        data-trigger-command={triggerCommand}
    />;
}