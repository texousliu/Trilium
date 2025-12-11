import { t } from "i18next";
import FNote from "../../entities/fnote";
import { ViewTypeOptions } from "../collections/interface";
import Dropdown from "../react/Dropdown";
import { FormListItem, FormListToggleableItem } from "../react/FormList";
import Icon from "../react/Icon";
import { useViewType, VIEW_TYPE_MAPPINGS } from "../ribbon/CollectionPropertiesTab";
import { BookProperty, CheckBoxProperty } from "../ribbon/collection-properties-config";
import { useNoteLabel, useNoteLabelBoolean } from "../react/hooks";

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
        <>
            <ViewTypeSwitcher note={note} />
            <ViewOptions note={note} />
        </>
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

function ViewOptions({ note }: { note: FNote }) {
    return (
        <Dropdown
            buttonClassName="bx bx-cog icon-action"
            hideToggleArrow
        >
            <ViewProperty note={note} property={{
                type: "checkbox",
                label: t("book_properties.include_archived_notes"),
                bindToLabel: "includeArchived"
            } as CheckBoxProperty} />
        </Dropdown>
    );
}

function ViewProperty({ note, property }: { note: FNote, property: BookProperty }) {
    switch (property.type) {
        case "checkbox":
            return <CheckBoxPropertyView note={note} property={property} />;
    }
}

function CheckBoxPropertyView({ note, property }: { note: FNote, property: CheckBoxProperty }) {
    const [ value, setValue ] = useNoteLabelBoolean(note, property.bindToLabel);
    return (
        <FormListToggleableItem
            title={property.label}
            currentValue={value}
            onChange={setValue}
        />
    );
}
