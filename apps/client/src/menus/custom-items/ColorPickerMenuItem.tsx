import FNote from "../../entities/fnote"

export interface ColorPickerMenuItemProps {
    note: FNote | null;
}

export default function ColorPickerMenuItem(props: ColorPickerMenuItemProps) {
    return <span>Color Picker</span>
}