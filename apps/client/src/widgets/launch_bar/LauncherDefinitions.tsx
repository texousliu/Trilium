import { useContext, useEffect, useMemo, useState } from "preact/hooks";
import { useLegacyWidget, useNoteContext, useNoteRelationTarget } from "../react/hooks";
import { ParentComponent } from "../react/react_utils";
import BasicWidget from "../basic_widget";
import FNote from "../../entities/fnote";
import QuickSearchWidget from "../quick_search";
import { isMobile } from "../../services/utils";
import date_notes from "../../services/date_notes";
import { CustomNoteLauncher } from "./GenericButtons";
import { LaunchBarActionButton, useLauncherIconAndTitle } from "./launch_bar_widgets";

export function ScriptLauncher({ launcherNote }: { launcherNote: FNote }) {
    const { icon, title } = useLauncherIconAndTitle(launcherNote);
    return (
        <LaunchBarActionButton
            icon={icon}
            text={title}
            onClick={async () => {
                if (launcherNote.isLabelTruthy("scriptInLauncherContent")) {
                    await launcherNote.executeScript();
                } else {
                    const script = await launcherNote.getRelationTarget("script");
                    if (script) {
                        await script.executeScript();
                    }
                }
            }}
        />
    )
}

export function TodayLauncher({ launcherNote }: { launcherNote: FNote }) {
    return (
        <CustomNoteLauncher
            launcherNote={launcherNote}
            getTargetNoteId={async () => {
                const todayNote = await date_notes.getTodayNote();
                return todayNote?.noteId ?? null;
            }}
        />
    );
}

export function QuickSearchLauncherWidget({ isHorizontalLayout }: { isHorizontalLayout: boolean }) {
    const widget = useMemo(() => new QuickSearchWidget(), []);
    const parentComponent = useContext(ParentComponent) as BasicWidget | null;
    const isEnabled = isHorizontalLayout && !isMobile();
    parentComponent?.contentSized();

    return (
        <div>
            {isEnabled && <LegacyWidgetRenderer widget={widget} />}
        </div>
    )
}

export function CustomWidget({ launcherNote }: { launcherNote: FNote }) {
    const [ widgetNote ] = useNoteRelationTarget(launcherNote, "widget");
    const [ widget, setWidget ] = useState<BasicWidget>();
    const parentComponent = useContext(ParentComponent) as BasicWidget | null;
    parentComponent?.contentSized();

    useEffect(() => {
        widgetNote?.executeScript().then(widget => {
            if (widget instanceof BasicWidget) {
                widget._noteId = widgetNote.noteId;
            }
            setWidget(widget);
        });
    }, [ widgetNote ]);

    return (
        <div>
            {widget && <LegacyWidgetRenderer widget={widget} />}
        </div>
    )
}

export function LegacyWidgetRenderer({ widget }: { widget: BasicWidget }) {
    const { noteContext } = useNoteContext();
    const [ widgetEl ] = useLegacyWidget(() => widget, {
        noteContext
    });
    return widgetEl;
}
