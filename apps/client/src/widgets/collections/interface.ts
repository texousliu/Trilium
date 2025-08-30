import type { ViewModeArgs } from "../view_widgets/view_mode";

export const allViewTypes = ["list", "grid", "calendar", "table", "geoMap", "board"] as const;
export type ArgsWithoutNoteId = Omit<ViewModeArgs, "noteIds">;
export type ViewTypeOptions = typeof allViewTypes[number];
