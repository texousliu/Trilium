import "./BreadcrumbBadges.css";

import { ComponentChildren } from "preact";
import { useIsNoteReadOnly, useNoteContext } from "./react/hooks";
import Icon from "./react/Icon";

export default function NoteBadges() {
    return (
        <div className="breadcrumb-badges">
            <ReadOnlyBadge />
        </div>
    );
}

function ReadOnlyBadge() {
    const { note, noteContext } = useNoteContext();
    const { isReadOnly, enableEditing } = useIsNoteReadOnly(note, noteContext);
    const isExplicitReadOnly = note?.isLabelTruthy("readOnly");

    return (isReadOnly &&
        <Badge
            icon="bx bx-lock"
            onClick={() => enableEditing()}>
            {isExplicitReadOnly ? "Read-only" : "Auto read-only"}
        </Badge>
    );
}

function Badge({ icon, children, onClick }: { icon: string, children: ComponentChildren, onClick?: () => void }) {
    return (
        <div className="breadcrumb-badge" onClick={onClick}>
            <Icon icon={icon} />&nbsp;
            {children}
        </div>
    );
}
