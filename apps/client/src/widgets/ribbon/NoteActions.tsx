import FNote from "../../entities/fnote"
import { t } from "../../services/i18n"
import ActionButton from "../react/ActionButton"

interface NoteActionsProps {
  note?: FNote;
}

export default function NoteActions(props: NoteActionsProps) {
  return (
    <>
      <RevisionsButton {...props} />
    </>
  )
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
  )
}