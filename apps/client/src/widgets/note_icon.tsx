import "./note_icon.css";

import { t } from "i18next";
import { useEffect, useRef, useState } from "preact/hooks";

import FNote from "../entities/fnote";
import attributes from "../services/attributes";
import server from "../services/server";
import type { Icon } from "./icon_list";
import ActionButton from "./react/ActionButton";
import Button from "./react/Button";
import Dropdown from "./react/Dropdown";
import { FormDropdownDivider, FormListItem } from "./react/FormList";
import FormTextBox from "./react/FormTextBox";
import { useNoteContext, useNoteLabel } from "./react/hooks";
import Icon from "./react/Icon";

interface IconToCountCache {
    iconClassToCountMap: Record<string, number>;
}

interface IconData {
    iconToCount: Record<string, number>;
    icons: Icon[];
}

let fullIconData: {
    icons: Icon[];
};
let iconToCountCache!: Promise<IconToCountCache> | null;

export default function NoteIcon() {
    const { note, viewScope } = useNoteContext();
    const [ icon, setIcon ] = useState<string | null | undefined>();
    const [ iconClass ] = useNoteLabel(note, "iconClass");
    const [ workspaceIconClass ] = useNoteLabel(note, "workspaceIconClass");

    useEffect(() => {
        setIcon(note?.getIcon());
    }, [ note, iconClass, workspaceIconClass ]);

    return (
        <Dropdown
            className="note-icon-widget"
            title={t("note_icon.change_note_icon")}
            dropdownContainerStyle={{ width: "610px" }}
            buttonClassName={`note-icon tn-focusable-button ${icon ?? "bx bx-empty"}`}
            hideToggleArrow
            disabled={viewScope?.viewMode !== "default"}
            dropdownOptions={{ autoClose: "outside" }}
        >
            { note && <NoteIconList note={note} /> }
        </Dropdown>
    );
}

function NoteIconList({ note }: { note: FNote }) {
    const searchBoxRef = useRef<HTMLInputElement>(null);
    const [ search, setSearch ] = useState<string>();
    const [ iconData, setIconData ] = useState<IconData>();
    const [ filterByPrefix, setFilterByIconPack ] = useState<string | null>(null);

    useEffect(() => {
        async function loadIcons() {
            if (!fullIconData) {
                fullIconData = (await import("./icon_list.js")).default;
            }

            // Filter by text and/or category.
            let icons: Pick<Icon, "name" | "term" | "className">[] = [
                ...fullIconData.icons,
                ...glob.iconRegistry.sources.map(s => s.icons.map(icon => ({
                    name: icon.terms.at(0) ?? "",
                    term: icon.terms.slice(1),
                    className: icon.id
                }))).flat()
            ];
            const processedSearch = search?.trim()?.toLowerCase();
            if (processedSearch || filterByPrefix !== null) {
                icons = icons.filter((icon) => {
                    if (filterByPrefix) {
                        if (!icon.className?.startsWith(`${filterByPrefix} `)) {
                            return false;
                        }
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
                icons
            });
        }

        loadIcons();
    }, [ search, filterByPrefix ]);

    return (
        <>
            <div class="filter-row">
                <span>{t("note_icon.search")}</span>
                <FormTextBox
                    inputRef={searchBoxRef}
                    type="text"
                    name="icon-search"
                    currentValue={search} onChange={setSearch}
                    autoFocus
                />

                <Dropdown
                    buttonClassName="bx bx-filter-alt"
                    hideToggleArrow
                    noSelectButtonStyle
                    noDropdownListStyle
                    iconAction
                >
                    <FormListItem
                        checked={filterByPrefix === null}
                        onClick={() => setFilterByIconPack(null)}
                    >{t("note_icon.filter-none")}</FormListItem>
                    <FormListItem
                        checked={filterByPrefix === "bx"}
                        onClick={() => setFilterByIconPack("bx")}
                    >{t("note_icon.filter-default")}</FormListItem>
                    <FormDropdownDivider />

                    {glob.iconRegistry.sources.map(({ prefix, name }) => (
                        <FormListItem
                            key={prefix}
                            onClick={() => setFilterByIconPack(prefix)}
                            checked={filterByPrefix === prefix}
                        >{name}</FormListItem>
                    ))}
                </Dropdown>
            </div>

            <div
                class="icon-list"
                onClick={(e) => {
                    // Make sure we are not clicking on something else than a button.
                    const clickedTarget = e.target as HTMLElement;
                    if (clickedTarget.tagName !== "SPAN" || clickedTarget.classList.length !== 2) return;

                    const iconClass = Array.from(clickedTarget.classList.values()).join(" ");
                    if (note) {
                        const attributeToSet = note.hasOwnedLabel("workspace") ? "workspaceIconClass" : "iconClass";
                        attributes.setLabel(note.noteId, attributeToSet, iconClass);
                    }
                }}
            >
                {getIconLabels(note).length > 0 && (
                    <div style={{ textAlign: "center" }}>
                        <Button
                            text={t("note_icon.reset-default")}
                            onClick={() => {
                                if (!note) {
                                    return;
                                }
                                for (const label of getIconLabels(note)) {
                                    attributes.removeAttributeById(note.noteId, label.attributeId);
                                }
                            }}
                        />
                    </div>
                )}

                {(iconData?.icons ?? []).map(({className, name}) => (
                    <span class={className} title={name} />
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

function getIconLabels(note: FNote) {
    if (!note) {
        return [];
    }
    return note.getOwnedLabels()
        .filter((label) => ["workspaceIconClass", "iconClass"]
            .includes(label.name));
}
