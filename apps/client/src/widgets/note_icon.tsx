import Dropdown from "./react/Dropdown";
import "./note_icon.css";
import { t } from "i18next";
import { useNoteContext } from "./react/hooks";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import server from "../services/server";
import type { Category, Icon } from "./icon_list";
import FormTextBox from "./react/FormTextBox";
import FormSelect from "./react/FormSelect";

interface IconToCountCache {
    iconClassToCountMap: Record<string, number>;
}

interface IconData {
    iconToCount: Record<string, number>;
    categories: Category[];
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
    const searchBoxRef = useRef<HTMLInputElement>(null);
    const [ search, setSearch ] = useState<string>();
    const [ categoryId, setCategoryId ] = useState<string>("0");
    const [ iconData, setIconData ] = useState<IconData>();

    useEffect(() => {
        async function loadIcons() {
            if (!fullIconData) {
                fullIconData = (await import("./icon_list.js")).default;
            }

            // Filter by text and/or category.
            let icons: Icon[] = fullIconData.icons;
            const processedSearch = search?.trim()?.toLowerCase();
            if (processedSearch || categoryId) {
                icons = icons.filter((icon) => {
                    if (categoryId !== "0" && String(icon.category_id) !== categoryId) {
                        return false;
                    }

                    if (processedSearch) {
                        if (!icon.name.includes(processedSearch) &&
                            !icon.term?.find((t) => t.includes(processedSearch))) {
                            return false;
                        }
                    }

                    return true;
                });
            }

            // Sort by count.
            const iconToCount = await getIconToCountMap();
            if (iconToCount) {
                icons.sort((a, b) => {
                    const countA = iconToCount[a.className ?? ""] || 0;
                    const countB = iconToCount[b.className ?? ""] || 0;

                    return countB - countA;
                });
            }

            setIconData({
                iconToCount,
                icons,
                categories: fullIconData.categories
            })
        }

        loadIcons();
    }, [ search, categoryId ]);

    return (
        <>
            <div class="filter-row">
                <span>{t("note_icon.category")}</span>
                <FormSelect
                    name="icon-category"
                    values={fullIconData?.categories ?? []}
                    currentValue={categoryId} onChange={setCategoryId}
                    keyProperty="id" titleProperty="name"
                />

                <span>{t("note_icon.search")}</span>
                <FormTextBox
                    inputRef={searchBoxRef}
                    type="text"
                    name="icon-search"
                    currentValue={search} onChange={setSearch}
                    autoFocus
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