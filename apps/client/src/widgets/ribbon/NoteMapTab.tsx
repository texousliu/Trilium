import { TabContext } from "./ribbon-interface";
import NoteMapWidget from "../note_map";
import { useLegacyWidget, useWindowSize } from "../react/hooks";
import ActionButton from "../react/ActionButton";
import { t } from "../../services/i18n";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

const SMALL_SIZE_HEIGHT = "300px";

export default function NoteMapTab({ note, noteContext }: TabContext) {
    const [ isExpanded, setExpanded ] = useState(false);
    const [ height, setHeight ] = useState(SMALL_SIZE_HEIGHT);
    const containerRef = useRef<HTMLDivElement>(null);
    const { windowHeight } = useWindowSize();

    const [ noteMapContainer, noteMapWidget ] = useLegacyWidget(() => new NoteMapWidget("ribbon"), {
        noteContext,
        containerClassName: "note-map-container"
    });
    
    useEffect(() => {
        if (isExpanded && containerRef.current) {
            const { top } = containerRef.current.getBoundingClientRect();
            const height = windowHeight - top;
            setHeight(height + "px");
        } else {
            setHeight(SMALL_SIZE_HEIGHT);
        }
    }, [ isExpanded, containerRef, windowHeight ]);
    useEffect(() => noteMapWidget.setDimensions(), [ height ]);    

    return (
        <div className="note-map-ribbon-widget" style={{ height }} ref={containerRef}>
            {noteMapContainer}

            {!isExpanded ? (
                <ActionButton
                    icon="bx bx-arrow-to-bottom"
                    text={t("note_map.open_full")}
                    className="open-full-button"
                    onClick={() => setExpanded(true)}
                />
            ) : (
                <ActionButton
                    icon="bx bx-arrow-to-top"
                    text={t("note_map.collapse")}
                    className="collapse-button"
                    onClick={() => setExpanded(false)}
                />
            )}
        </div>
    );
}