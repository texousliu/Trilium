import FNote from "../../entities/fnote";
import { ViewTypeOptions } from "../collections/interface";
import Dropdown from "../react/Dropdown";
import { FormListItem } from "../react/FormList";
import { useViewType, VIEW_TYPE_MAPPINGS } from "../ribbon/CollectionPropertiesTab";

export default function CollectionProperties({ note }: { note: FNote }) {
    return (
        <ViewTypeSwitcher note={note} />
    );
}

function ViewTypeSwitcher({ note }: { note: FNote }) {
    const [ viewType, setViewType ] = useViewType(note);

    return (
        <Dropdown
            text={VIEW_TYPE_MAPPINGS[viewType as ViewTypeOptions ?? "grid"]}
        >
            {Object.entries(VIEW_TYPE_MAPPINGS).map(([ key, label ]) => (
                <FormListItem
                    key={key}
                    onClick={() => setViewType(key)}
                    checked={viewType === key}
                >{label}</FormListItem>
            ))}
        </Dropdown>
    );
}
