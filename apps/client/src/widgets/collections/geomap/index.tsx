import Map from "./map";
import "./index.css";
import { ViewModeProps } from "../interface";
import { useNoteLabel, useNoteLabelBoolean, useNoteProperty, useSpacedUpdate, useTriliumEvent } from "../../react/hooks";
import { DEFAULT_MAP_LAYER_NAME } from "./map_layer";
import { divIcon, LatLng, LeafletMouseEvent } from "leaflet";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import Marker from "./marker";
import froca from "../../../services/froca";
import FNote from "../../../entities/fnote";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconShadow from "leaflet/dist/images/marker-shadow.png";
import appContext from "../../../components/app_context";
import { createNewNote, moveMarker } from "./api";
import openContextMenu, { openMapContextMenu } from "./context_menu";
import toast from "../../../services/toast";
import { t } from "../../../services/i18n";

const DEFAULT_COORDINATES: [number, number] = [3.878638227135724, 446.6630455551659];
const DEFAULT_ZOOM = 2;
export const LOCATION_ATTRIBUTE = "geolocation";

interface MapData {
    view?: {
        center?: LatLng | [number, number];
        zoom?: number;
    };
}

enum State {
    Normal,
    NewNote
}

export default function GeoView({ note, noteIds, viewConfig, saveConfig }: ViewModeProps<MapData>) {
    const [ state, setState ] = useState(State.Normal);
    const [ layerName ] = useNoteLabel(note, "map:style");
    const [ hasScale ] = useNoteLabelBoolean(note, "map:scale");
    const [ isReadOnly ] = useNoteLabelBoolean(note, "readOnly");
    const [ notes, setNotes ] = useState<FNote[]>([]);
    const spacedUpdate = useSpacedUpdate(() => {
        if (viewConfig) {
            saveConfig(viewConfig);
        }
    }, 5000);

    useEffect(() => { froca.getNotes(noteIds).then(setNotes) }, [ noteIds ]);

    // Note creation.
    useTriliumEvent("geoMapCreateChildNote", () => {
         toast.showPersistent({
            icon: "plus",
            id: "geo-new-note",
            title: "New note",
            message: t("geo-map.create-child-note-instruction")
        });

        setState(State.NewNote);

        const globalKeyListener: (this: Window, ev: KeyboardEvent) => any = (e) => {
            if (e.key === "Escape") {
                setState(State.Normal);

                window.removeEventListener("keydown", globalKeyListener);
                toast.closePersistent("geo-new-note");
            }
        };
        window.addEventListener("keydown", globalKeyListener);
    });

    useTriliumEvent("deleteFromMap", ({ noteId }) => {
        moveMarker(noteId, null);
    });

    const onClick = useCallback(async (e: LeafletMouseEvent) => {
        if (state === State.NewNote) {
            toast.closePersistent("geo-new-note");
            await createNewNote(note.noteId, e);
            setState(State.Normal);
        }
    }, [ state ]);

    const onContextMenu = useCallback((e: LeafletMouseEvent) => {
        openMapContextMenu(note.noteId, e, !isReadOnly);
    }, [ note.noteId, isReadOnly ]);

    return (
        <div className={`geo-view ${state === State.NewNote ? "placing-note" : ""}`}>
            <Map
                coordinates={viewConfig?.view?.center ?? DEFAULT_COORDINATES}
                zoom={viewConfig?.view?.zoom ?? DEFAULT_ZOOM}
                layerName={layerName ?? DEFAULT_MAP_LAYER_NAME}
                viewportChanged={(coordinates, zoom) => {
                    if (!viewConfig) viewConfig = {};
                    viewConfig.view = { center: coordinates, zoom };
                    spacedUpdate.scheduleUpdate();
                }}
                onClick={onClick}
                onContextMenu={onContextMenu}
                scale={hasScale}
            >
                {notes.map(note => <NoteMarker note={note} editable={!isReadOnly} />)}
            </Map>
        </div>
    );
}

function NoteMarker({ note, editable }: { note: FNote, editable: boolean }) {
    const [ location ] = useNoteLabel(note, LOCATION_ATTRIBUTE);

    // React to changes
    useNoteLabel(note, "color");
    useNoteLabel(note, "iconClass");

    const title = useNoteProperty(note, "title");
    const colorClass = note.getColorClass();
    const iconClass = note.getIcon();
    const latLng = location?.split(",", 2).map((el) => parseFloat(el)) as [ number, number ] | undefined;
    const icon = useMemo(() => buildIcon(iconClass, colorClass ?? undefined, title, note.noteId), [ iconClass, colorClass, title, note.noteId]);

    const onClick = useCallback(() => {
        appContext.triggerCommand("openInPopup", { noteIdOrPath: note.noteId });
    }, [ note.noteId ]);

    // Middle click to open in new tab
    const onMouseDown = useCallback((e: MouseEvent) => {
        if (e.button === 1) {
            const hoistedNoteId = appContext.tabManager.getActiveContext()?.hoistedNoteId;
            appContext.tabManager.openInNewTab(note.noteId, hoistedNoteId);
            return true;
        }
    }, [ note.noteId ]);

    const onDragged = useCallback((newCoordinates: LatLng) => {
        moveMarker(note.noteId, newCoordinates);
    }, [ note.noteId ]);

    const onContextMenu = useCallback((e: LeafletMouseEvent) => openContextMenu(note.noteId, e, editable), [ note.noteId, editable ]);

    return latLng && <Marker
        coordinates={latLng}
        icon={icon}
        draggable={editable}
        onMouseDown={onMouseDown}
        onDragged={editable ? onDragged : undefined}
        onClick={!editable ? onClick : undefined}
        onContextMenu={onContextMenu}
    />
}

function buildIcon(bxIconClass: string, colorClass?: string, title?: string, noteIdLink?: string) {
    let html = /*html*/`\
        <img class="icon" src="${markerIcon}" />
        <img class="icon-shadow" src="${markerIconShadow}" />
        <span class="bx ${bxIconClass} ${colorClass ?? ""}"></span>
        <span class="title-label">${title ?? ""}</span>`;

    if (noteIdLink) {
        html = `<div data-href="#root/${noteIdLink}">${html}</div>`;
    }

    return divIcon({
        html,
        iconSize: [25, 41],
        iconAnchor: [12, 41]
    });
}
