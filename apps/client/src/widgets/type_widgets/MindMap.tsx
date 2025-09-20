import { useCallback, useEffect, useRef } from "preact/hooks";
import { TypeWidgetProps } from "./type_widget";
import { MindElixirData, default as VanillaMindElixir } from "mind-elixir";
import { HTMLAttributes } from "preact";
// allow node-menu plugin css to be bundled by webpack
import nodeMenu from "@mind-elixir/node-menu";
import "mind-elixir/style";
import "@mind-elixir/node-menu/dist/style.css";
import "./MindMap.css";

const NEW_TOPIC_NAME = "";

interface MindmapModel extends MindElixirData {
    direction: number;
}

interface MindElixirProps {
    direction: number;
    containerProps?: Omit<HTMLAttributes<HTMLDivElement>, "ref">;
    content: MindElixirData;
}

export default function MindMap({ }: TypeWidgetProps) {
    const content = VanillaMindElixir.new(NEW_TOPIC_NAME);

    const onKeyDown = useCallback((e: KeyboardEvent) => {
        /*
        * Some global shortcuts interfere with the default shortcuts of the mind map,
        * as defined here: https://mind-elixir.com/docs/guides/shortcuts
        */
        if (e.key === "F1") {
            e.stopPropagation();
        }

        // Zoom controls
        const isCtrl = e.ctrlKey && !e.altKey && !e.metaKey;
        if (isCtrl && (e.key == "-" || e.key == "=" || e.key == "0")) {
            e.stopPropagation();
        }
    }, []);

    return (
        <div className="note-detail-mind-map note-detail-printable">
            <MindElixir
                content={content}
                containerProps={{
                    className: "mind-map-container",
                    onKeyDown
                }}
            />
        </div>
    )
}

function MindElixir({ content, containerProps, direction }: MindElixirProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const mind = new VanillaMindElixir({
            el: containerRef.current,
            direction
        });

        mind.install(nodeMenu);
        mind.init(content);

        return () => mind.destroy();
    }, []);

    return (
        <div ref={containerRef} {...containerProps}>

        </div>
    )
}
