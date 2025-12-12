import "./StatusBar.css";

import { Locale } from "@triliumnext/commons";
import clsx from "clsx";
import { type ComponentChildren } from "preact";
import { createPortal } from "preact/compat";
import { useState } from "preact/hooks";

import FNote from "../../entities/fnote";
import { t } from "../../services/i18n";
import { openInAppHelpFromUrl } from "../../services/utils";
import { formatDateTime } from "../../utils/formatters";
import Dropdown, { DropdownProps } from "../react/Dropdown";
import { FormDropdownDivider, FormListItem } from "../react/FormList";
import { useActiveNoteContext } from "../react/hooks";
import Icon from "../react/Icon";
import { ContentLanguagesModal, useLanguageSwitcher } from "../ribbon/BasicPropertiesTab";
import { NoteSizeWidget, useNoteMetadata } from "../ribbon/NoteInfoTab";
import { useProcessedLocales } from "../type_widgets/options/components/LocaleSelector";
import Breadcrumb from "./Breadcrumb";
import NoteContext from "../../components/note_context";

interface StatusBarContext {
    note: FNote;
    noteContext: NoteContext;
}

export default function StatusBar() {
    const { note, noteContext } = useActiveNoteContext();
    const context = note && noteContext && { note, noteContext } satisfies StatusBarContext;

    return (
        <div className="status-bar">
            {context && <>
                <div className="breadcrumb-row">
                    <Breadcrumb {...context} />
                </div>

                <div className="actions-row">
                    <NoteInfoBadge {...context} />
                    <LanguageSwitcher {...context} />
                </div>
            </>}
        </div>
    );
}

function StatusBarDropdown({ children, icon, text, buttonClassName, titleOptions, ...dropdownProps }: Omit<DropdownProps, "hideToggleArrow" | "title" | "titlePosition"> & {
    title: string;
    icon?: string;
}) {
    return (
        <Dropdown
            buttonClassName={clsx("status-bar-dropdown-button", buttonClassName)}
            titlePosition="top"
            titleOptions={{
                ...titleOptions,
                popperConfig: {
                    ...titleOptions?.popperConfig,
                    strategy: "fixed"
                }
            }}
            text={<>
                {icon && (<><Icon icon={icon} />&nbsp;</>)}
                {text}
            </>}
            {...dropdownProps}
        >
            {children}
        </Dropdown>
    );
}

//#region Language Switcher
function LanguageSwitcher({ note }: StatusBarContext) {
    const [ modalShown, setModalShown ] = useState(false);
    const { locales, DEFAULT_LOCALE, currentNoteLanguage, setCurrentNoteLanguage } = useLanguageSwitcher(note);
    const { activeLocale, processedLocales } = useProcessedLocales(locales, DEFAULT_LOCALE, currentNoteLanguage ?? DEFAULT_LOCALE.id);

    return (
        <>
            {note.type === "text" && <StatusBarDropdown
                icon="bx bx-globe"
                title={t("status_bar.language_title")}
                text={<span dir={activeLocale?.rtl ? "rtl" : "ltr"}>{getLocaleName(activeLocale)}</span>}
            >
                {processedLocales.map(locale => {
                    if (typeof locale === "object") {
                        return <FormListItem
                            rtl={locale.rtl}
                            checked={locale.id === currentNoteLanguage}
                            onClick={() => setCurrentNoteLanguage(locale.id)}
                        >{locale.name}</FormListItem>
                    } else {
                        return <FormDropdownDivider />
                    }
                })}
                <FormDropdownDivider />
                <FormListItem
                    onClick={() => openInAppHelpFromUrl("veGu4faJErEM")}
                    icon="bx bx-help-circle"
                >{t("note_language.help-on-languages")}</FormListItem>
                <FormListItem
                    onClick={() => setModalShown(true)}
                    icon="bx bx-cog"
                >{t("note_language.configure-languages")}</FormListItem>
            </StatusBarDropdown>}
            {createPortal(
                <ContentLanguagesModal modalShown={modalShown} setModalShown={setModalShown} />,
                document.body
            )}
        </>
    );
}

export function getLocaleName(locale: Locale | null | undefined) {
    if (!locale) return "";
    if (!locale.id) return "-";
    if (locale.name.length <= 4 || locale.rtl) return locale.name;    // Some locales like Japanese and Chinese look better than their ID.
    return locale.id
        .replace("_", "-")
        .toLocaleUpperCase();
}
//#endregion

//#region Note info
export function NoteInfoBadge({ note }: { note: FNote | null | undefined }) {
    const { metadata, ...sizeProps } = useNoteMetadata(note);

    return (note &&
        <StatusBarDropdown
            icon="bx bx-info-circle"
            title={t("status_bar.note_info_title")}
            dropdownContainerClassName="dropdown-note-info"
            dropdownOptions={{ autoClose: "outside" }}
        >
            <ul>
                <NoteInfoValue text={t("note_info_widget.created")} value={formatDateTime(metadata?.dateCreated)} />
                <NoteInfoValue text={t("note_info_widget.modified")} value={formatDateTime(metadata?.dateModified)} />
                <NoteInfoValue text={t("note_info_widget.type")} value={<span>{note.type} {note.mime && <span>({note.mime})</span>}</span>} />
                <NoteInfoValue text={t("note_info_widget.note_id")} value={<code>{note.noteId}</code>} />
                <NoteInfoValue text={t("note_info_widget.note_size")} title={t("note_info_widget.note_size_info")} value={<NoteSizeWidget {...sizeProps} />} />
            </ul>
        </StatusBarDropdown>
    );
}

function NoteInfoValue({ text, title, value }: { text: string; title?: string, value: ComponentChildren }) {
    return (
        <li>
            <strong title={title}>{text}{": "}</strong>
            <span>{value}</span>
        </li>
    );
}
//#endregion
