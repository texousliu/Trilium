import "./NoteColorPicker.css";
import { t } from "../../services/i18n";
import { useCallback, useEffect, useRef, useState} from "preact/hooks";
import {ComponentChildren} from "preact";
import attributes from "../../services/attributes";
import clsx from "clsx";
import Color, { ColorInstance } from "color";
import Debouncer from "../../utils/debouncer";
import FNote from "../../entities/fnote";
import froca from "../../services/froca";

const COLOR_PALETTE = [
    "#e64d4d", "#e6994d", "#e5e64d", "#99e64d", "#4de64d", "#4de699",
    "#4de5e6", "#4d99e6", "#4d4de6", "#994de6", "#e64db3"
];

export interface NoteColorPickerProps {
    /** The target Note instance or its ID string. */
    note: FNote | string | null;
}

export default function NoteColorPicker(props: NoteColorPickerProps) {
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
            let color = tryParseColor(colorLabel);
            if (color) {
                setCurrentColor(color.hex().toLowerCase());
            }
        }
    }, [note]);

    useEffect(() => {
        setIsCustomColor(currentColor !== null && COLOR_PALETTE.indexOf(currentColor) === -1);
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

    return <div className="note-color-picker">
        
        <ColorCell className="color-cell-reset"
                   tooltip={t("note-color.clear-color")}
                   color={null}
                   isSelected={(currentColor === null)}
                   isDisabled={(note === null)}
                   onSelect={onColorCellClicked} />
        
        
        {COLOR_PALETTE.map((color) => (
            <ColorCell key={color}
                       tooltip={t("note-color.set-color")}
                       color={color}
                       isSelected={(color === currentColor)}
                       isDisabled={(note === null)}
                       onSelect={onColorCellClicked} />
        ))}

        <CustomColorCell tooltip={t("note-color.set-custom-color")}
                         color={currentColor}
                         isSelected={isCustomColor}
                         isDisabled={(note === null)}
                         onSelect={onColorCellClicked} />
    </div>
}

interface ColorCellProps {
    children?: ComponentChildren,
    className?: string,
    tooltip?: string,
    color: string | null,
    isSelected: boolean,
    isDisabled?: boolean,
    onSelect?: (color: string | null) => void
}

function ColorCell(props: ColorCellProps) {
    return <div className={clsx(props.className, {
                    "color-cell": true,
                    "selected": props.isSelected,
                    "disabled-color-cell": props.isDisabled
                })}
                style={`${(props.color !== null) ? `--color: ${props.color}` : ""}`}
                title={props.tooltip}
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

    return <div style={`--foreground: ${getForegroundColor(props.color)};`}>
        <ColorCell {...props}
                   color={pickedColor} 
                   className={clsx("custom-color-cell", {
                        "custom-color-cell-empty": (pickedColor === null)
                   })}
                   onSelect={onSelect}>

            <input ref={colorInput}
                   type="color"
                   value={pickedColor ?? props.color ?? "#40bfbf"}
                   onChange={() => {colorInputDebouncer.current?.updateValue(colorInput.current?.value ?? null)}}
                   style="width: 0; height: 0; opacity: 0" />
        </ColorCell>
    </div>
}

function getForegroundColor(backgroundColor: string | null) {
    if (backgroundColor === null) return "inherit";

    const colorHsl = tryParseColor(backgroundColor)?.hsl();
    if (colorHsl) {
        let l = colorHsl.lightness();
        return colorHsl.saturationl(0).lightness(l >= 50 ? 0 : 100).hex();
    } else {
        return "inherit";
    }
}

function tryParseColor(colorStr: string): ColorInstance | null {
    try {
        return new Color(colorStr);
    } catch(ex) {
        console.error(ex);
    }

    return null;
}