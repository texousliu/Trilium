import "./StatusBar.css";

import { Locale } from "@triliumnext/commons";
import clsx from "clsx";
import { type ComponentChildren } from "preact";
import { createPortal } from "preact/compat";
import { useContext, useMemo, useRef, useState } from "preact/hooks";

import { CommandNames } from "../../components/app_context";
import NoteContext from "../../components/note_context";
import FNote from "../../entities/fnote";
import attributes from "../../services/attributes";
import { t } from "../../services/i18n";
import { ViewScope } from "../../services/link";
import { openInAppHelpFromUrl } from "../../services/utils";
import { formatDateTime } from "../../utils/formatters";
import { BacklinksList, useBacklinkCount } from "../FloatingButtonsDefinitions";
import Dropdown, { DropdownProps } from "../react/Dropdown";
import { FormDropdownDivider, FormListItem } from "../react/FormList";
import { useActiveNoteContext, useLegacyImperativeHandlers, useStaticTooltip, useTriliumEvent, useTriliumEvents } from "../react/hooks";
import Icon from "../react/Icon";
import { ParentComponent } from "../react/react_utils";
import { ContentLanguagesModal, useLanguageSwitcher } from "../ribbon/BasicPropertiesTab";
import AttributeEditor, { AttributeEditorImperativeHandlers } from "../ribbon/components/AttributeEditor";
import InheritedAttributesTab from "../ribbon/InheritedAttributesTab";
import { NoteSizeWidget, useNoteMetadata } from "../ribbon/NoteInfoTab";
import { NotePathsWidget, useSortedNotePaths } from "../ribbon/NotePathsTab";
import { useAttachments } from "../type_widgets/Attachment";
import { useProcessedLocales } from "../type_widgets/options/components/LocaleSelector";
import Breadcrumb from "./Breadcrumb";

interface StatusBarContext {
    note: FNote;
    notePath: string | null | undefined;
    noteContext: NoteContext;
    viewScope?: ViewScope;
    hoistedNoteId?: string;
}

export default function StatusBar() {
    const { note, notePath, noteContext, viewScope, hoistedNoteId } = useActiveNoteContext();
    const [ attributesShown, setAttributesShown ] = useState(false);
    const context: StatusBarContext | undefined | null = note && noteContext && { note, notePath, noteContext, viewScope, hoistedNoteId };
    const attributesContext: AttributesProps | undefined | null = context && { ...context, attributesShown, setAttributesShown };

    return (
        <div className="status-bar">
            {attributesContext && <AttributesPane {...attributesContext} />}

            <div className="status-bar-main-row">
                {context && attributesContext && <>
                    <Breadcrumb {...context} />

                    <div className="actions-row">
                        <NotePaths {...context} />
                        <AttributesButton {...attributesContext} />
                        <AttachmentCount {...context} />
                        <BacklinksBadge {...context} />
                        <LanguageSwitcher {...context} />
                        <NoteInfoBadge {...context} />
                    </div>
                </>}
            </div>
        </div>
    );
}

