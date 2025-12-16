import "./Breadcrumb.css";

import { useContext, useRef, useState } from "preact/hooks";
import { Fragment } from "preact/jsx-runtime";

import appContext from "../../components/app_context";
import NoteContext from "../../components/note_context";
import FNote from "../../entities/fnote";
import contextMenu from "../../menus/context_menu";
import link_context_menu from "../../menus/link_context_menu";
import attributes from "../../services/attributes";
import branches from "../../services/branches";
import { executeBulkActions } from "../../services/bulk_action";
import { copyTextWithToast } from "../../services/clipboard_ext";
import { getReadableTextColor } from "../../services/css_class_manager";
import froca from "../../services/froca";
import hoisted_note from "../../services/hoisted_note";
import { t } from "../../services/i18n";
import note_create from "../../services/note_create";
import ActionButton from "../react/ActionButton";
import { Badge } from "../react/Badge";
import Dropdown from "../react/Dropdown";
import { FormListItem } from "../react/FormList";
import { useChildNotes, useNote, useNoteIcon, useNoteLabel, useNoteLabelBoolean, useNoteProperty, useStaticTooltip } from "../react/hooks";
import Icon from "../react/Icon";
import NoteLink from "../react/NoteLink";
import { ParentComponent } from "../react/react_utils";

const COLLAPSE_THRESHOLD = 5;
const INITIAL_ITEMS = 2;
const FINAL_ITEMS = 2;

export default function Breadcrumb({ note, noteContext }: { note: FNote, noteContext: NoteContext }) {
    const notePath = buildNotePaths(noteContext);

    return (
        <div className="breadcrumb">
            {notePath.length > COLLAPSE_THRESHOLD ? (
                <>
                    {notePath.slice(0, INITIAL_ITEMS).map((item, index) => (
                        <Fragment key={item}>
                            <BreadcrumbItem index={index} notePath={item} notePathLength={notePath.length} noteContext={noteContext} />
                            <BreadcrumbSeparator notePath={item} activeNotePath={notePath[index + 1]} noteContext={noteContext} />
                        </Fragment>
                    ))}
                    <BreadcrumbCollapsed items={notePath.slice(INITIAL_ITEMS, -FINAL_ITEMS)} noteContext={noteContext} />
                    {notePath.slice(-FINAL_ITEMS).map((item, index) => (
                        <Fragment key={item}>
                            <BreadcrumbSeparator notePath={notePath[notePath.length - FINAL_ITEMS - (1 - index)]} activeNotePath={item} noteContext={noteContext} />
                            <BreadcrumbItem index={notePath.length - FINAL_ITEMS + index} notePath={item} notePathLength={notePath.length} noteContext={noteContext} />
                        </Fragment>
                    ))}
                </>
            ) : (
                notePath.map((item, index) => (
                    <Fragment key={item}>
                        {index === 0
                            ? <BreadcrumbRoot noteContext={noteContext} />
                            : <BreadcrumbItem index={index} notePath={item} notePathLength={notePath.length} noteContext={noteContext} />
                        }
                        {(index < notePath.length - 1 || note?.hasChildren()) &&
                            <BreadcrumbSeparator notePath={item} activeNotePath={notePath[index + 1]} noteContext={noteContext} />}
                    </Fragment>
                ))
            )}
        </div>
    );
}

function BreadcrumbRoot({ noteContext }: { noteContext: NoteContext | undefined }) {
    const noteId = noteContext?.hoistedNoteId ?? "root";
    if (noteId !== "root") {
        return <BreadcrumbHoistedNoteRoot noteId={noteId} />;
    }

    // Root note is icon only.
    const note = froca.getNoteFromCache("root");
    return (note &&
        <ActionButton
            className="root-note"
            icon={note.getIcon()}
            text={""}
            onClick={() => noteContext?.setNote(note.noteId)}
            onContextMenu={(e) => {
                e.preventDefault();
                link_context_menu.openContextMenu(note.noteId, e);
            }}
        />
    );

}

function BreadcrumbHoistedNoteRoot({ noteId }: { noteId: string }) {
    const note = useNote(noteId);
    const noteIcon = useNoteIcon(note);
    const [ workspace ] = useNoteLabelBoolean(note, "workspace");
    const [ workspaceIconClass ] = useNoteLabel(note, "workspaceIconClass");
    const [ workspaceColor ] = useNoteLabel(note, "workspaceTabBackgroundColor");

    // Hoisted workspace shows both text and icon and a way to exit easily out of the hoisting.
    return (note &&
        <>
            <Badge
                className="badge-hoisted"
                icon={workspace ? (workspaceIconClass || noteIcon) : "bx bxs-chevrons-up"}
                text={workspace ? t("breadcrumb.workspace_badge") : t("breadcrumb.hoisted_badge")}
                tooltip={t("breadcrumb.hoisted_badge_title")}
                onClick={() => hoisted_note.unhoist()}
                style={workspaceColor ? {
                    "--color": workspaceColor,
                    "color": getReadableTextColor(workspaceColor)
                } : undefined}
            />
            <NoteLink
                notePath={noteId}
                showNoteIcon
                noPreview
            />
        </>
    );
}

