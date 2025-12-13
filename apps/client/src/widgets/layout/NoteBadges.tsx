import "./NoteBadges.css";

import clsx from "clsx";
import { ComponentChildren, MouseEventHandler } from "preact";
import { useRef } from "preact/hooks";

import { t } from "../../services/i18n";
import Dropdown, { DropdownProps } from "../react/Dropdown";
import { useIsNoteReadOnly, useNoteContext, useNoteLabel, useNoteLabelBoolean, useStaticTooltip } from "../react/hooks";
import Icon from "../react/Icon";
import { useShareInfo } from "../shared_info";
import { Badge } from "../react/Badge";

export default function NoteBadges() {
    return (
        <div className="note-badges">
            <ReadOnlyBadge />
            <ShareBadge />
            <ClippedNoteBadge />
            <ExecuteBadge />
        </div>
    );
}

function ReadOnlyBadge() {
    const { note, noteContext } = useNoteContext();
    const { isReadOnly, enableEditing } = useIsNoteReadOnly(note, noteContext);
    const isExplicitReadOnly = note?.isLabelTruthy("readOnly");
    const isTemporarilyEditable = noteContext?.ntxId !== "_popup-editor" && noteContext?.viewScope?.readOnlyTemporarilyDisabled;

    if (isTemporarilyEditable) {
        return <Badge
            icon="bx bx-lock-open-alt"
            text={t("breadcrumb_badges.read_only_temporarily_disabled")}
            tooltip={t("breadcrumb_badges.read_only_temporarily_disabled_description")}
            className="temporarily-editable-badge"
            onClick={() => enableEditing(false)}
        />;
    } else if (isReadOnly) {
        return <Badge
            icon="bx bx-lock-alt"
            text={isExplicitReadOnly ? t("breadcrumb_badges.read_only_explicit") : t("breadcrumb_badges.read_only_auto")}
            tooltip={isExplicitReadOnly ? t("breadcrumb_badges.read_only_explicit_description") : t("breadcrumb_badges.read_only_auto_description")}
            className="read-only-badge"
            onClick={() => enableEditing()}
        />;
    }
}

function ShareBadge() {
    const { note } = useNoteContext();
    const { isSharedExternally, link, linkHref } = useShareInfo(note);

    return (link &&
        <Badge
            icon={isSharedExternally ? "bx bx-world" : "bx bx-share-alt"}
            text={isSharedExternally ? t("breadcrumb_badges.shared_publicly") : t("breadcrumb_badges.shared_locally")}
            tooltip={isSharedExternally ?
                t("breadcrumb_badges.shared_publicly_description", { link }) :
                t("breadcrumb_badges.shared_locally_description", { link })
            }
            className="share-badge"
            href={linkHref}
        />
    );
}

function ClippedNoteBadge() {
    const { note } = useNoteContext();
    const [ pageUrl ] = useNoteLabel(note, "pageUrl");

    return (pageUrl &&
        <Badge
            className="clipped-note-badge"
            icon="bx bx-globe"
            text={t("breadcrumb_badges.clipped_note")}
            tooltip={t("breadcrumb_badges.clipped_note_description", { url: pageUrl })}
            href={pageUrl}
        />
    );
}

function ExecuteBadge() {
    const { note, parentComponent } = useNoteContext();
    const isScript = note?.isTriliumScript();
    const isSql = note?.isTriliumSqlite();
    const isExecutable = isScript || isSql;
    const [ executeDescription ] = useNoteLabel(note, "executeDescription");
    const [ executeButton ] = useNoteLabelBoolean(note, "executeButton");

    return (note && isExecutable && (executeDescription || executeButton) &&
        <Badge
            className="execute-badge"
            icon="bx bx-play"
            text={isScript ? t("breadcrumb_badges.execute_script") : t("breadcrumb_badges.execute_sql")}
            tooltip={executeDescription || (isScript ? t("breadcrumb_badges.execute_script_description") : t("breadcrumb_badges.execute_sql_description"))}
            onClick={() => parentComponent.triggerCommand("runActiveNote")}
        />
    );
}