function StatusBarDropdown({ children, icon, text, buttonClassName, titleOptions, dropdownOptions, ...dropdownProps }: Omit<DropdownProps, "hideToggleArrow" | "title" | "titlePosition"> & {
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
            dropdownOptions={{
                ...dropdownOptions,
                autoClose: "outside"
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

interface StatusBarButtonBaseProps {
    className?: string;
    icon: string;
    title: string;
    text?: string | number;
    disabled?: boolean;
    active?: boolean;
}

type StatusBarButtonWithCommand = StatusBarButtonBaseProps & { triggerCommand: CommandNames; };
type StatusBarButtonWithClick = StatusBarButtonBaseProps & { onClick: () => void; };

function StatusBarButton({ className, icon, text, title, active, ...restProps }: StatusBarButtonWithCommand | StatusBarButtonWithClick) {
    const parentComponent = useContext(ParentComponent);
    const buttonRef = useRef<HTMLButtonElement>(null);
    useStaticTooltip(buttonRef, {
        placement: "top",
        fallbackPlacements: [ "top" ],
        popperConfig: { strategy: "fixed" },
        title
    });

    return (
        <button
            ref={buttonRef}
            className={clsx("btn select-button focus-outline", className, active && "active")}
            type="button"
            onClick={() => {
                if ("triggerCommand" in restProps) {
                    parentComponent?.triggerCommand(restProps.triggerCommand);
                } else {
                    restProps.onClick();
                }
            }}
        >
            <Icon icon={icon} />&nbsp;{text}
        </button>
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
                {processedLocales.map((locale, index) => {
                    if (typeof locale === "object") {
                        return <FormListItem
                            key={locale.id}
                            rtl={locale.rtl}
                            checked={locale.id === currentNoteLanguage}
                            onClick={() => setCurrentNoteLanguage(locale.id)}
                        >{locale.name}</FormListItem>;
                    } else {
                        return <FormDropdownDivider key={`divider-${index}`} />;
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

//#region Backlinks
function BacklinksBadge({ note, viewScope }: StatusBarContext) {
    const count = useBacklinkCount(note, viewScope?.viewMode === "default");
    return (note && count > 0 &&
        <StatusBarDropdown
            className="backlinks-badge backlinks-widget"
            icon="bx bx-revision"
            text={count}
            title={t("status_bar.backlinks_title", { count })}
            dropdownContainerClassName="backlinks-items"
        >
            <BacklinksList note={note} />
        </StatusBarDropdown>
    );
}
//#endregion

//#region Attachment count
function AttachmentCount({ note }: StatusBarContext) {
    const attachments = useAttachments(note);
    const count = attachments.length;

    return (note && count > 0 &&
        <StatusBarButton
            className="attachment-count-button"
            icon="bx bx-paperclip"
            text={count}
            title={t("status_bar.attachments_title", { count })}
            triggerCommand="showAttachments"
        />
    );
}
//#endregion

//#region Attributes
interface AttributesProps extends StatusBarContext {
    attributesShown: boolean;
    setAttributesShown: (shown: boolean) => void;
}

function AttributesButton({ note, attributesShown, setAttributesShown }: AttributesProps) {
    const [ count, setCount ] = useState(note.attributes.length);

    // React to changes in count.
    useTriliumEvent("entitiesReloaded", (({loadResults}) => {
        if (loadResults.getAttributeRows().some(attr => attributes.isAffecting(attr, note))) {
            setCount(note.attributes.length);
        }
    }));

    return (
        <StatusBarButton
            className="attributes-button"
            icon="bx bx-list-check"
            title={t("status_bar.attributes_title")}
            text={t("status_bar.attributes", { count })}
            active={attributesShown}
            onClick={() => setAttributesShown(!attributesShown)}
        />
    );
}

function AttributesPane({ note, noteContext, attributesShown, setAttributesShown }: AttributesProps) {
    const parentComponent = useContext(ParentComponent);
    const api = useRef<AttributeEditorImperativeHandlers>(null);

    const context = parentComponent && {
        componentId: parentComponent.componentId,
        note,
        hidden: !note
    };

    // Show on keyboard shortcuts.
    useTriliumEvents([ "addNewLabel", "addNewRelation" ], () => setAttributesShown(true));

    // Interaction with the attribute editor.
    useLegacyImperativeHandlers(useMemo(() => ({
        saveAttributesCommand: () => api.current?.save(),
        reloadAttributesCommand: () => api.current?.refresh(),
        updateAttributeListCommand: ({ attributes }) => api.current?.renderOwnedAttributes(attributes)
    }), [ api ]));

    return (context &&
        <div className={clsx("attribute-list", !attributesShown && "hidden-ext")}>
            <InheritedAttributesTab {...context} />

            <AttributeEditor
                {...context}
                api={api}
                ntxId={noteContext.ntxId}
            />
        </div>
    );
}
//#endregion

//#region Note paths
function NotePaths({ note, hoistedNoteId, notePath }: StatusBarContext) {
    const sortedNotePaths = useSortedNotePaths(note, hoistedNoteId);

    return (
        <StatusBarDropdown
            title={t("status_bar.note_paths_title")}
            dropdownContainerClassName="dropdown-note-paths"
            icon="bx bx-link-alt"
            text={sortedNotePaths?.length}
        >
            <NotePathsWidget
                sortedNotePaths={sortedNotePaths}
                currentNotePath={notePath}
            />
        </StatusBarDropdown>
    );
}
//#endregion
