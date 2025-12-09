import "./BreadcrumbBadges.css";

import { ComponentChildren } from "preact";
import { useIsNoteReadOnly, useNoteContext } from "./react/hooks";
import Icon from "./react/Icon";
import { useShareInfo } from "./shared_info";
import clsx from "clsx";

export default function NoteBadges() {
    return (
        <div className="breadcrumb-badges">
            <ReadOnlyBadge />
            <ShareBadge />
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

function ShareBadge() {
    const { note } = useNoteContext();
    const { isSharedExternally, link } = useShareInfo(note);

    return (link &&
        <Badge
            icon={isSharedExternally ? "bx bx-world" : "bx bx-link"}
        >
            {isSharedExternally ? "Shared publicly" : "Shared locally"}
        </Badge>
    );
}

function Badge({ icon, children, onClick }: { icon: string, children: ComponentChildren, onClick?: () => void }) {
    return (
        <div
            className={clsx("breadcrumb-badge", { "clickable": !!onClick })}
            onClick={onClick}
        >
            <Icon icon={icon} />&nbsp;
            {children}
        </div>
    );
}
