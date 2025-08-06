import { NoteType } from "@triliumnext/commons";
import appContext, { EventData } from "../../components/app_context";
import FNote from "../../entities/fnote";
import dialog, { closeActiveDialog, openDialog } from "../../services/dialog";
import froca from "../../services/froca";
import { t } from "../../services/i18n";
import server from "../../services/server";
import toast from "../../services/toast";
import Button from "../react/Button";
import Modal from "../react/Modal";
import ReactBasicWidget from "../react/ReactBasicWidget";
import FormList, { FormListItem } from "../react/FormList";
import utils from "../../services/utils";
import { useEffect, useState } from "preact/hooks";
import protected_session_holder from "../../services/protected_session_holder";

interface RevisionsDialogProps {
    note?: FNote;
}

interface RevisionItem {
    noteId: string;
    revisionId: string;
    dateLastEdited: string;
    contentLength: number;
    type: NoteType;
    title: string;
    isProtected: boolean;
    mime: string;
}

interface FullRevision {
    content: string;
    mime: string;
}

function RevisionsDialogComponent({ note }: RevisionsDialogProps) {
    const [ revisions, setRevisions ] = useState<RevisionItem[]>([]);
    const [ currentRevision, setCurrentRevision ] = useState<RevisionItem>();

    if (note) {
        useEffect(() => {
            server.get<RevisionItem[]>(`notes/${note.noteId}/revisions`).then(setRevisions);
        }, [ note.noteId ]);
    }

    if (revisions?.length && !currentRevision) {
        setCurrentRevision(revisions[0]);
    }

    return (note &&
        <Modal
            className="revisions-dialog"
            size="xl"
            title={t("revisions.note_revisions")}
            helpPageId="vZWERwf8U3nx"
            bodyStyle={{ display: "flex", height: "80vh" }}
            header={<>
                <Button text={t("revisions.delete_all_revisions")} small style={{ padding: "0 10px" }}
                    onClick={async () => {
                        const text = t("revisions.confirm_delete_all");

                        if (await dialog.confirm(text)) {
                            await server.remove(`notes/${note.noteId}/revisions`);

                            closeActiveDialog();
                            toast.showMessage(t("revisions.revisions_deleted"));
                        }
                    }}/>
            </>}                
            >
                <RevisionsList
                    revisions={revisions}
                    onSelect={(revisionId) => {
                        const correspondingRevision = revisions.find((r) => r.revisionId === revisionId);
                        if (correspondingRevision) {
                            setCurrentRevision(correspondingRevision);
                        }
                    }}
                />

                <div class="revision-content-wrapper" style={{
                    "flex-grow": "1",
                    "margin-left": "20px",
                    "display": "flex",
                    "flex-direction": "column",
                    "min-width": 0
                }}>
                    <RevisionPreview revisionItem={currentRevision} />
                </div>
        </Modal>
    )
}

function RevisionsList({ revisions, onSelect }: { revisions: RevisionItem[], onSelect: (val: string) => void }) {
    return (
        <FormList style={{ height: "100%", flexShrink: 0 }} onSelect={onSelect}>
            {revisions.map((item) => 
                <FormListItem
                    title={t("revisions.revision_last_edited", { date: item.dateLastEdited })}
                    value={item.revisionId}
                >
                    {item.dateLastEdited.substr(0, 16)} ({utils.formatSize(item.contentLength)})
                </FormListItem>
            )}
        </FormList>);
}

function RevisionPreview({ revisionItem }: { revisionItem?: RevisionItem}) {
    const [ fullRevision, setFullRevision ] = useState<FullRevision>();

    useEffect(() => {
        if (revisionItem) {
            server.get<FullRevision>(`revisions/${revisionItem.revisionId}`).then(setFullRevision);
        } else {
            setFullRevision(undefined);
        }
    }, [revisionItem]);

    return revisionItem && (
        <>
            <div style="flex-grow: 0; display: flex; justify-content: space-between;">
                <h3 class="revision-title" style="margin: 3px; flex-grow: 100;">{revisionItem.title}</h3>
                <div class="revision-title-buttons">
                    {(!revisionItem.isProtected || protected_session_holder.isProtectedSessionAvailable()) &&
                        <Button icon="bx bx-history" text={t("revisions.restore_button")} />
                    }
                </div>
            </div>
            <RevisionContent revisionItem={revisionItem} fullRevision={fullRevision} />
        </>
    );
}

function RevisionContent({ revisionItem, fullRevision }: { revisionItem?: RevisionItem, fullRevision?: FullRevision }) {
    if (!revisionItem || !fullRevision) {
        return <></>;
    }

    switch (revisionItem.type) {
        case "text":
            return <div class="ck-content" dangerouslySetInnerHTML={{ __html: fullRevision.content }}></div>
    }
}

export default class RevisionsDialog extends ReactBasicWidget  {

    private props: RevisionsDialogProps = {};

    get component() {
        return <RevisionsDialogComponent {...this.props} />
    }

    async showRevisionsEvent({ noteId }: EventData<"showRevisions">) {
        this.props = {
            note: await getNote(noteId) ?? undefined
        };
        this.doRender();
        openDialog(this.$widget);
    }

}

async function getNote(noteId?: string | null) {
    if (noteId) {
        return await froca.getNote(noteId);
    } else {
        return appContext.tabManager.getActiveContextNote();
    }
}