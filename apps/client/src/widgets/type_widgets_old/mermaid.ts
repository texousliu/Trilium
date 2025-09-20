import type { EditorConfig } from "@triliumnext/codemirror";
import { getMermaidConfig, loadElkIfNeeded, postprocessMermaidSvg } from "../../services/mermaid.js";
import AbstractSvgSplitTypeWidget from "./abstract_svg_split_type_widget.js";


export class MermaidTypeWidget extends AbstractSvgSplitTypeWidget {

    static getType() {
        return "mermaid";
    }

    get attachmentName(): string {
        return "mermaid-export";
    }

    async renderSvg(content: string) {

    }

}
