import type { KeyboardActionNames } from "./keyboard_actions_interface.js";

/**
 * A dictionary where the keys are the option keys (e.g. `theme`) and their corresponding values.
 */
export type OptionMap = Record<OptionNames, string>;

/**
 * For each keyboard action, there is a corresponding option which identifies the key combination defined by the user.
 */
type KeyboardShortcutsOptions<T extends KeyboardActionNames> = {
    [key in T as `keyboardShortcuts${Capitalize<key>}`]: string;
};

export type FontFamily = "theme" | "serif" | "sans-serif" | "monospace" | string;

export interface OptionDefinitions extends KeyboardShortcutsOptions<KeyboardActionNames> {
    openNoteContexts: string;
    lastDailyBackupDate: string;
    lastWeeklyBackupDate: string;
    lastMonthlyBackupDate: string;
    dbVersion: string;
    theme: string;
    syncServerHost: string;
    syncServerTimeout: string;
    syncProxy: string;
    mainFontFamily: FontFamily;
    treeFontFamily: FontFamily;
    detailFontFamily: FontFamily;
    monospaceFontFamily: FontFamily;
    spellCheckLanguageCode: string;
    codeNotesMimeTypes: string;
    headingStyle: string;
    highlightsList: string;
    customSearchEngineName: string;
    customSearchEngineUrl: string;
    locale: string;
    formattingLocale: string;
    codeBlockTheme: string;
    textNoteEditorType: string;
    layoutOrientation: string;
    allowedHtmlTags: string;
    documentId: string;
    documentSecret: string;
    passwordVerificationHash: string;
    passwordVerificationSalt: string;
    passwordDerivedKeySalt: string;
    encryptedDataKey: string;
    hoistedNoteId: string;
    isPasswordSet: boolean;

    // AI/LLM integration options
    aiEnabled: boolean;
    aiProvider: string;
    aiSystemPrompt: string;
    aiTemperature: string;
    openaiApiKey: string;
    openaiDefaultModel: string;
    openaiEmbeddingModel: string;
    openaiBaseUrl: string;
    anthropicApiKey: string;
    anthropicDefaultModel: string;
    voyageEmbeddingModel: string;
    voyageApiKey: string;
    anthropicBaseUrl: string;
    ollamaEnabled: boolean;
    ollamaBaseUrl: string;
    ollamaDefaultModel: string;
    ollamaEmbeddingModel: string;
    codeOpenAiModel: string;
    aiProviderPrecedence: string;

    // Embedding-related options
    embeddingAutoUpdateEnabled: boolean;
    embeddingUpdateInterval: number;
    embeddingBatchSize: number;
    embeddingDefaultDimension: number;
    embeddingsDefaultProvider: string;
    embeddingProviderPrecedence: string;
    enableAutomaticIndexing: boolean;
    embeddingGenerationLocation: string;
    embeddingDimensionStrategy: string;
    embeddingSimilarityThreshold: number;
    maxNotesPerLlmQuery: number;
    splitEditorOrientation: string;

    // MFA options
    mfaEnabled: boolean;
    mfaMethod: string;

    // Additional options
    eraseEntitiesAfterTimeInSeconds: number;
    eraseEntitiesAfterTimeScale: string;
    protectedSessionTimeout: number;
    protectedSessionTimeoutTimeScale: string;
    revisionSnapshotTimeInterval: number;
    revisionSnapshotTimeIntervalTimeScale: string;
    revisionSnapshotNumberLimit: number;
    zoomFactor: number;
    codeBlockWordWrap: boolean;
    mainFontSize: number;
    treeFontSize: number;
    detailFontSize: number;
    monospaceFontSize: number;
    vimKeymapEnabled: boolean;
    codeLineWrapEnabled: boolean;
    spellCheckEnabled: boolean;
    imageMaxWidthHeight: number;
    imageJpegQuality: number;
    leftPaneWidth: number;
    rightPaneWidth: number;
    leftPaneVisible: boolean;
    rightPaneVisible: boolean;
    nativeTitleBarVisible: boolean;
    autoCollapseNoteTree: boolean;
    autoReadonlySizeText: number;
    autoReadonlySizeCode: number;
    overrideThemeFonts: boolean;
    dailyBackupEnabled: boolean;
    weeklyBackupEnabled: boolean;
    monthlyBackupEnabled: boolean;
    maxContentWidth: number;
    compressImages: boolean;
    downloadImagesAutomatically: boolean;
    minTocHeadings: number;
    checkForUpdates: boolean;
    disableTray: boolean;
    eraseUnusedAttachmentsAfterSeconds: number;
    eraseUnusedAttachmentsAfterTimeScale: string;
    promotedAttributesOpenInRibbon: boolean;
    editedNotesOpenInRibbon: boolean;
    firstDayOfWeek: number;
    languages: string;
    textNoteEditorMultilineToolbar: boolean;
    backgroundEffects: boolean;
    redirectBareDomain: boolean;
    showLoginInShareTheme: boolean;
    initialized: string;
    lastSyncedPull: string;
    lastSyncedPush: string;
    autoFixConsistencyIssues: boolean;
    hideArchivedNotes_main: boolean;
    debugModeEnabled: boolean;
    encryptedRecoveryCodes: string;
    userSubjectIdentifierSaved: boolean;
}

export type OptionNames = keyof OptionDefinitions;

export type FilterOptionsByType<U> = {
    [K in keyof OptionDefinitions]: OptionDefinitions[K] extends U ? K : never;
}[keyof OptionDefinitions];
