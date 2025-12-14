import { ComponentChild } from "preact";
import { CommandNames } from "../../components/app_context";

interface LinkButtonProps {
    onClick?: () => void;
    text: ComponentChild;
    triggerCommand?: CommandNames;
}

export default function LinkButton({ onClick, text, triggerCommand }: LinkButtonProps) {
    return (
        <a class="tn-link" href="javascript:"
           data-trigger-command={triggerCommand}
           onClick={(e) => {
                e.preventDefault();
                if (onClick) onClick();
           }}>
            {text}
        </a>
    )
}