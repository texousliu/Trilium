import { t } from "i18next";
import FNote from "../../entities/fnote";
import attributes from "../../services/attributes";
import NoteContextAwareWidget from "../note_context_aware_widget";
import { DEFAULT_MAP_LAYER_NAME, MAP_LAYERS, type MapLayer } from "../collections/geomap/map_layer";
import { ViewTypeOptions } from "../collections/interface";
import { FilterLabelsByType } from "@triliumnext/commons";
import { DEFAULT_THEME, getPresentationThemes } from "../collections/presentation/themes";

interface BookConfig {
    properties: BookProperty[];
}

export interface CheckBoxProperty {
    type: "checkbox",
    label: string;
    bindToLabel: FilterLabelsByType<boolean>
}

export interface ButtonProperty {
    type: "button",
    label: string;
    title?: string;
    icon?: string;
    onClick(context: BookContext): void;
}

export interface SplitButtonProperty extends Omit<ButtonProperty, "type"> {
    type: "split-button";
    items: ({
        label: string;
        onClick(context: BookContext): void;
    } | {
        type: "separator"
    })[];
}

export interface NumberProperty {
    type: "number",
    label: string;
    bindToLabel: FilterLabelsByType<number>;
    width?: number;
    min?: number;
    disabled?: (note: FNote) => boolean;
}

interface ComboBoxItem {
    value: string;
    label: string;
}

interface ComboBoxGroup {
    title: string;
    items: ComboBoxItem[];
}

export interface ComboBoxProperty {
    type: "combobox",
    label: string;
    bindToLabel: FilterLabelsByType<string>;
    /**
     * The default value is used when the label is not set.
     */
    defaultValue?: string;
    options: (ComboBoxItem | ComboBoxGroup)[];
}

export type BookProperty = CheckBoxProperty | ButtonProperty | NumberProperty | ComboBoxProperty | SplitButtonProperty;

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

                    triggerCommand("refreshNoteList", { noteId });
                },
            },
            {
                label: t("book_properties.expand"),
                title: t("book_properties.expand_all_children"),
                type: "split-button",
                icon: "bx bx-move-vertical",
                onClick: buildExpandListHandler(1),
                items: [
                    {
                        label: "Expand 1 level",
                        onClick: buildExpandListHandler(1)
                    },
                    { type: "separator" },
                    {
                        label: "Expand 2 levels",
                        onClick: buildExpandListHandler(2),
                    },
                    {
                        label: "Expand 3 levels",
                        onClick: buildExpandListHandler(3),
                    },
                    {
                        label: "Expand 4 levels",
                        onClick: buildExpandListHandler(4),
                    },
                    {
                        label: "Expand 5 levels",
                        onClick: buildExpandListHandler(5),
                    },
                    { type: "separator" },
                    {
                        label: "Expand all children",
                        onClick: buildExpandListHandler("all"),
                    }
                ]
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
                bindToLabel: "map:style",
                defaultValue: DEFAULT_MAP_LAYER_NAME,
                options: [
                    {
                        title: t("book_properties_config.raster"),
                        items: Object.entries(MAP_LAYERS)
                            .filter(([_, layer]) => layer.type === "raster")
                            .map(buildMapLayer)
                    },
                    {
                        title: t("book_properties_config.vector_light"),
                        items: Object.entries(MAP_LAYERS)
                            .filter(([_, layer]) => layer.type === "vector" && !layer.isDarkTheme)
                            .map(buildMapLayer)
                    },
                    {
                        title: t("book_properties_config.vector_dark"),
                        items: Object.entries(MAP_LAYERS)
                            .filter(([_, layer]) => layer.type === "vector" && layer.isDarkTheme)
                            .map(buildMapLayer)
                    }
                ]
            },
            {
                label: t("book_properties_config.show-scale"),
                type: "checkbox",
                bindToLabel: "map:scale"
            }
        ]
    },
    table: {
        properties: [
            {
                label: t("book_properties_config.max-nesting-depth"),
                type: "number",
                bindToLabel: "maxNestingDepth",
                width: 65,
                disabled: (note) => note.type === "search"
            }
        ]
    },
    board: {
        properties: []
    },
    presentation: {
        properties: [
            {
                label: "Theme",
                type: "combobox",
                bindToLabel: "presentation:theme",
                defaultValue: DEFAULT_THEME,
                options: getPresentationThemes().map(theme => ({
                    value: theme.id,
                    label: theme.name
                }))
            }
        ]
    }
};

function buildMapLayer([ id, layer ]: [ string, MapLayer ]): ComboBoxItem {
    return {
        value: id,
        label: layer.name
    };
}

function buildExpandListHandler(depth: number | "all") {
    return async ({ note, triggerCommand }: BookContext) => {
        const { noteId } = note;

        const existingValue = note.getLabelValue("expanded");
        let newValue: string | undefined = typeof depth === "number" ? depth.toString() : depth;
        if (depth === 1) newValue = undefined; // maintain existing behaviour
        if (newValue === existingValue) return;

        await attributes.setLabel(noteId, "expanded", newValue);
        triggerCommand("refreshNoteList", { noteId });
    }
}
