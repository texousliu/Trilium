import "./BreadcrumbBadges.css";

import { ComponentChildren } from "preact";
import { useIsNoteReadOnly, useNoteContext } from "./react/hooks";
import Icon from "./react/Icon";
import { useShareInfo } from "./shared_info";
import clsx from "clsx";
import { t } from "../services/i18n";

export default function BreadcrumbBadges() {
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
    const isTemporarilyEditable = noteContext?.viewScope?.readOnlyTemporarilyDisabled;

    if (isTemporarilyEditable) {
        return <Badge
            icon="bx bx-lock-open-alt"
            onClick={() => enableEditing(false)}
        >
            {t("breadcrumb_badges.read_only_temporarily_disabled")}
        </Badge>;
    } else if (isReadOnly) {
        return <Badge
            icon="bx bx-lock-alt"
            onClick={() => enableEditing()}>
            {isExplicitReadOnly ? t("breadcrumb_badges.read_only_explicit") : t("breadcrumb_badges.read_only_auto")}
        </Badge>;
    }
}

function ShareBadge() {
    const { note } = useNoteContext();
    const { isSharedExternally, link } = useShareInfo(note);

    return (link &&
        <Badge
            icon={isSharedExternally ? "bx bx-world" : "bx bx-link"}
        >
            {isSharedExternally ? t("breadcrumb_badges.shared_publicly") : t("breadcrumb_badges.shared_locally")}
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
