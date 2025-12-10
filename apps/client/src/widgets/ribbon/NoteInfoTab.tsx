import { useEffect, useState } from "preact/hooks";
import { t } from "../../services/i18n";
import { MetadataResponse, NoteSizeResponse, SubtreeSizeResponse } from "@triliumnext/commons";
import server from "../../services/server";
import Button from "../react/Button";
import { formatDateTime } from "../../utils/formatters";
import { formatSize } from "../../services/utils";
import LoadingSpinner from "../react/LoadingSpinner";
import { useTriliumEvent } from "../react/hooks";
import { isExperimentalFeatureEnabled } from "../../services/experimental_features";
import FNote from "../../entities/fnote";

const isNewLayout = isExperimentalFeatureEnabled("new-layout");

export default function NoteInfoTab({ note }: { note: FNote | null | undefined }) {
    const { isLoading, metadata, noteSizeResponse, subtreeSizeResponse, requestSizeInfo } = useNoteMetadata(note);

    return (
        <div className="note-info-widget">
            {note && (
                <>
                    <div className="note-info-item">
                        <span>{t("note_info_widget.note_id")}:</span>
                        <span className="note-info-id selectable-text">{note.noteId}</span>
                    </div>
                    {!isNewLayout && <div className="note-info-item">
                        <span>{t("note_info_widget.created")}:</span>
                        <span className="selectable-text">{formatDateTime(metadata?.dateCreated)}</span>
                    </div>}
                    {!isNewLayout && <div className="note-info-item">
                        <span>{t("note_info_widget.modified")}:</span>
                        <span className="selectable-text">{formatDateTime(metadata?.dateModified)}</span>
                    </div>}
                    <div className="note-info-item">
                        <span>{t("note_info_widget.type")}:</span>
                        <span>
                            <span className="note-info-type">{note.type}</span>{' '}
                            {note.mime && <span className="note-info-mime selectable-text">({note.mime})</span>}
                        </span>
                    </div>
                    <div className="note-info-item">
                        <span title={t("note_info_widget.note_size_info")}>{t("note_info_widget.note_size")}:</span>
                        <span className="note-info-size-col-span">
                            {!isLoading && !noteSizeResponse && !subtreeSizeResponse && (
                                <Button
                                    className="calculate-button"
                                    icon="bx bx-calculator"
                                    text={t("note_info_widget.calculate")}
                                    onClick={requestSizeInfo}
                                />
                            )}

                            <span className="note-sizes-wrapper selectable-text">
                                <span className="note-size">{formatSize(noteSizeResponse?.noteSize)}</span>
                                {" "}
                                {subtreeSizeResponse && subtreeSizeResponse.subTreeNoteCount > 1 &&
                                    <span className="subtree-size">{t("note_info_widget.subtree_size", { size: formatSize(subtreeSizeResponse.subTreeSize), count: subtreeSizeResponse.subTreeNoteCount })}</span>
                                }
                                {isLoading && <LoadingSpinner />}
                            </span>
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}

export function useNoteMetadata(note: FNote | null | undefined) {
    const [ isLoading, setIsLoading ] = useState(false);
    const [ noteSizeResponse, setNoteSizeResponse ] = useState<NoteSizeResponse>();
    const [ subtreeSizeResponse, setSubtreeSizeResponse ] = useState<SubtreeSizeResponse>();
    const [ metadata, setMetadata ] = useState<MetadataResponse>();

    function refresh() {
        if (note) {
            server.get<MetadataResponse>(`notes/${note?.noteId}/metadata`).then(setMetadata);
        }

        setNoteSizeResponse(undefined);
        setSubtreeSizeResponse(undefined);
        setIsLoading(false);
    }

    function requestSizeInfo() {
        if (!note) return;

        setIsLoading(true);
        setTimeout(async () => {
            await Promise.allSettled([
                server.get<NoteSizeResponse>(`stats/note-size/${note.noteId}`).then(setNoteSizeResponse),
                server.get<SubtreeSizeResponse>(`stats/subtree-size/${note.noteId}`).then(setSubtreeSizeResponse)
            ]);
            setIsLoading(false);
        }, 0);
    }

    useEffect(refresh, [ note ]);
    useTriliumEvent("entitiesReloaded", ({ loadResults }) => {
        const noteId = note?.noteId;
        if (noteId && (loadResults.isNoteReloaded(noteId) || loadResults.isNoteContentReloaded(noteId))) {
            refresh();
        }
    });

    return { isLoading, metadata, noteSizeResponse, subtreeSizeResponse, requestSizeInfo  };
}
