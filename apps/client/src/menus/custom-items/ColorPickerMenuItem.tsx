import "./ColorPickerMenuItem.css";
import { useState } from "preact/hooks";
import attributes from "../../services/attributes";
import FNote from "../../entities/fnote";

const COLORS = ["blue", "green", "cyan", "red", "magenta", "brown", "yellow", ""];

export interface ColorPickerMenuItemProps {
    note: FNote | null;
}

export default function ColorPickerMenuItem(props: ColorPickerMenuItemProps) {
    const {note} = props;
    if (!note) return null;

    const [currentColor, setCurrentColor] = useState(note.getLabel("color")?.value ?? "");

    const onColorCellClicked = (color: string) => {
        attributes.setLabel(note.noteId, "color", color);
        setCurrentColor(color);
    }

    return <div className="color-picker-menu-item">
        {COLORS.map((color) => (
            <ColorCell key={color}
                       color={color}
                       isSelected={(color === currentColor)}
                       onClick={() => onColorCellClicked(color)} />
        ))}
    </div>
}

function ColorCell(props: {color: string, isSelected: boolean, onClick?: () => void}) {
    return <div class={`color-cell ${props.isSelected ? "selected" : ""}`}
                style={`background-color: ${props.color}`}
                onClick={props.onClick}>
    </div>;
}