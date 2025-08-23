import AttributeEditor from "./components/AttributeEditor";
import { TabContext } from "./ribbon-interface";

export default function OwnedAttributesTab({ note, notePath, componentId }: TabContext) {
    return (
        <div className="attribute-list">
            { note && (
                <AttributeEditor
                    componentId={componentId}
                    note={note}
                    notePath={notePath}
                />
            )}
        </div>
    )
}