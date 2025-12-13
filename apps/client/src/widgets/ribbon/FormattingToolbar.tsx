import { useEffect, useRef, useState } from "preact/hooks";

import { useActiveNoteContext, useIsNoteReadOnly, useNoteProperty, useTriliumEvent, useTriliumOption } from "../react/hooks";
import { TabContext } from "./ribbon-interface";

/**
 * Handles the editing toolbar when the CKEditor is in decoupled mode.
 *
 * This toolbar is only enabled if the user has selected the classic CKEditor.
 *
 * The ribbon item is active by default for text notes, as long as they are not in read-only mode.
 *
 * ! The toolbar is not only used in the ribbon, but also in the quick edit feature.
 * * The mobile toolbar is handled separately (see `MobileEditorToolbar`).
 */
export default function FormattingToolbar({ hidden, ntxId }: TabContext) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [ textNoteEditorType ] = useTriliumOption("textNoteEditorType");

    // Attach the toolbar from the CKEditor.
    useTriliumEvent("textEditorRefreshed", ({ ntxId: eventNtxId, editor }) => {
        if (eventNtxId !== ntxId || !containerRef.current) return;
        const toolbar = editor.ui.view.toolbar?.element;

        if (toolbar) {
            containerRef.current.replaceChildren(toolbar);
        } else {
            containerRef.current.replaceChildren();
        }
    });

    return (textNoteEditorType === "ckeditor-classic" &&
        <div
            ref={containerRef}
            className={`classic-toolbar-widget ${hidden ? "hidden-ext" : ""}`}
        />
    );
};

const toolbarCache = new Map<string, HTMLElement | null | undefined>();

export function FixedFormattingToolbar() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [ textNoteEditorType ] = useTriliumOption("textNoteEditorType");
    const { note, noteContext, ntxId, viewScope } = useActiveNoteContext();
    const noteType = useNoteProperty(note, "type");
    const { isReadOnly } = useIsNoteReadOnly(note, noteContext);
    const shown = (
        viewScope?.viewMode === "default" &&
        textNoteEditorType === "ckeditor-classic" &&
        noteType === "text" &&
        !isReadOnly
    );
    const [ toolbarToRender, setToolbarToRender ] = useState<HTMLElement | null | undefined>();

    // Populate the cache with the toolbar of every note context.
    useTriliumEvent("textEditorRefreshed", ({ ntxId: eventNtxId, editor }) => {
        if (!eventNtxId) return;
        const toolbar = editor.ui.view.toolbar?.element;
        toolbarCache.set(eventNtxId, toolbar);
        // Replace on the spot if the editor crashed.
        if (eventNtxId === ntxId) {
            setToolbarToRender(toolbar);
        }
    });

    // Clean the cache when tabs are closed.
    useTriliumEvent("noteContextRemoved", ({ ntxIds: eventNtxIds }) => {
        for (const eventNtxId of eventNtxIds) {
            toolbarCache.delete(eventNtxId);
        }
    });

    // Switch between the cached toolbar when user navigates to a different note context.
    useEffect(() => {
        if (!ntxId) return;
        setToolbarToRender(toolbarCache.get(ntxId));
    }, [ ntxId, noteContext ]);

    // Render the toolbar.
    useEffect(() => {
        if (toolbarToRender) {
            containerRef.current?.replaceChildren(toolbarToRender);
        } else {
            containerRef.current?.replaceChildren();
        }
    }, [ toolbarToRender ]);

    return (
        <div
            ref={containerRef}
            className={`classic-toolbar-widget ${!shown ? "hidden-ext" : ""}`}
        />
    );
}
