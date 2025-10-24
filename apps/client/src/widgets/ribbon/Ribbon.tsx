import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { useNoteContext, useNoteProperty, useStaticTooltipWithKeyboardShortcut, useTriliumEvents } from "../react/hooks";
import "./style.css";

import { numberObjectsInPlace } from "../../services/utils";
import { EventNames } from "../../components/app_context";
import NoteActions from "./NoteActions";
import { KeyboardActionNames } from "@triliumnext/commons";
import { RIBBON_TAB_DEFINITIONS } from "./RibbonDefinition";
import { TabConfiguration, TitleContext } from "./ribbon-interface";

const TAB_CONFIGURATION = numberObjectsInPlace<TabConfiguration>(RIBBON_TAB_DEFINITIONS);

export default function Ribbon() {
    const { note, ntxId, hoistedNoteId, notePath, noteContext, componentId } = useNoteContext();
    const noteType = useNoteProperty(note, "type");
    const titleContext: TitleContext = { note };
    const [ activeTabIndex, setActiveTabIndex ] = useState<number | undefined>();
    const computedTabs = useMemo(
        () => TAB_CONFIGURATION.map(tab => {
            const shouldShow = typeof tab.show === "boolean" ? tab.show : tab.show?.(titleContext);
            return {
                ...tab,
                shouldShow
            }
        }),
        [ titleContext, note, noteType ]);

    // Automatically activate the first ribbon tab that needs to be activated whenever a note changes.
    useEffect(() => {
        const tabToActivate = computedTabs.find(tab => tab.shouldShow && (typeof tab.activate === "boolean" ? tab.activate : tab.activate?.(titleContext)));
        setActiveTabIndex(tabToActivate?.index);
    }, [ note?.noteId ]);

    // Register keyboard shortcuts.
    const eventsToListenTo = useMemo(() => TAB_CONFIGURATION.filter(config => config.toggleCommand).map(config => config.toggleCommand) as EventNames[], []);
    useTriliumEvents(eventsToListenTo, useCallback((e, toggleCommand) => {
        const correspondingTab = computedTabs.find(tab => tab.toggleCommand === toggleCommand);
        if (correspondingTab) {
            if (activeTabIndex !== correspondingTab.index) {
                setActiveTabIndex(correspondingTab.index);
            } else {
                setActiveTabIndex(undefined);
            }
        }
    }, [ computedTabs, activeTabIndex ]));

    return (
        <div className="ribbon-container" style={{ contain: "none" }}>
            {noteContext?.viewScope?.viewMode === "default" && (
                <>
                    <div className="ribbon-top-row">
                        <div className="ribbon-tab-container">
                            {computedTabs.map(({ title, icon, index, toggleCommand, shouldShow }) => (
                                shouldShow && <RibbonTab
                                    icon={icon}
                                    title={typeof title === "string" ? title : title(titleContext)}
                                    active={index === activeTabIndex}
                                    toggleCommand={toggleCommand}
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
                        <div className="ribbon-button-container">
                            { note && <NoteActions note={note} noteContext={noteContext} /> }
                        </div>
                    </div>

                    <div className="ribbon-body-container">
                        {computedTabs.map(tab => {
                            const isActive = tab.index === activeTabIndex;
                            if (!isActive && !tab.stayInDom) {
                                return;
                            }

                            const TabContent = tab.content;

                            return (
                                <div className={`ribbon-body ${!isActive ? "hidden-ext" : ""}`}>
                                    <TabContent
                                        note={note}
                                        hidden={!isActive}
                                        ntxId={ntxId}
                                        hoistedNoteId={hoistedNoteId}
                                        notePath={notePath}
                                        noteContext={noteContext}
                                        componentId={componentId}
                                        activate={useCallback(() => {
                                            setActiveTabIndex(tab.index)
                                        }, [setActiveTabIndex])}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    )
}

function RibbonTab({ icon, title, active, onClick, toggleCommand }: { icon: string; title: string; active: boolean, onClick: () => void, toggleCommand?: KeyboardActionNames }) {
    const iconRef = useRef<HTMLDivElement>(null);
    useStaticTooltipWithKeyboardShortcut(iconRef, title, toggleCommand);

    return (
        <>
            <div
                className={`ribbon-tab-title ${active ? "active" : ""}`}
                onClick={onClick}
            >
                <span
                    ref={iconRef}
                    className={`ribbon-tab-title-icon ${icon}`}
                />
                &nbsp;
                { active && <span class="ribbon-tab-title-label">{title}</span> }
            </div>

            <div class="ribbon-tab-spacer" />
        </>
    )
}

