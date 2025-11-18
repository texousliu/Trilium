import "./NoteColorPickerMenuItem.css";
import { useEffect, useRef, useState} from "preact/hooks";
import {ComponentChildren} from "preact";
import attributes from "../../services/attributes";
import Debouncer from "../../utils/debouncer";
import FNote from "../../entities/fnote";
import froca from "../../services/froca";

const COLORS = ["blue", "green", "cyan", "red", "magenta", "brown", "yellow", null];

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
        setCurrentColor(note?.getLabel("color")?.value ?? null);
    }, [note]);

    const onColorCellClicked = (color: string | null) => {
        if (note) {
            if (color !== null) {
                attributes.setLabel(note.noteId, "color", color);
            } else {
                attributes.removeOwnedLabelByName(note, "color");
            }
            
            setCurrentColor(color);
        }
    }

    return <div className="color-picker-menu-item"
                onClick={(e) => {e.stopPropagation()}}>
        {COLORS.map((color) => (
            <ColorCell key={color}
                       color={color}
                       isSelected={(color === currentColor)}
                       isDisabled={(note === null)}
                       onSelect={() => onColorCellClicked(color)} />
        ))}

        <CustomColorCell color={currentColor} isSelected={false} onSelect={onColorCellClicked}  />
    </div>
}

interface ColorCellProps {
    children?: ComponentChildren,
    className?: string;
    color: string | null,
    isSelected: boolean,
    isDisabled?: boolean,
    onSelect?: (color: string | null) => void
}

function ColorCell(props: ColorCellProps) {
    return <div class={`color-cell ${props.isSelected ? "selected" : ""} ${props.isDisabled ? "disabled-color-cell" : ""} ${props.className ?? ""}`}
                style={`${(props.color !== null) ? `background-color: ${props.color}` : ""}`}
                onClick={() => props.onSelect?.(props.color)}>
        {props.children}
    </div>;
}

function CustomColorCell(props: ColorCellProps) {
    const colorInput = useRef<HTMLInputElement>(null);
    let colorInputDebouncer: Debouncer<string | null>;

    useEffect(() => {
        colorInputDebouncer = new Debouncer(500, (color) => {
            props.onSelect?.(color);
        });

        return () => {
            colorInputDebouncer.destroy();
        }
    });

    return <>
        <ColorCell {...props} 
                   className="custom-color-cell"
                   onSelect={() => {colorInput.current?.click()}}>

            <input ref={colorInput}
                   type="color"
                   value={props.color ?? ""}
                   onChange={() => {colorInputDebouncer.updateValue(colorInput.current?.value ?? null)}}
                   style="width: 0; height: 0; opacity: 0" />
        </ColorCell>
    </>
}