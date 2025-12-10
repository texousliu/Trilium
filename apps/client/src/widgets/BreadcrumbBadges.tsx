import "./BreadcrumbBadges.css";

import { ComponentChildren, MouseEventHandler } from "preact";
import { useIsNoteReadOnly, useNoteContext, useStaticTooltip } from "./react/hooks";
import Icon from "./react/Icon";
import { useShareInfo } from "./shared_info";
import clsx from "clsx";
import { t } from "../services/i18n";
import { useRef } from "preact/hooks";
import { goToLinkExt } from "../services/link";

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
            tooltip={t("breadcrumb_badges.read_only_temporarily_disabled_description")}
            onClick={() => enableEditing(false)}
        >
            {t("breadcrumb_badges.read_only_temporarily_disabled")}
        </Badge>;
    } else if (isReadOnly) {
        return <Badge
            icon="bx bx-lock-alt"
            tooltip={isExplicitReadOnly ? t("breadcrumb_badges.read_only_explicit_description") : t("breadcrumb_badges.read_only_auto_description")}
            onClick={() => enableEditing()}
        >
            {isExplicitReadOnly ? t("breadcrumb_badges.read_only_explicit") : t("breadcrumb_badges.read_only_auto")}
        </Badge>;
    }
}

function ShareBadge() {
    const { note } = useNoteContext();
    const { isSharedExternally, link, linkHref } = useShareInfo(note);

    return (link &&
        <Badge
            icon={isSharedExternally ? "bx bx-world" : "bx bx-link"}
            tooltip={isSharedExternally ?
                t("breadcrumb_badges.shared_publicly_description", { link }) :
                t("breadcrumb_badges.shared_locally_description", { link })
            }
            onClick={(e) => linkHref && goToLinkExt(e, linkHref)}
        >
            {isSharedExternally ? t("breadcrumb_badges.shared_publicly") : t("breadcrumb_badges.shared_locally")}
        </Badge>
    );
}

function Badge({ icon, children, tooltip, onClick }: { icon: string, tooltip: string, children: ComponentChildren, onClick?: MouseEventHandler<HTMLDivElement> }) {
    const containerRef = useRef<HTMLDivElement>(null);
    useStaticTooltip(containerRef, {
        placement: "bottom",
        fallbackPlacements: [ "bottom" ],
        animation: false,
        html: true,
        title: tooltip
    });

    return (
        <div
            ref={containerRef}
            className={clsx("breadcrumb-badge", { "clickable": !!onClick })}
            onClick={onClick}
        >
            <Icon icon={icon} />&nbsp;
            {children}
        </div>
    );
}
