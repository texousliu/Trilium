import { ComponentChildren } from "preact";
import Icon from "./Icon";

interface FormListOpts {
    children: ComponentChildren;
    onSelect?: (value: string) => void;
}

export default function FormList({ children, onSelect }: FormListOpts) {
    return (
        <div class="dropdown-menu static show" style={{
            position: "relative"
        }} onClick={(e) => {
            const value = (e.target as HTMLElement)?.dataset?.value;
            if (value && onSelect) {
                onSelect(value);
            }
        }}>
            {children}
        </div>
    );
}

interface FormListItemOpts {
    children: ComponentChildren;
    icon?: string;
    value?: string;
}

export function FormListItem({ children, icon, value }: FormListItemOpts) {
    return (
        <a class="dropdown-item" data-value={value}>
            <Icon icon={icon} />&nbsp;
            {children}
        </a>
    );
}

interface FormListHeaderOpts {
    text: string;
}

export function FormListHeader({ text }: FormListHeaderOpts) {
    return (
        <li>
            <h6 className="dropdown-header">{text}</h6>
        </li>
    )
}
