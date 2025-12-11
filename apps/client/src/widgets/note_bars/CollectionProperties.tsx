import FNote from "../../entities/fnote";
import { ViewTypeOptions } from "../collections/interface";
import Dropdown from "../react/Dropdown";
import { FormListItem } from "../react/FormList";
import Icon from "../react/Icon";
import { useViewType, VIEW_TYPE_MAPPINGS } from "../ribbon/CollectionPropertiesTab";

const ICON_MAPPINGS: Record<ViewTypeOptions, string> = {
    grid: "bx bxs-grid",
    list: "bx bx-list-ul",
    calendar: "bx bx-calendar",
    table: "bx bx-table",
    geoMap: "bx bx-map-alt",
    board: "bx bx-columns",
    presentation: "bx bx-rectangle"
};

export default function CollectionProperties({ note }: { note: FNote }) {
    return (
        <ViewTypeSwitcher note={note} />
    );
}

function ViewTypeSwitcher({ note }: { note: FNote }) {
    const [ viewType, setViewType ] = useViewType(note);

    return (
        <Dropdown
            text={<>
                <Icon icon={ICON_MAPPINGS[viewType]} />&nbsp;
                {VIEW_TYPE_MAPPINGS[viewType]}
            </>}
        >
            {Object.entries(VIEW_TYPE_MAPPINGS).map(([ key, label ]) => (
                <FormListItem
                    key={key}
                    onClick={() => setViewType(key)}
                    selected={viewType === key}
                    disabled={viewType === key}
                    icon={ICON_MAPPINGS[key as ViewTypeOptions]}
                >{label}</FormListItem>
            ))}
        </Dropdown>
    );
}
