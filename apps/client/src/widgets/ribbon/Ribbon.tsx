import { useMemo, useState } from "preact/hooks";
import { t } from "../../services/i18n";
import { useNoteContext } from "../react/hooks";
import "./style.css";
import { VNode } from "preact";
import BasicPropertiesTab from "./BasicPropertiesTab";
import FormattingTab from "./FormattingTab";
import { numberObjectsInPlace } from "../../services/utils";
import { TabContext } from "./ribbon-interface";
import options from "../../services/options";
import { CommandNames } from "../../components/app_context";
import FNote from "../../entities/fnote";
import ScriptTab from "./ScriptTab";
import EditedNotesTab from "./EditedNotesTab";
import NotePropertiesTab from "./NotePropertiesTab";
import NoteInfoTab from "./NoteInfoTab";
import SimilarNotesTab from "./SimilarNotesTab";
import FilePropertiesTab from "./FilePropertiesTab";
import ImagePropertiesTab from "./ImagePropertiesTab";
import NotePathsTab from "./NotePathsTab";

interface TitleContext {
    note: FNote | null | undefined;
}

interface TabConfiguration {
    title: string | ((context: TitleContext) => string);
    icon: string;
    // TODO: Mark as required after porting them all.
    content?: (context: TabContext) => VNode;
    show?: boolean | ((context: TitleContext) => boolean | null | undefined);
    toggleCommand?: CommandNames;
    activate?: boolean | ((context: TitleContext) => boolean);
    /**
     * By default the tab content will not be rendered unless the tab is active (i.e. selected by the user). Setting to `true` will ensure that the tab is rendered even when inactive, for cases where the tab needs to be accessible at all times (e.g. for the detached editor toolbar).
     */
    stayInDom?: boolean;
}

const TAB_CONFIGURATION = numberObjectsInPlace<TabConfiguration>([
    {
        title: t("classic_editor_toolbar.title"),
        icon: "bx bx-text",
        show: ({ note }) => note?.type === "text" && options.get("textNoteEditorType") === "ckeditor-classic",
        toggleCommand: "toggleRibbonTabClassicEditor",
        content: FormattingTab,
        stayInDom: true
    },
    {        
        title: ({ note }) => note?.isTriliumSqlite() ? t("script_executor.query") : t("script_executor.script"),
        icon: "bx bx-play",
        content: ScriptTab,
        activate: true,
        show: ({ note }) => note &&
            (note.isTriliumScript() || note.isTriliumSqlite()) &&
            (note.hasLabel("executeDescription") || note.hasLabel("executeButton"))
    },
    {
        // SearchDefinitionWidget
        title: t("search_definition.search_parameters"),
        icon: "bx bx-search"
    },
    {
        title: t("edited_notes.title"),
        icon: "bx bx-calendar-edit",
        content: EditedNotesTab,
        show: ({ note }) => note?.hasOwnedLabel("dateNote"),
        activate: ({ note }) => (note?.getPromotedDefinitionAttributes().length === 0 || !options.is("promotedAttributesOpenInRibbon")) && options.is("editedNotesOpenInRibbon")
    },
    {
        // BookPropertiesWidget
        title: t("book_properties.book_properties"),
        icon: "bx bx-book"
    },
    {
        title: t("note_properties.info"),
        icon: "bx bx-info-square",
        content: NotePropertiesTab,
        show: ({ note }) => !!note?.getLabelValue("pageUrl"),
        activate: true
    },
    {
        title: t("file_properties.title"),
        icon: "bx bx-file",
        content: FilePropertiesTab,
        show: ({ note }) => note?.type === "file",
        toggleCommand: "toggleRibbonTabFileProperties",
        activate: true
    },
    {
        title: t("image_properties.title"),
        icon: "bx bx-image",
        content: ImagePropertiesTab,
        show: ({ note }) => note?.type === "image",
        toggleCommand: "toggleRibbonTabImageProperties",
        activate: true,
    },
    {
        // BasicProperties
        title: t("basic_properties.basic_properties"),
        icon: "bx bx-slider",
        content: BasicPropertiesTab,
        show: ({note}) => !note?.isLaunchBarConfig(),
        toggleCommand: "toggleRibbonTabBasicProperties"
    },
    {
        // OwnedAttributeListWidget
        title: t("owned_attribute_list.owned_attributes"),
        icon: "bx bx-list-check"
    },
    {
        // InheritedAttributesWidget
        title: t("inherited_attribute_list.title"),
        icon: "bx bx-list-plus"
    },
    {
        title: t("note_paths.title"),
        icon: "bx bx-collection",
        content: NotePathsTab,
        show: true,
        toggleCommand: "toggleRibbonTabNotePaths"
    },
    {
        // NoteMapRibbonWidget
        title: t("note_map.title"),
        icon: "bx bxs-network-chart"
    },
    {
        title: t("similar_notes.title"),
        icon: "bx bx-bar-chart",
        show: ({ note }) => note?.type !== "search" && !note?.isLabelTruthy("similarNotesWidgetDisabled"),
        content: SimilarNotesTab,
        toggleCommand: "toggleRibbonTabSimilarNotes"
    },
    {
        title: t("note_info_widget.title"),
        icon: "bx bx-info-circle",
        show: ({ note }) => !!note,
        content: NoteInfoTab,
        toggleCommand: "toggleRibbonTabNoteInfo"
    }
]);

export default function Ribbon() {
    const { note, ntxId, hoistedNoteId, notePath } = useNoteContext();
    const titleContext: TitleContext = { note };
    const [ activeTabIndex, setActiveTabIndex ] = useState<number | undefined>();
    const filteredTabs = useMemo(() => TAB_CONFIGURATION.filter(tab => typeof tab.show === "boolean" ? tab.show : tab.show?.(titleContext)), [ titleContext, note ]);

    return (
        <div class="ribbon-container" style={{ contain: "none" }}>
            <div className="ribbon-top-row">
                <div className="ribbon-tab-container">
                    {filteredTabs.map(({ title, icon, index }) => (
                        <RibbonTab
                            icon={icon}
                            title={typeof title === "string" ? title : title(titleContext)}
                            active={index === activeTabIndex}
                            onClick={() => {
                                if (activeTabIndex !== index) {
                                    setActiveTabIndex(index);
                                } else {
                                    // Collapse
                                    setActiveTabIndex(undefined);
                                }
                            }}
                        />
                    ))}
                </div>
                <div className="ribbon-button-container"></div>
            </div>
        
            <div className="ribbon-body-container">
                <div className="ribbon-body">
                    {filteredTabs.map(tab => {
                        const isActive = tab.index === activeTabIndex;
                        if (!isActive && !tab.stayInDom) {
                            return;
                        }

                        return tab?.content && tab.content({
                            note,
                            hidden: !isActive,
                            ntxId,
                            hoistedNoteId,
                            notePath
                        });
                    })}
                </div>
            </div>
        </div>
    )
}

function RibbonTab({ icon, title, active, onClick }: { icon: string; title: string; active: boolean, onClick: () => void }) {
    return (
        <>
            <div
                className={`ribbon-tab-title ${active ? "active" : ""}`}
                onClick={onClick}
            >
                <span
                    className={`ribbon-tab-title-icon ${icon}`}
                    title={title}                    
                />
                &nbsp;
                { active && <span class="ribbon-tab-title-label">{title}</span> }
            </div>

            <div class="ribbon-tab-spacer" />
        </>
    )
}

