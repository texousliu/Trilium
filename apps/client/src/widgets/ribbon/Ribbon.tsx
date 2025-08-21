import { useState } from "preact/hooks";
import FNote from "../../entities/fnote";
import { t } from "../../services/i18n";
import { useNoteContext } from "../react/hooks";
import "./style.css";
import { VNode } from "preact";
import BasicPropertiesTab from "./BasicPropertiesTab";

type TitleFn = string | ((context: TabContext) => string);

interface TabContext {
    note: FNote | null | undefined;
}

interface TabConfiguration {
    title: TitleFn;
    icon: string;
    content?: () => VNode;
}

const TAB_CONFIGURATION: TabConfiguration[] = [
    {
        title: t("classic_editor_toolbar.title"),
        icon: "bx bx-text"
        // ClassicEditorToolbar
    },
    {        
        title: ({ note }) => note?.isTriliumSqlite() ? t("script_executor.query") : t("script_executor.script"),
        icon: "bx bx-play"
        // ScriptExecutorWidget
    },
    {
        // SearchDefinitionWidget
        title: t("search_definition.search_parameters"),
        icon: "bx bx-search"
    },
    {
        // Edited NotesWidget
        title: t("edited_notes.title"),
        icon: "bx bx-calendar-edit"
    },
    {
        // BookPropertiesWidget
        title: t("book_properties.book_properties"),
        icon: "bx bx-book"
    },
    {
        // NotePropertiesWidget
        title: t("note_properties.info"),
        icon: "bx bx-info-square"
    },
    {
        // FilePropertiesWidget
        title: t("file_properties.title"),
        icon: "bx bx-file"
    },
    {
        // ImagePropertiesWidget
        title: t("image_properties.title"),
        icon: "bx bx-image"
    },
    {
        // BasicProperties
        title: t("basic_properties.basic_properties"),
        icon: "bx bx-slider",
        content: BasicPropertiesTab
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
        // NotePathsWidget
        title: t("note_paths.title"),
        icon: "bx bx-collection"
    },
    {
        // NoteMapRibbonWidget
        title: t("note_map.title"),
        icon: "bx bxs-network-chart"
    },
    {
        // SimilarNotesWidget
        title: t("similar_notes.title"),
        icon: "bx bx-bar-chart"
    },
    {
        // NoteInfoWidget
        title: t("note_info_widget.title"),
        icon: "bx bx-info-circle"
    },
    
];

export default function Ribbon() {
    const { note } = useNoteContext();
    const context: TabContext = { note };
    const [ activeTab, setActiveTab ] = useState<number>();
    const activeTabConfiguration = activeTab ? TAB_CONFIGURATION[activeTab] : undefined;

    return (
        <div class="ribbon-container" style={{ contain: "none" }}>
            <div className="ribbon-top-row">
                <div className="ribbon-tab-container">
                    {TAB_CONFIGURATION.map(({ title, icon }, i) => (
                        <RibbonTab
                            icon={icon}
                            title={typeof title === "string" ? title : title(context)}
                            active={i === activeTab}
                            onClick={() => {
                                if (activeTab !== i) {
                                    setActiveTab(i);
                                } else {
                                    // Collapse
                                    setActiveTab(undefined);
                                }
                            }}
                        />
                    ))}
                </div>
                <div className="ribbon-button-container"></div>
            </div>
        
            <div className="ribbon-body-container">
                <div className="ribbon-body">
                    {activeTabConfiguration?.content && activeTabConfiguration.content()}
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

