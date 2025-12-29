import "./PdfLayers.css";

import { useActiveNoteContext, useGetContextData, useNoteProperty } from "../react/hooks";
import Icon from "../react/Icon";
import RightPanelWidget from "./RightPanelWidget";

interface LayerInfo {
    id: string;
    name: string;
    visible: boolean;
}

export default function PdfLayers() {
    const { note } = useActiveNoteContext();
    const noteType = useNoteProperty(note, "type");
    const noteMime = useNoteProperty(note, "mime");

    if (noteType !== "file" || noteMime !== "application/pdf") {
        return null;
    }

    return (
        <RightPanelWidget id="pdf-layers" title="Layers">
            <PdfLayersList key={note?.noteId} />
        </RightPanelWidget>
    );
}

function PdfLayersList() {
    const layersData = useGetContextData("pdfLayers");

    if (!layersData || layersData.layers.length === 0) {
        return <div className="no-layers">No layers</div>;
    }

    return (
        <div className="pdf-layers-list">
            {layersData.layers.map((layer) => (
                <PdfLayerItem
                    key={layer.id}
                    layer={layer}
                    onToggle={layersData.toggleLayer}
                />
            ))}
        </div>
    );
}

function PdfLayerItem({ 
    layer, 
    onToggle 
}: { 
    layer: LayerInfo; 
    onToggle: (layerId: string, visible: boolean) => void;
}) {
    return (
        <div 
            className={`pdf-layer-item ${layer.visible ? 'visible' : 'hidden'}`}
            onClick={() => onToggle(layer.id, !layer.visible)}
        >
            <Icon icon={layer.visible ? "bx bx-show" : "bx bx-hide"} />
            <div className="pdf-layer-name">{layer.name}</div>
        </div>
    );
}
