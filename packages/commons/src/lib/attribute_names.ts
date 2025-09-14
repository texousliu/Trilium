type Labels = {
    color: string;
    iconClass: string;
    workspaceIconClass: string;
    executeDescription: string;
    executeTitle: string;
    limit: string; // should be probably be number
    calendarRoot: boolean;
    workspaceCalendarRoot: boolean;
    archived: boolean;
    sorted: boolean;
    template: boolean;
    autoReadOnlyDisabled: boolean;
    language: string;
    originalFileName: string;
    pageUrl: string;

    // Search
    searchString: string;
    ancestorDepth: string;
    orderBy: string;
    orderDirection: string;

    // Collection-specific
    viewType: string;
    status: string;
    pageSize: number;
    geolocation: string;
    readOnly: boolean;
    expanded: boolean;
    "calendar:hideWeekends": boolean;
    "calendar:weekNumbers": boolean;
    "calendar:view": string;
    "map:style": string;
    "map:scale": boolean;
    "board:groupBy": string;
    maxNestingDepth: number;
    includeArchived: boolean;
}

export type LabelNames = keyof Labels;

export type FilterLabelsByType<U> = {
    [K in keyof Labels]: Labels[K] extends U ? K : never;
}[keyof Labels];
