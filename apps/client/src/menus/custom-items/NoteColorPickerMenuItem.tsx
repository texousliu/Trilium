import "./NoteColorPickerMenuItem.css";
import { useCallback, useEffect, useRef, useState} from "preact/hooks";
import {ComponentChildren} from "preact";
import attributes from "../../services/attributes";
import Color, { ColorInstance } from "color";
import Debouncer from "../../utils/debouncer";
import FNote from "../../entities/fnote";
import froca from "../../services/froca";

const COLORS = [
    null, "#e64d4d", "#e6994d", "#e5e64d", "#99e64d", "#4de64d", "#4de699",
    "#4de5e6", "#4d99e6", "#4d4de6", "#994de6", "#e64db3"
];

export interface NoteColorPickerMenuItemProps {
    /** The target Note instance or its ID string. */
    note: FNote | string | null;
}

export default function NoteColorPickerMenuItem(props: NoteColorPickerMenuItemProps) {
    if (!props.note) return null;

    const [note, setNote] = useState<FNote | null>(null);
    const [currentColor, setCurrentColor] = useState<string | null>(null);
    const [isCustomColor, setIsCustomColor] = useState<boolean>(false);

    useEffect(() => {
        const retrieveNote = async (noteId: string) => {
            const noteInstance = await froca.getNote(noteId, true);
            if (noteInstance) {
                setNote(noteInstance);
            }
        }

        if (typeof props.note === "string") {
            retrieveNote(props.note); // Get the note from the given ID string
        } else {
            setNote(props.note);
        }
    }, []);

    useEffect(() => {
        const colorLabel = note?.getLabel("color")?.value ?? null;
        if (colorLabel) {
            let color: ColorInstance | null = null;

            try {
                color = new Color(colorLabel);
            } catch(ex) {
                console.error(ex);
            }

            if (color) {
                setCurrentColor(color.hex().toLowerCase());
            }
        }
    }, [note]);

    useEffect(() => {
        setIsCustomColor(COLORS.indexOf(currentColor) === -1);
    }, [currentColor])

    const onColorCellClicked = useCallback((color: string | null) => {
        if (note) {
            if (color !== null) {
                attributes.setLabel(note.noteId, "color", color);
            } else {
                attributes.removeOwnedLabelByName(note, "color");
            }
            
            setCurrentColor(color);
        }
    }, [note, currentColor]);

    return <div className="color-picker-menu-item"
                onClick={(e) => {e.stopPropagation()}}>
        {COLORS.map((color) => (
            <ColorCell key={color}
                       className={(color === null) ? "color-cell-reset" : undefined}
                       color={color}
                       isSelected={(color === currentColor)}
                       isDisabled={(note === null)}
                       onSelect={() => onColorCellClicked(color)} />
        ))}

        <CustomColorCell color={currentColor}
                         isSelected={isCustomColor}
                         onSelect={onColorCellClicked} />
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
                style={`${(props.color !== null) ? `--color: ${props.color}` : ""}`}
                onClick={() => props.onSelect?.(props.color)}>
        {props.children}
    </div>;
}

function CustomColorCell(props: ColorCellProps) {
    const [pickedColor, setPickedColor] = useState<string | null>(null);
    const colorInput = useRef<HTMLInputElement>(null);
    const colorInputDebouncer = useRef<Debouncer<string | null> | null>(null);
    const callbackRef = useRef(props.onSelect);

    useEffect(() => {
        colorInputDebouncer.current = new Debouncer(500, (color) => {
            callbackRef.current?.(color);
            setPickedColor(color);
        });

        return () => {
            colorInputDebouncer.current?.destroy();
        }
    }, []);

    useEffect(() => {
        if (props.isSelected && pickedColor === null) {
            setPickedColor(props.color);
        }
    }, [props.isSelected])

    useEffect(() => {
        callbackRef.current = props.onSelect;
    }, [props.onSelect]);

    const onSelect = useCallback(() => {
        if (pickedColor !== null) {
            callbackRef.current?.(pickedColor);
        }

        colorInput.current?.click();
    }, [pickedColor]);

    return <div style={`--foreground: ${ensureContrast(props.color)};`}>
        <ColorCell {...props}
                   color={pickedColor} 
                   className={`custom-color-cell ${(pickedColor === null) ? "custom-color-cell-empty" : ""}`}
                   onSelect={onSelect}>

            <input ref={colorInput}
                   type="color"
                   value={pickedColor ?? props.color ?? "#40bfbf"}
                   onChange={() => {colorInputDebouncer.current?.updateValue(colorInput.current?.value ?? null)}}
                   style="width: 0; height: 0; opacity: 0" />
        </ColorCell>
    </div>
}

function ensureContrast(color: string | null) {
    if (color === null) return "inherit";

    const colorHsl = Color(color).hsl();
    let l = colorHsl.lightness();

    if (l >= 40) {
        l = 0;
    } else {
        l = 100
    }

    return colorHsl.saturationl(0).lightness(l).hex();
}