import { useNoteContext } from "./react/hooks"

export default function NoteDetail() {
    const { note } = useNoteContext();
    return <p>Note detail goes here! {note?.noteId}</p>
}
