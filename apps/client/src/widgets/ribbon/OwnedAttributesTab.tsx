import { useTriliumEvents } from "../react/hooks";
import AttributeEditor from "./components/AttributeEditor";
import { TabContext } from "./ribbon-interface";

export default function OwnedAttributesTab({ note, hidden, activate, ...restProps }: TabContext) {
    useTriliumEvents([ "addNewLabel", "addNewRelation" ], activate);

    return (
        <div className="attribute-list">
            { note && (
                <AttributeEditor note={note} {...restProps} hidden={hidden} />
            )}
        </div>
    )
}