function BreadcrumbLastItem({ notePath }: { notePath: string }) {
    const linkRef = useRef<HTMLAnchorElement>(null);
    const noteId = notePath.split("/").at(-1);
    const [ note ] = useState(() => froca.getNoteFromCache(noteId!));
    const title = useNoteProperty(note, "title");
    useStaticTooltip(linkRef, {
        placement: "top",
        title: t("breadcrumb.scroll_to_top_title")
    });

    if (!note) return null;

    return (
        <a
            ref={linkRef}
            href="#"
            className="breadcrumb-last-item tn-link"
            onClick={() => {
                const activeNtxId = appContext.tabManager.activeNtxId;
                const scrollingContainer = document.querySelector(`[data-ntx-id="${activeNtxId}"] .scrolling-container`);
                scrollingContainer?.scrollTo({ top: 0, behavior: "smooth" });
            }}
        >{title}</a>
    );
}

function BreadcrumbItem({ index, notePath, noteContext, notePathLength }: { index: number, notePathLength: number, notePath: string, noteContext: NoteContext | undefined }) {
    const parentComponent = useContext(ParentComponent);

    if (index === 0) {
        return <BreadcrumbRoot noteContext={noteContext} />;
    }

    if (index === notePathLength - 1) {
        return <>
            <BreadcrumbLastItem notePath={notePath} />
        </>;
    }

    return <NoteLink
        notePath={notePath}
        noContextMenu
        onContextMenu={async (e) => {
            e.preventDefault();

            const notePathComponents = notePath.split("/");
            const parentNoteId = notePathComponents.at(-2);
            const noteId = notePathComponents.at(-1);
            if (!parentNoteId || !noteId) return;

            const branchId = await froca.getBranchId(parentNoteId, noteId);
            if (!branchId) return;
            const branch = froca.getBranch(branchId);
            if (!branch) return;

            const note = await branch?.getNote();
            if (!note) return;

            const notSearch = note?.type !== "search";
            const notOptionsOrHelp = !note?.noteId.startsWith("_options") && !note?.noteId.startsWith("_help");
            const isArchived = note.isArchived;
            const isNotRoot = note?.noteId !== "root";
            const isHoisted = note?.noteId === appContext.tabManager.getActiveContext()?.hoistedNoteId;
            const parentNote = isNotRoot && branch ? await froca.getNote(branch.parentNoteId) : null;
            const parentNotSearch = !parentNote || parentNote.type !== "search";

            contextMenu.show({
                items: [
                    ...link_context_menu.getItems(e),
                    {
                        title: `${t("tree-context-menu.hoist-note")}`,
                        command: "toggleNoteHoisting",
                        uiIcon: "bx bxs-chevrons-up",
                        enabled: notSearch
                    },
                    { kind: "separator" },
                    {
                        title: t("tree-context-menu.move-to"),
                        command: "moveNotesTo",
                        uiIcon: "bx bx-transfer",
                        enabled: isNotRoot && !isHoisted && parentNotSearch
                    },
                    {
                        title: t("tree-context-menu.clone-to"),
                        command: "cloneNotesTo",
                        uiIcon: "bx bx-duplicate",
                        enabled: isNotRoot && !isHoisted
                    },
                    { kind: "separator" },
                    { title: t("tree-context-menu.copy-note-path-to-clipboard"), command: "copyNotePathToClipboard", uiIcon: "bx bx-directions", enabled: true },
                    { title: t("tree-context-menu.recent-changes-in-subtree"), command: "recentChangesInSubtree", uiIcon: "bx bx-history", enabled: notOptionsOrHelp },
                    { kind: "separator" },
                    {
                        title: t("tree-context-menu.duplicate"),
                        command: "duplicateSubtree",
                        uiIcon: "bx bx-outline",
                        enabled: parentNotSearch && isNotRoot && !isHoisted && notOptionsOrHelp && note.isContentAvailable(),
                        handler: () => note_create.duplicateSubtree(noteId, branch.parentNoteId)
                    },

                    {
                        title: !isArchived ? t("tree-context-menu.archive") : t("tree-context-menu.unarchive"),
                        uiIcon: !isArchived ? "bx bx-archive" : "bx bx-archive-out",
                        handler: () => {
                            if (!isArchived) {
                                attributes.addLabel(note.noteId, "archived");
                            } else {
                                attributes.removeOwnedLabelByName(note, "archived");
                            }
                        }
                    },
                    {
                        title: t("tree-context-menu.delete"),
                        command: "deleteNotes",
                        uiIcon: "bx bx-trash destructive-action-icon",
                        enabled: isNotRoot && !isHoisted && parentNotSearch && notOptionsOrHelp,
                        handler: () => branches.deleteNotes([ branchId ])
                    }
                ],
                x: e.pageX,
                y: e.pageY,
                selectMenuItemHandler: ({ command }) => {
                    if (link_context_menu.handleLinkContextMenuItem(command, e, note.noteId)) {
                        return;
                    }

                    if (!command) return;
                    switch (command) {
                        case "copyNotePathToClipboard":
                            copyTextWithToast(`#${notePath}`);
                            break;
                        case "recentChangesInSubtree":
                            parentComponent?.triggerCommand("showRecentChanges", { ancestorNoteId: noteId });
                            break;
                        default:
                            parentComponent?.triggerCommand(command, {
                                noteId,
                                selectedOrActiveBranchIds: [ branchId ],
                                selectedOrActiveNoteIds: [ noteId ]
                            });
                    }
                },
            });
        }}
    />;
}

