import "./NoteColorPickerMenuItem.css";
import { useEffect, useState } from "preact/hooks";
import attributes from "../../services/attributes";
import FNote from "../../entities/fnote";
import froca from "../../services/froca";

const COLORS = ["blue", "green", "cyan", "red", "magenta", "brown", "yellow", ""];

export interface NoteColorPickerMenuItemProps {
    /** The target Note instance or its ID string. */
    note: FNote | string | null;
}

export default function NoteColorPickerMenuItem(props: NoteColorPickerMenuItemProps) {
    if (!props.note) return null;

    const [note, setNote] = useState<FNote | null>(null);
    const [currentColor, setCurrentColor] = useState<string | null>(null);

    useEffect(() => {
        const retrieveNote = async (noteId: string) => {
            const result = await froca.getNote(noteId, true);
            if (result) {
                setNote(result);
            }
        }

        if (typeof props.note === "string") {
            retrieveNote(props.note); // Get the note from the given ID string
        } else {
            setNote(props.note);
        }
    }, []);

    useEffect(() => {
        setCurrentColor(note?.getLabel("color")?.value ?? "");
    }, [note]);

    const onColorCellClicked = (color: string) => {
        if (note) {
            attributes.setLabel(note.noteId, "color", color);
            setCurrentColor(color);
        }
    }

    return <div className="color-picker-menu-item">
        {COLORS.map((color) => (
            <ColorCell key={color}
                       color={color}
                       isSelected={(color === currentColor)}
                       isDisabled={(note === null)}
                       onClick={() => onColorCellClicked(color)} />
        ))}
    </div>
}

interface ColorCellProps {
    color: string,
    isSelected: boolean,
    isDisabled?: boolean,
    onClick?: () => void
}

function ColorCell(props: ColorCellProps) {
    return <div class={`color-cell ${props.isSelected ? "selected" : ""} ${props.isDisabled ? "disabled-color-cell" : ""}`}
                style={`background-color: ${props.color}`}
                onClick={props.onClick}>
    </div>;
}