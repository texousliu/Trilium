import { allViewTypes, ViewTypeOptions } from "./interface";
import { useNoteContext, useNoteLabel, useTriliumEvent } from "../react/hooks";
import FNote from "../../entities/fnote";
import "./NoteList.css";
import ListView from "./legacy/ListView";
import { useEffect, useState } from "preact/hooks";

interface NoteListProps {
    displayOnlyCollections?: boolean;
}

export default function NoteList({ }: NoteListProps) {
    const { note } = useNoteContext();
    const viewType = useNoteViewType(note);
    const noteIds = useNoteIds(note, viewType);
    const isEnabled = (!!viewType);

    // Refresh note Ids
    console.log("Got note ids", noteIds);

    return (
        <div className="note-list-widget">
            {isEnabled && (
                <div className="note-list-widget-content">
                    {getComponentByViewType(viewType)}
                </div>
            )}
        </div>
    );
}

function getComponentByViewType(viewType: ViewTypeOptions) {
    console.log("Got ", viewType);
    switch (viewType) {
        case "list":
            return <ListView />;
    }
}

function useNoteViewType(note?: FNote | null): ViewTypeOptions | undefined {
    const [ viewType ] = useNoteLabel(note, "viewType");
    
    if (!note) {
        return undefined;
    } else if (!(allViewTypes as readonly string[]).includes(viewType || "")) {
        // when not explicitly set, decide based on the note type
        return note.type === "search" ? "list" : "grid";
    } else {
        return viewType as ViewTypeOptions;
    }
}

function useNoteIds(note: FNote | null | undefined, viewType: ViewTypeOptions | undefined) {
    const [ noteIds, setNoteIds ] = useState<string[]>([]);
    
    async function refreshNoteIds() {
        console.log("Refreshed note IDs");
        if (!note) {
            setNoteIds([]);
        } else if (viewType === "list" || viewType === "grid") {
            setNoteIds(note.getChildNoteIds());
        } else {
            setNoteIds(await note.getSubtreeNoteIds());
        }
    }

    // Refresh on note switch.
    useEffect(() => { refreshNoteIds() }, [ note ]);

    // Refresh on alterations to the note subtree.
    useTriliumEvent("entitiesReloaded", ({ loadResults }) => {
        if (note && loadResults.getBranchRows().some(branch =>
                branch.parentNoteId === note.noteId
                || noteIds.includes(branch.parentNoteId ?? ""))) {
            refreshNoteIds();    
        }
    })

    return noteIds;
}