function BreadcrumbSeparator({ notePath, noteContext, activeNotePath }: { notePath: string, activeNotePath: string, noteContext: NoteContext | undefined }) {
    return (
        <Dropdown
            text={<Icon icon="bx bx-chevron-right" />}
            noSelectButtonStyle
            buttonClassName="icon-action"
            hideToggleArrow
            dropdownOptions={{  popperConfig: { strategy: "fixed", placement: "top" } }}
        >
            <BreadcrumbSeparatorDropdownContent notePath={notePath} noteContext={noteContext} activeNotePath={activeNotePath} />
        </Dropdown>
    );
}

function BreadcrumbSeparatorDropdownContent({ notePath, noteContext, activeNotePath }: { notePath: string, activeNotePath: string, noteContext: NoteContext | undefined }) {
    const notePathComponents = notePath.split("/");
    const parentNoteId = notePathComponents.at(-1);
    const childNotes = useChildNotes(parentNoteId);

    return (
        <ul className="breadcrumb-child-list">
            {childNotes.map((note) => {
                if (note.noteId === "_hidden") return;

                const childNotePath = `${notePath}/${note.noteId}`;
                return <li key={note.noteId}>
                    <FormListItem
                        icon={note.getIcon()}
                        onClick={() => noteContext?.setNote(childNotePath)}
                    >
                        {childNotePath !== activeNotePath
                            ? <span>{note.title}</span>
                            : <strong>{note.title}</strong>}
                    </FormListItem>
                </li>;
            })}
        </ul>
    );
}

function BreadcrumbCollapsed({ items, noteContext }: { items: string[], noteContext: NoteContext | undefined }) {
    return (
        <Dropdown
            text={<Icon icon="bx bx-dots-horizontal-rounded" />}
            noSelectButtonStyle
            buttonClassName="icon-action"
            hideToggleArrow
            dropdownOptions={{ popperConfig: { strategy: "fixed" } }}
        >
            <ul className="breadcrumb-child-list">
                {items.map((notePath) => {
                    const notePathComponents = notePath.split("/");
                    const noteId = notePathComponents[notePathComponents.length - 1];
                    const note = froca.getNoteFromCache(noteId);
                    if (!note) return null;

                    return <li key={note.noteId}>
                        <FormListItem
                            icon={note.getIcon()}
                            onClick={() => noteContext?.setNote(notePath)}
                        >
                            <span>{note.title}</span>
                        </FormListItem>
                    </li>;
                })}
            </ul>
        </Dropdown>
    );
}

function buildNotePaths(noteContext: NoteContext) {
    const notePathArray = noteContext.notePathArray;
    if (!notePathArray) return [];

    let prefix = "";
    let output: string[] = [];
    let pos = 0;
    let hoistedNotePos = -1;
    for (const notePath of notePathArray) {
        if (noteContext.hoistedNoteId !== "root" && notePath === noteContext.hoistedNoteId) {
            hoistedNotePos = pos;
        }
        output.push(`${prefix}${notePath}`);
        prefix += `${notePath}/`;
        pos++;
    }

    // When hoisted, display only the path starting with the hoisted note.
    if (noteContext.hoistedNoteId !== "root" && hoistedNotePos > -1) {
        output = output.slice(hoistedNotePos);
    }

    return output;
}
