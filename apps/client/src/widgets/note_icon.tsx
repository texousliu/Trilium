import Dropdown from "./react/Dropdown";
import "./note_icon.css";
import { t } from "i18next";
import { useNoteContext } from "./react/hooks";
import { useCallback, useEffect, useState } from "preact/hooks";
import server from "../services/server";
import type { Category, Icon } from "./icon_list";
import FormTextBox from "./react/FormTextBox";

interface IconToCountCache {
    iconClassToCountMap: Record<string, number>;
}

interface IconData {
    iconToCount: Record<string, number>;
    icons: Icon[];
}

let fullIconData: {
    categories: Category[];
    icons: Icon[];
};
let iconToCountCache!: Promise<IconToCountCache> | null;

export default function NoteIcon() {
    const { note } = useNoteContext();
    const [ icon, setIcon ] = useState("bx bx-empty");

    const refreshIcon = useCallback(() => {
        if (note) {
            setIcon(note.getIcon());
        }
    }, [ note ]);

    useEffect(refreshIcon, [ note ]);

    return (
        <Dropdown
            className="note-icon-widget"
            title={t("note_icon.change_note_icon")}
            dropdownContainerStyle={{ width: "610px" }}
            buttonClassName={`note-icon ${icon}`}
            hideToggleArrow
        >
            <NoteIconList />
        </Dropdown>
    )
}

function NoteIconList() {
    const [ search, setSearch ] = useState<string>();
    const [ categoryId, setCategoryId ] = useState<number>();
    const [ iconData, setIconData ] = useState<IconData>();

    useEffect(() => {
        async function loadIcons() {
            const iconToCount = await getIconToCountMap();
            if (!fullIconData) {
                fullIconData = (await import("./icon_list.js")).default;
            }

            let icons: Icon[] = fullIconData.icons;
            if (search || categoryId) {
                icons = icons.filter((icon) => {
                    if (categoryId && icon.category_id !== categoryId) {
                        return false;
                    }

                    if (search) {
                        if (!icon.name.includes(search) && !icon.term?.find((t) => t.includes(search))) {
                            return false;
                        }
                    }

                    return true;
                });
            }

            setIconData({
                iconToCount,
                icons
            })
        }

        loadIcons();
    }, [ search, categoryId ]);

    return (
        <>
            <div class="filter-row">
                <span>{t("note_icon.category")}</span> <select name="icon-category" class="form-select"></select>

                <span>{t("note_icon.search")}</span>
                <FormTextBox
                    type="text"
                    name="icon-search"
                    currentValue={search} onChange={setSearch}
                />
            </div>

            <div class="icon-list">
                {(iconData?.icons ?? []).map(({className, name}) => (
                    <span class={`bx ${className}`} title={name} />
                ))}
            </div>
        </>
    );
}

async function getIconToCountMap() {
    if (!iconToCountCache) {
        iconToCountCache = server.get<IconToCountCache>("other/icon-usage");
        setTimeout(() => (iconToCountCache = null), 20000); // invalidate cache after 20 seconds
    }

    return (await iconToCountCache).iconClassToCountMap;
}