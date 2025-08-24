import { ConvertToAttachmentResponse } from "@triliumnext/commons";
import appContext, { CommandNames } from "../../components/app_context";
import FNote from "../../entities/fnote"
import dialog from "../../services/dialog";
import { t } from "../../services/i18n"
import server from "../../services/server";
import toast from "../../services/toast";
import ws from "../../services/ws";
import ActionButton from "../react/ActionButton"
import Dropdown from "../react/Dropdown";
import { FormDropdownDivider, FormListItem } from "../react/FormList";
import { isElectron as getIsElectron } from "../../services/utils";
import { ParentComponent } from "../react/react_utils";
import { useContext } from "preact/hooks";
import NoteContext from "../../components/note_context";

interface NoteActionsProps {
  note?: FNote;
  noteContext?: NoteContext;
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
  const { note, noteContext } = props;
  if (!note) {
    return <></>;
  }

  const parentComponent = useContext(ParentComponent);
  const isSearchable = ["text", "code", "book", "mindMap", "doc"].includes(note.type);
  const isInOptions = note.noteId.startsWith("_options");
  const isPrintable = ["text", "code"].includes(note.type);
  const isElectron = getIsElectron();

  return (
    <Dropdown
      buttonClassName="bx bx-dots-vertical-rounded"
      hideToggleArrow
      noSelectButtonStyle
    >
      <ConvertToAttachment {...props} />
      {note.type === "render" && <CommandItem command="renderActiveNote" icon="bx bx-extension" text={t("note_actions.re_render_note")} />}
      <CommandItem command="findInText" icon="bx bx-search" disabled={!isSearchable} text={t("note_actions.search_in_note")} />
      <CommandItem command="printActiveNote" icon="bx bx-printer" disabled={!isPrintable} text={t("note_actions.print_note")} />
      {isElectron && <CommandItem command="exportAsPdf" icon="bx bxs-file-pdf" text={t("note_actions.print_pdf")} />}
      <FormDropdownDivider />

      <CommandItem icon="bx bx-import" text={t("note_actions.import_files")}
        command={() => parentComponent?.triggerCommand("showImportDialog", { noteId: note.noteId })} />
      <CommandItem icon="bx bx-export" text={t("note_actions.export_note")}
        command={() => noteContext?.notePath && parentComponent?.triggerCommand("showExportDialog", {
          notePath: noteContext.notePath, 
          defaultType: "single"
        })} />
      <FormDropdownDivider />
    </Dropdown>
  );
}

function CommandItem({ icon, text, command, disabled }: { icon: string, text: string, command: CommandNames | (() => void), disabled?: boolean }) {
  return <FormListItem
    icon={icon}
    triggerCommand={typeof command === "string" ? command : undefined}
    onClick={typeof command === "function" ? command : undefined}
    disabled={disabled}
  >{text}</FormListItem>
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