import { useTriliumEvents } from "../react/hooks";
import AttributeEditor from "./components/AttributeEditor";
import { TabContext } from "./ribbon-interface";

export default function OwnedAttributesTab({ note, hidden, activate, ntxId, ...restProps }: TabContext) {
    useTriliumEvents([ "addNewLabel", "addNewRelation" ], ({ ntxId: eventNtxId }) => {
        if (ntxId === eventNtxId) {
            activate();
        }
    });

    return (
        <div className="attribute-list">
            { note && (
                <AttributeEditor ntxId={ntxId} note={note} {...restProps} hidden={hidden} />
            )}
        </div>
    )
}