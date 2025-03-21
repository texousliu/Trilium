import library_loader from "../../services/library_loader.js";
import { loadElkIfNeeded, postprocessMermaidSvg } from "../../services/mermaid.js";
import AbstractSvgSplitTypeWidget from "./abstract_svg_split_type_widget.js";

let idCounter = 1;

export class MermaidTypeWidget extends AbstractSvgSplitTypeWidget {

    static getType() {
        return "mermaid";
    }

    async renderSvg(content: string) {
        await library_loader.requireLibrary(library_loader.MERMAID);
        await loadElkIfNeeded(content);

        mermaid.mermaidAPI.initialize({
            startOnLoad: false,
            ...(getMermaidConfig() as any)
        });

        idCounter++;
        const { svg } = await mermaid.mermaidAPI.render(`mermaid-graph-${idCounter}`, content);
        return postprocessMermaidSvg(svg);
    }

}

export function getMermaidConfig(): MermaidConfig {
    const documentStyle = window.getComputedStyle(document.documentElement);
    const mermaidTheme = documentStyle.getPropertyValue("--mermaid-theme");

    return {
        theme: mermaidTheme.trim(),
        securityLevel: "antiscript",
        // TODO: Are all these options correct?
        flow: { useMaxWidth: false },
        sequence: { useMaxWidth: false },
        gantt: { useMaxWidth: false },
        class: { useMaxWidth: false },
        state: { useMaxWidth: false },
        pie: { useMaxWidth: true },
        journey: { useMaxWidth: false },
        git: { useMaxWidth: false }
    };
}
