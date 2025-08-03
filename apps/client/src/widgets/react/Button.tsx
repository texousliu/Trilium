import { useRef } from "preact/hooks";

interface ButtonProps {
    text: string;
    className?: string;
    keyboardShortcut?: string;
    /** Called when the button is clicked. If not set, the button will submit the form (if any). */
    onClick?: () => void;
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
            type={onClick ? "button" : "submit"}
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