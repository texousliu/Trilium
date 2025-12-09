import "./BreadcrumbBadges.css";

import { ComponentChildren } from "preact";
import { useIsNoteReadOnly, useNoteContext } from "./react/hooks";

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
        <Badge onClick={() => enableEditing()}>
            {isExplicitReadOnly ? "Read-only" : "Auto read-only"}
        </Badge>
    );
}

function Badge({ children, onClick }: { children: ComponentChildren, onClick?: () => void }) {
    return (
        <div className="breadcrumb-badge" onClick={onClick}>
            {children}
        </div>
    );
}
