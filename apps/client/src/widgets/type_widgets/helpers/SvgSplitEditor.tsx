import { TypeWidgetProps } from "../type_widget";
import SplitEditor from "./SplitEditor";

export default function SvgSplitEditor(props: TypeWidgetProps) {
    return (
        <SplitEditor
            error="Hi there"
            {...props}
        />
    )
}
