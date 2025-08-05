import { RefObject } from "preact";
import { useRef } from "preact/hooks";

interface ButtonProps {
    /** Reference to the button element. Mostly useful for requesting focus. */
    buttonRef?: RefObject<HTMLButtonElement>;
    text: string;
    className?: string;
    icon?: string;
    keyboardShortcut?: string;
    /** Called when the button is clicked. If not set, the button will submit the form (if any). */
    onClick?: () => void;
    primary?: boolean;
}

export default function Button({ buttonRef: _buttonRef, className, text, onClick, keyboardShortcut, icon, primary }: ButtonProps) {
    const classes: string[] = ["btn"];
    if (primary) {
        classes.push("btn-primary");
    } else {
        classes.push("btn-secondary");
    }
    if (className) {
        classes.push(className);
    }

    const buttonRef = _buttonRef ?? useRef<HTMLButtonElement>(null);
    const splitShortcut = (keyboardShortcut ?? "").split("+");

    return (
        <button
            className={classes.join(" ")}
            type={onClick ? "button" : "submit"}
            onClick={onClick}
            ref={buttonRef}
        >
            {icon && <span className={`bx ${icon}`}></span>}
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