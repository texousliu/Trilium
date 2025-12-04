import CalendarWidget from "../buttons/calendar.js";
import SyncStatusWidget from "../sync_status.js";
import BasicWidget, { wrapReactWidgets } from "../basic_widget.js";
import ScriptLauncher from "../buttons/launcher/script_launcher.js";
import utils, { isMobile } from "../../services/utils.js";
import type FNote from "../../entities/fnote.js";
import BookmarkButtons from "../launch_bar/BookmarkButtons.jsx";
import SpacerWidget from "../launch_bar/SpacerWidget.jsx";
import HistoryNavigationButton from "../launch_bar/HistoryNavigation.jsx";
import AiChatButton from "../launch_bar/AiChatButton.jsx";
import ProtectedSessionStatusWidget from "../launch_bar/ProtectedSessionStatusWidget.jsx";
import { VNode } from "preact";
import { CommandButton, CustomNoteLauncher, NoteLauncher } from "../launch_bar/GenericButtons.jsx";
import date_notes from "../../services/date_notes.js";
import { useLegacyWidget, useNoteContext } from "../react/hooks.jsx";
import QuickSearchWidget from "../quick_search.js";
import { ParentComponent } from "../react/react_utils.jsx";
import { useContext } from "preact/hooks";

interface InnerWidget extends BasicWidget {
    settings?: {
        titlePlacement: "bottom";
    };
}

export default class LauncherWidget extends BasicWidget {
    private innerWidget!: InnerWidget;
    private isHorizontalLayout: boolean;

    constructor(isHorizontalLayout: boolean) {
        super();

        this.isHorizontalLayout = isHorizontalLayout;
    }

    isEnabled() {
        return this.innerWidget.isEnabled();
    }

    doRender() {
        this.$widget = this.innerWidget.render();
    }

    async initLauncher(note: FNote) {
        if (note.type !== "launcher") {
            throw new Error(`Note '${note.noteId}' '${note.title}' is not a launcher even though it's in the launcher subtree`);
        }

        if (!utils.isDesktop() && note.isLabelTruthy("desktopOnly")) {
            return false;
        }

        const launcherType = note.getLabelValue("launcherType");

        if (glob.TRILIUM_SAFE_MODE && launcherType === "customWidget") {
            return false;
        }

        let widget: BasicWidget | VNode;
        if (launcherType === "command") {
            widget = wrapReactWidgets<BasicWidget>([ <CommandButton launcherNote={note} /> ])[0];
        } else if (launcherType === "note") {
            widget = wrapReactWidgets<BasicWidget>([ <NoteLauncher launcherNote={note} /> ])[0];
        } else if (launcherType === "script") {
            widget = new ScriptLauncher(note).class("launcher-button");
        } else if (launcherType === "customWidget") {
            widget = await this.initCustomWidget(note);
        } else if (launcherType === "builtinWidget") {
            widget = wrapReactWidgets<BasicWidget>([ this.initBuiltinWidget(note) ])[0];
        } else {
            throw new Error(`Unrecognized launcher type '${launcherType}' for launcher '${note.noteId}' title '${note.title}'`);
        }

        if (!widget) {
            throw new Error(`Unknown initialization error for note '${note.noteId}', title '${note.title}'`);
        }

        this.child(widget);
        this.innerWidget = widget as InnerWidget;
        if (this.isHorizontalLayout && this.innerWidget.settings) {
            this.innerWidget.settings.titlePlacement = "bottom";
        }

        return true;
    }

    async initCustomWidget(note: FNote) {
        const widget = await note.getRelationTarget("widget");

        if (widget) {
            return await widget.executeScript();
        } else {
            throw new Error(`Custom widget of launcher '${note.noteId}' '${note.title}' is not defined.`);
        }
    }

    initBuiltinWidget(note: FNote) {
        const builtinWidget = note.getLabelValue("builtinWidget");
        switch (builtinWidget) {
            case "calendar":
                return new CalendarWidget(note.title, note.getIcon());
            case "spacer":
                // || has to be inside since 0 is a valid value
                const baseSize = parseInt(note.getLabelValue("baseSize") || "40");
                const growthFactor = parseInt(note.getLabelValue("growthFactor") || "100");

                return <SpacerWidget baseSize={baseSize} growthFactor={growthFactor} />;
            case "bookmarks":
                return <BookmarkButtons isHorizontalLayout={this.isHorizontalLayout} />
            case "protectedSession":
                return <ProtectedSessionStatusWidget />
            case "syncStatus":
                return new SyncStatusWidget();
            case "backInHistoryButton":
                return <HistoryNavigationButton launcherNote={note} command="backInNoteHistory" />
            case "forwardInHistoryButton":
                return <HistoryNavigationButton launcherNote={note} command="forwardInNoteHistory" />
            case "todayInJournal":
                return <TodayLauncher launcherNote={note} />
            case "quickSearch":
                return <QuickSearchLauncherWidget isHorizontalLayout={this.isHorizontalLayout} />
            case "aiChatLauncher":
                return <AiChatButton launcherNote={note} />
            default:
                throw new Error(`Unrecognized builtin widget ${builtinWidget} for launcher ${note.noteId} "${note.title}"`);
        }
    }
}

function TodayLauncher({ launcherNote }: { launcherNote: FNote }) {
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

function QuickSearchLauncherWidget({ isHorizontalLayout }: { isHorizontalLayout: boolean }) {
    const [ widgetEl ] = useLegacyWidget(() => new QuickSearchWidget());
    const parentComponent = useContext(ParentComponent) as BasicWidget | null;
    const isEnabled = isHorizontalLayout && !isMobile();
    parentComponent?.contentSized();

    return (
        <div>
            {isEnabled && widgetEl}
        </div>
    )
}
