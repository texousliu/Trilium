import { useNoteContext } from "./react/hooks";

export default function NoteTitleWidget() {
    const { ntxId, noteId, note } = useNoteContext();
    
    return (
        <>
            <p>{ ntxId }{ noteId }</p>
        </>
    );
}
