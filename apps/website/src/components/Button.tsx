import { ComponentChildren } from "preact";
import Icon from "./Icon";
import "./Button.css";

interface ButtonProps {
    href?: string;
    iconSvg?: string;
    text: ComponentChildren;
    openExternally?: boolean;
    className?: string;
    outline?: boolean;
}

export default function Button({ href, iconSvg, openExternally, text, className, outline }: ButtonProps) {
    return (
        <a
            className={`button ${className} ${outline ? "outline" : ""}`}
            href={href}
            target={openExternally ? "_blank" : undefined}
            rel={openExternally ? "noopener noreferrer" : undefined}
        >
            {iconSvg && <><Icon svg={iconSvg} />{" "}</>}
            {text}
        </a>
    )
}
