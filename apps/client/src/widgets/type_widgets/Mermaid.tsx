import SvgSplitEditor from "./helpers/SvgSplitEditor";
import { TypeWidgetProps } from "./type_widget";

export default function Mermaid(props: TypeWidgetProps) {
    return <SvgSplitEditor {...props} />;
}
