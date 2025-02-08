import { t } from "i18next";
import type { HiddenSubtreeItem } from "./hidden_subtree.js";

export const desktopAvailableLaunchers: HiddenSubtreeItem[] = [
    {
        id: "_lbBackInHistory",
        title: t("hidden-subtree.go-to-previous-note-title"),
        type: "launcher",
        builtinWidget: "backInHistoryButton",
        icon: "bx bxs-chevron-left",
        attributes: [{ type: "label", name: "docName", value: "launchbar_history_navigation" }]
    },
    {
        id: "_lbForwardInHistory",
        title: t("hidden-subtree.go-to-next-note-title"),
        type: "launcher",
        builtinWidget: "forwardInHistoryButton",
        icon: "bx bxs-chevron-right",
        attributes: [{ type: "label", name: "docName", value: "launchbar_history_navigation" }]
    },
    { id: "_lbBackendLog", title: t("hidden-subtree.backend-log-title"), type: "launcher", targetNoteId: "_backendLog", icon: "bx bx-terminal" }
];

export const desktopVisibleLaunchers: HiddenSubtreeItem[] = [
    { id: "_lbNewNote", title: t("hidden-subtree.new-note-title"), type: "launcher", command: "createNoteIntoInbox", icon: "bx bx-file-blank" },
    {
        id: "_lbSearch",
        title: t("hidden-subtree.search-notes-title"),
        type: "launcher",
        command: "searchNotes",
        icon: "bx bx-search",
        attributes: [{ type: "label", name: "desktopOnly" }]
    },
    {
        id: "_lbJumpTo",
        title: t("hidden-subtree.jump-to-note-title"),
        type: "launcher",
        command: "jumpToNote",
        icon: "bx bx-send",
        attributes: [{ type: "label", name: "desktopOnly" }]
    },
    { id: "_lbNoteMap", title: t("hidden-subtree.note-map-title"), type: "launcher", targetNoteId: "_globalNoteMap", icon: "bx bxs-network-chart" },
    { id: "_lbCalendar", title: t("hidden-subtree.calendar-title"), type: "launcher", builtinWidget: "calendar", icon: "bx bx-calendar" },
    {
        id: "_lbRecentChanges",
        title: t("hidden-subtree.recent-changes-title"),
        type: "launcher",
        command: "showRecentChanges",
        icon: "bx bx-history",
        attributes: [{ type: "label", name: "desktopOnly" }]
    },
    { id: "_lbSpacer1", title: t("hidden-subtree.spacer-title"), type: "launcher", builtinWidget: "spacer", baseSize: "50", growthFactor: "0" },
    { id: "_lbBookmarks", title: t("hidden-subtree.bookmarks-title"), type: "launcher", builtinWidget: "bookmarks", icon: "bx bx-bookmark" },
    { id: "_lbToday", title: t("hidden-subtree.open-today-journal-note-title"), type: "launcher", builtinWidget: "todayInJournal", icon: "bx bx-calendar-star" },
    { id: "_lbSpacer2", title: t("hidden-subtree.spacer-title"), type: "launcher", builtinWidget: "spacer", baseSize: "0", growthFactor: "1" },
    { id: "_lbQuickSearch", title: t("hidden-subtree.quick-search-title"), type: "launcher", builtinWidget: "quickSearch", icon: "bx bx-rectangle" },
    { id: "_lbProtectedSession", title: t("hidden-subtree.protected-session-title"), type: "launcher", builtinWidget: "protectedSession", icon: "bx bx bx-shield-quarter" },
    { id: "_lbSyncStatus", title: t("hidden-subtree.sync-status-title"), type: "launcher", builtinWidget: "syncStatus", icon: "bx bx-wifi" },
    { id: "_lbSettings", title: t("hidden-subtree.settings-title"), type: "launcher", command: "showOptions", icon: "bx bx-cog" }
]

export const mobileAvailableLaunchers: HiddenSubtreeItem[] = [
    // None for now.
];

export const mobileVisibleLaunchers: HiddenSubtreeItem[] = [
    {
        id: "_lbMobileBackInHistory",
        title: t("hidden-subtree.go-to-previous-note-title"),
        type: "launcher",
        builtinWidget: "backInHistoryButton",
        icon: "bx bxs-chevron-left",
        attributes: [{ type: "label", name: "docName", value: "launchbar_history_navigation" }]
    },
    {
        id: "_lbMobileForwardInHistory",
        title: t("hidden-subtree.go-to-next-note-title"),
        type: "launcher",
        builtinWidget: "forwardInHistoryButton",
        icon: "bx bxs-chevron-right",
        attributes: [{ type: "label", name: "docName", value: "launchbar_history_navigation" }]
    },
    { id: "_lbMobileJumpTo", title: t("hidden-subtree.jump-to-note-title"), type: "launcher", command: "jumpToNote", icon: "bx bx-plus-circle" }
];
