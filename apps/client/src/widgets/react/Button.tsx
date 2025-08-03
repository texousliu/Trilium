import { useEffect, useRef } from "preact/hooks";
import shortcuts from "../../services/shortcuts";

interface ButtonProps {
    text: string;
    className?: string;
    keyboardShortcut?: string;
    onClick: () => void;
}

export default function Button({ className, text, onClick, keyboardShortcut }: ButtonProps) {
    const classes: string[] = ["btn"];
    classes.push("btn-primary");
    if (className) {
        classes.push(className);
    }

    const buttonRef = useRef<HTMLButtonElement>(null);
    const splitShortcut = (keyboardShortcut ?? "").split("+");

    return (
        <button
            className={classes.join(" ")}
            type="button"
            onClick={onClick}
            ref={buttonRef}
        >
            {text} {keyboardShortcut && (
                splitShortcut.map((key, index) => (
                    <>
                        <kbd key={index}>{key.toUpperCase()}</kbd>{ index < splitShortcut.length - 1 ? "+" : "" }
                    </>
                ))
            )}
        </button>
    );
}