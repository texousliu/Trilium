import { useEffect, useRef, useState } from "preact/hooks";
import "./NoteMap.css";
import { rgb2hex } from "./utils";

interface CssData {
    fontFamily: string;
    textColor: string;
    mutedTextColor: string;
}

export default function NoteMap() {
    const containerRef = useRef<HTMLDivElement>(null);
    const styleResolverRef = useRef<HTMLDivElement>(null);
    const [ cssData, setCssData ] = useState<CssData>();
    console.log("Got CSS ", cssData);

    useEffect(() => {
        if (!containerRef.current || !styleResolverRef.current) return;
        setCssData(getCssData(containerRef.current, styleResolverRef.current));
    }, []);

    return (
        <div className="note-map-widget">
            <div ref={styleResolverRef} class="style-resolver" />

            <div ref={containerRef} className="note-map-container">
                Container goes here.
            </div>
        </div>
    )
}

function getCssData(container: HTMLElement, styleResolver: HTMLElement): CssData {
    const containerStyle = window.getComputedStyle(container);
    const styleResolverStyle = window.getComputedStyle(styleResolver);

    return {
        fontFamily: containerStyle.fontFamily,
        textColor: rgb2hex(containerStyle.color),
        mutedTextColor: rgb2hex(styleResolverStyle.color)
    }
}
