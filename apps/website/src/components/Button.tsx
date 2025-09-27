import { ComponentChildren } from "preact";
import Icon from "./Icon";
import "./Button.css";

interface ButtonProps {
    href?: string;
    iconSvg?: string;
    text: ComponentChildren;
    openExternally?: boolean;
}

export default function Button({ href, iconSvg, openExternally, text }: ButtonProps) {
    return (
        <a
            className="button"
            href={href}
            target={openExternally ? "_blank" : undefined}
        >
            {iconSvg && <><Icon svg={iconSvg} />{" "}</>}
            {text}
        </a>
    )
}
