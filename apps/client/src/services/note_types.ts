import { t } from "./i18n.js";
import froca from "./froca.js";
import server from "./server.js";
import type { MenuCommandItem, MenuItem, MenuItemBadge } from "../menus/context_menu.js";
import type { NoteType } from "../entities/fnote.js";
import type { TreeCommandNames } from "../menus/tree_context_menu.js";

export interface NoteTypeMapping {
    type: NoteType;
    mime?: string;
    title: string;
    icon?: string;
    /** Indicates that this note type is part of a beta feature. */
    isBeta?: boolean;
    /** Indicates that this note type cannot be created by the user. */
    reserved?: boolean;
    /** Indicates that once a note of this type is created, its type can no longer be changed. */
    static?: boolean;
}

export const NOTE_TYPES: NoteTypeMapping[] = [
    // The suggested note type ordering method: insert the item into the corresponding group,
    // then ensure the items within the group are ordered alphabetically.

    // The default note type (always the first item)
    { type: "text", mime: "text/html", title: t("note_types.text"), icon: "bx-note" },

    // Text notes group
    { type: "book", mime: "", title: t("note_types.book"), icon: "bx-book" },

    // Graphic notes
    { type: "canvas", mime: "application/json", title: t("note_types.canvas"), icon: "bx-pen" },
    { type: "mermaid", mime: "text/mermaid", title: t("note_types.mermaid-diagram"), icon: "bx-selection" },

    // Map notes
    { type: "geoMap", mime: "application/json", title: t("note_types.geo-map"), icon: "bx-map-alt", isBeta: true },
    { type: "mindMap", mime: "application/json", title: t("note_types.mind-map"), icon: "bx-sitemap" },
    { type: "noteMap", mime: "", title: t("note_types.note-map"), icon: "bxs-network-chart", static: true },
    { type: "relationMap", mime: "application/json", title: t("note_types.relation-map"), icon: "bxs-network-chart" },

    // Misc note types
    { type: "render", mime: "", title: t("note_types.render-note"), icon: "bx-extension" },
    { type: "search", title: t("note_types.saved-search"), icon: "bx-file-find", static: true },
    { type: "webView", mime: "", title: t("note_types.web-view"), icon: "bx-globe-alt" },

    // Code notes
    { type: "code", mime: "text/plain", title: t("note_types.code"), icon: "bx-code" },

    // Reserved types (cannot be created by the user)
    { type: "contentWidget", mime: "", title: t("note_types.widget"), reserved: true },
    { type: "doc", mime: "", title: t("note_types.doc"), reserved: true },
    { type: "file", title: t("note_types.file"), reserved: true },
    { type: "image", title: t("note_types.image"), reserved: true },
    { type: "launcher", mime: "", title: t("note_types.launcher"), reserved: true },
    { type: "aiChat", mime: "application/json", title: t("note_types.ai-chat"), reserved: true }
];

const SEPARATOR = { title: "----" };

async function getNoteTypeItems(command?: TreeCommandNames) {
    const items: MenuItem<TreeCommandNames>[] = [
        ...getBlankNoteTypes(command),
        ...await getBuiltInTemplates(command),
        ...await getUserTemplates(command)
    ];

    return items;
}

function getBlankNoteTypes(command): MenuItem<TreeCommandNames>[] {
    return NOTE_TYPES.filter((nt) => !nt.reserved).map((nt) => {
        const menuItem: MenuCommandItem<TreeCommandNames> = {
            title: nt.title,
            command,
            type: nt.type,
            uiIcon: "bx " + nt.icon,
            badges: []
        }

        if (nt.isBeta) {
            menuItem.badges?.push({title: t("note_types.beta-feature")});
        }

        return menuItem;
    });
}

async function getUserTemplates(command?: TreeCommandNames) {
    const templateNoteIds = await server.get<string[]>("search-templates");
    const templateNotes = await froca.getNotes(templateNoteIds);
    if (templateNotes.length === 0) {
        return [];
    }

    const items: MenuItem<TreeCommandNames>[] = [
        SEPARATOR
    ];
    for (const templateNote of templateNotes) {
        items.push({
            title: templateNote.title,
            uiIcon: templateNote.getIcon(),
            command: command,
            type: templateNote.type,
            templateNoteId: templateNote.noteId
        });
    }
    return items;
}

async function getBuiltInTemplates(command?: TreeCommandNames) {
    const templatesRoot = await froca.getNote("_templates");
    if (!templatesRoot) {
        console.warn("Unable to find template root.");
        return [];
    }

    const childNotes = await templatesRoot.getChildNotes();
    if (childNotes.length === 0) {
        return [];
    }

    const items: MenuItem<TreeCommandNames>[] = [
        SEPARATOR
    ];
    for (const templateNote of childNotes) {
        items.push({
            title: templateNote.title,
            uiIcon: templateNote.getIcon(),
            command: command,
            type: templateNote.type,
            templateNoteId: templateNote.noteId
        });
    }
    return items;
}

export default {
    getNoteTypeItems
};
