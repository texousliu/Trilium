import type { RefObject } from "preact";
import type { CSSProperties } from "preact/compat";
import { useRef, useMemo } from "preact/hooks";
import { memo } from "preact/compat";

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
    disabled?: boolean;
    small?: boolean;
    style?: CSSProperties;
}

const Button = memo(({ buttonRef: _buttonRef, className, text, onClick, keyboardShortcut, icon, primary, disabled, small, style }: ButtonProps) => {
    // Memoize classes array to prevent recreation
    const classes = useMemo(() => {
        const classList: string[] = ["btn"];
        if (primary) {
            classList.push("btn-primary");
        } else {
            classList.push("btn-secondary");
        }
        if (className) {
            classList.push(className);
        }
        if (small) {
            classList.push("btn-sm");
        }
        return classList.join(" ");
    }, [primary, className, small]);

    const buttonRef = _buttonRef ?? useRef<HTMLButtonElement>(null);
    
    // Memoize keyboard shortcut rendering
    const shortcutElements = useMemo(() => {
        if (!keyboardShortcut) return null;
        const splitShortcut = keyboardShortcut.split("+");
        return splitShortcut.map((key, index) => (
            <>
                <kbd key={index}>{key.toUpperCase()}</kbd>
                {index < splitShortcut.length - 1 ? "+" : ""}
            </>
        ));
    }, [keyboardShortcut]);

    return (
        <button
            className={classes}
            type={onClick ? "button" : "submit"}
            onClick={onClick}
            ref={buttonRef}
            disabled={disabled}
            style={style}
        >
            {icon && <span className={`bx ${icon}`}></span>}
            {text} {shortcutElements}
        </button>
    );
});

export default Button;