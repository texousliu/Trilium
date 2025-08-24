import { ConvertToAttachmentResponse } from "@triliumnext/commons";
import appContext from "../../components/app_context";
import FNote from "../../entities/fnote"
import dialog from "../../services/dialog";
import { t } from "../../services/i18n"
import server from "../../services/server";
import toast from "../../services/toast";
import ws from "../../services/ws";
import ActionButton from "../react/ActionButton"
import Dropdown from "../react/Dropdown";
import { FormListItem } from "../react/FormList";

interface NoteActionsProps {
  note?: FNote;
}

export default function NoteActions(props: NoteActionsProps) {
  return (
    <>
      <RevisionsButton {...props} />
      <NoteContextMenu {...props} />
    </>
  );
}

function RevisionsButton({ note }: NoteActionsProps) {
  const isEnabled = !["launcher", "doc"].includes(note?.type ?? "");

  return (isEnabled &&
    <ActionButton
      icon="bx bx-history"
      text={t("revisions_button.note_revisions")}
      triggerCommand="showRevisions"
      titlePosition="bottom"
    />
  );
}

function NoteContextMenu(props: NoteActionsProps) {
  return (
    <Dropdown
      buttonClassName="bx bx-dots-vertical-rounded"
      hideToggleArrow
      noSelectButtonStyle
    >
      <ConvertToAttachment {...props} />
    </Dropdown>
  );
}

function ConvertToAttachment({ note }: NoteActionsProps) {
  return (note?.isEligibleForConversionToAttachment() &&
    <FormListItem
        icon="bx bx-paperclip"
        onClick={async () => {
          if (!note || !(await dialog.confirm(t("note_actions.convert_into_attachment_prompt", { title: note.title })))) {
            return;
          }

          const { attachment: newAttachment } = await server.post<ConvertToAttachmentResponse>(`notes/${note.noteId}/convert-to-attachment`);

          if (!newAttachment) {
            toast.showMessage(t("note_actions.convert_into_attachment_failed", { title: note.title }));
            return;
          }

          toast.showMessage(t("note_actions.convert_into_attachment_successful", { title: newAttachment.title }));
          await ws.waitForMaxKnownEntityChangeId();
          await appContext.tabManager.getActiveContext()?.setNote(newAttachment.ownerId, {
              viewScope: {
                  viewMode: "attachments",
                  attachmentId: newAttachment.attachmentId
              }
          });
        }}
      >{t("note_actions.convert_into_attachment")}</FormListItem>
  )
}