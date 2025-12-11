import { t } from "i18next";
import FNote from "../../entities/fnote";
import { ViewTypeOptions } from "../collections/interface";
import Dropdown from "../react/Dropdown";
import { FormDropdownDivider, FormDropdownSubmenu, FormListItem, FormListToggleableItem } from "../react/FormList";
import Icon from "../react/Icon";
import { useViewType, VIEW_TYPE_MAPPINGS } from "../ribbon/CollectionPropertiesTab";
import { bookPropertiesConfig, BookProperty, ButtonProperty, CheckBoxProperty, SplitButtonProperty } from "../ribbon/collection-properties-config";
import { useNoteLabel, useNoteLabelBoolean } from "../react/hooks";
import { useContext } from "preact/hooks";
import { ParentComponent } from "../react/react_utils";

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
    const [ viewType, setViewType ] = useViewType(note);

    return (
        <>
            <ViewTypeSwitcher note={note} viewType={viewType} setViewType={setViewType} />
            <ViewOptions note={note} viewType={viewType} />
        </>
    );
}

function ViewTypeSwitcher({ note, viewType, setViewType }: { note: FNote, viewType: ViewTypeOptions, setViewType: (newValue: ViewTypeOptions) => void }) {
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
                    onClick={() => setViewType(key as ViewTypeOptions)}
                    selected={viewType === key}
                    disabled={viewType === key}
                    icon={ICON_MAPPINGS[key as ViewTypeOptions]}
                >{label}</FormListItem>
            ))}
        </Dropdown>
    );
}

function ViewOptions({ note, viewType }: { note: FNote, viewType: ViewTypeOptions }) {
    const properties = bookPropertiesConfig[viewType].properties;

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

            {properties.length > 0 && <FormDropdownDivider />}
            {properties.map(property => (
                <ViewProperty key={property} note={note} property={property} />
            ))}
        </Dropdown>
    );
}

function ViewProperty({ note, property }: { note: FNote, property: BookProperty }) {
    switch (property.type) {
        case "button":
            return <ButtonPropertyView note={note} property={property} />;
        case "split-button":
            return <SplitButtonPropertyView note={note} property={property} />;
        case "checkbox":
            return <CheckBoxPropertyView note={note} property={property} />;
    }
}

function ButtonPropertyView({ note, property }: { note: FNote, property: ButtonProperty }) {
    const parentComponent = useContext(ParentComponent);

    return (
        <FormListItem
            icon={property.icon}
            title={property.title}
            onClick={() => {
                if (!parentComponent) return;
                property.onClick({
                    note,
                    triggerCommand: parentComponent.triggerCommand.bind(parentComponent)
                });
            }}
        >{property.label}</FormListItem>
    );
}

function SplitButtonPropertyView({ note, property }: { note: FNote, property: SplitButtonProperty }) {
    const parentComponent = useContext(ParentComponent);
    const ItemsComponent = property.items;
    const clickContext = parentComponent && {
        note,
        triggerCommand: parentComponent.triggerCommand.bind(parentComponent)
    };

    return (parentComponent &&
        <FormDropdownSubmenu
            icon={property.icon ?? "bx bx-empty"}
            title={property.label}
            onDropdownToggleClicked={() => clickContext && property.onClick(clickContext)}
        >
            <ItemsComponent note={note} parentComponent={parentComponent} />
        </FormDropdownSubmenu>
    );
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

