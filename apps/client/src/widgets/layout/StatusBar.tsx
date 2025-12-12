import "./StatusBar.css";

import FNote from "../../entities/fnote";
import { t } from "../../services/i18n";
import { openInAppHelpFromUrl } from "../../services/utils";
import { FormDropdownDivider, FormListItem } from "../react/FormList";
import { useNoteContext } from "../react/hooks";
import { ContentLanguagesModal, NoteLanguageSelector, useLanguageSwitcher } from "../ribbon/BasicPropertiesTab";
import Breadcrumb from "./Breadcrumb";
import { useState } from "preact/hooks";
import { createPortal } from "preact/compat";
import { useProcessedLocales } from "../type_widgets/options/components/LocaleSelector";
import Dropdown, { DropdownProps } from "../react/Dropdown";
import { Locale } from "@triliumnext/commons";
import clsx from "clsx";
import Icon from "../react/Icon";

interface StatusBarContext {
    note: FNote;
}

export default function StatusBar() {
    const { note } = useNoteContext();
    const context = note && { note } satisfies StatusBarContext;

    return (
        <div className="status-bar">
            {context && <>
                <div className="breadcrumb-row">
                    <Breadcrumb />
                </div>

                <div className="actions-row">
                    <LanguageSwitcher {...context} />
                </div>
            </>}
        </div>
    );
}

function StatusBarDropdown({ children, icon, text, buttonClassName, ...dropdownProps }: Omit<DropdownProps, "hideToggleArrow"> & {
    icon?: string;
}) {
    return (
        <Dropdown
            buttonClassName={clsx("status-bar-dropdown-button", buttonClassName)}
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

function LanguageSwitcher({ note }: StatusBarContext) {
    const [ modalShown, setModalShown ] = useState(false);
    const { locales, DEFAULT_LOCALE, currentNoteLanguage, setCurrentNoteLanguage } = useLanguageSwitcher(note);
    const { activeLocale, processedLocales } = useProcessedLocales(locales, DEFAULT_LOCALE, currentNoteLanguage ?? DEFAULT_LOCALE.id);

    return (
        <>
            <StatusBarDropdown icon="bx bx-globe" text={getLocaleName(activeLocale)}>
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
            </StatusBarDropdown>
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
    if (locale.name.length <= 4) return locale.name;    // Some locales like Japanese and Chinese look better than their ID.
    return locale.id.toLocaleUpperCase();
}
