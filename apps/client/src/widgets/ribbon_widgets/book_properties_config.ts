import { t } from "i18next";
import FNote from "../../entities/fnote";
import attributes from "../../services/attributes";
import { ViewTypeOptions } from "../../services/note_list_renderer"
import NoteContextAwareWidget from "../note_context_aware_widget";

interface BookConfig {
    properties: BookProperty[];
}

interface CheckBoxProperty {
    type: "checkbox",
    label: string;
    bindToLabel: string
}

interface ButtonProperty {
    type: "button",
    label: string;
    title?: string;
    icon?: string;
    onClick: (context: BookContext) => void;
}

interface NumberProperty {
    type: "number",
    label: string;
    bindToLabel: string;
    width?: number;
    min?: number;
}

interface ComboBoxProperty {
    type: "combobox",
    label: string;
    bindToLabel: string;
    options: { value: string; label: string }[];
}

export type BookProperty = CheckBoxProperty | ButtonProperty | NumberProperty | ComboBoxProperty;

interface BookContext {
    note: FNote;
    triggerCommand: NoteContextAwareWidget["triggerCommand"];
}

export const bookPropertiesConfig: Record<ViewTypeOptions, BookConfig> = {
    grid: {
        properties: []
    },
    list: {
        properties: [
            {
                label: t("book_properties.collapse"),
                title: t("book_properties.collapse_all_notes"),
                type: "button",
                icon: "bx bx-layer-minus",
                async onClick({ note, triggerCommand }) {
                    const { noteId } = note;

                    // owned is important - we shouldn't remove inherited expanded labels
                    for (const expandedAttr of note.getOwnedLabels("expanded")) {
                        await attributes.removeAttributeById(noteId, expandedAttr.attributeId);
                    }

                    triggerCommand("refreshNoteList", { noteId: noteId });
                },
            },
            {
                label: t("book_properties.expand"),
                title: t("book_properties.expand_all_children"),
                type: "button",
                icon: "bx bx-move-vertical",
                async onClick({ note, triggerCommand }) {
                    const { noteId } = note;
                    if (!note.isLabelTruthy("expanded")) {
                        await attributes.addLabel(noteId, "expanded");
                    }

                    triggerCommand("refreshNoteList", { noteId });
                },
            }
        ]
    },
    calendar: {
        properties: [
            {
                label: t("book_properties_config.hide-weekends"),
                type: "checkbox",
                bindToLabel: "calendar:hideWeekends"
            },
            {
                label: t("book_properties_config.display-week-numbers"),
                type: "checkbox",
                bindToLabel: "calendar:weekNumbers"
            }
        ]
    },
    geoMap: {
        properties: [
            {
                label: t("book_properties_config.map-style"),
                type: "combobox",
                bindToLabel: "mapStyle",
                options: [
                    { value: "openstreetmap", label: "OpenStreetMap" },
                    { value: "versatiles-colorful", label: "Versatiles Colorful (vector)" }
                ]
            }
        ]
    },
    table: {
        properties: [
            {
                label: t("book_properties_config.max-nesting-depth"),
                type: "number",
                bindToLabel: "maxNestingDepth",
                width: 65
            }
        ]
    },
    board: {
        properties: []
    }
};
