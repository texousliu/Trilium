import { HiddenSubtreeItem } from "@triliumnext/commons";

export default function buildHiddenSubtreeTemplates() {
    const templates: HiddenSubtreeItem = {
        id: "_templates",
        title: "Built-in templates",
        type: "book",
        children: [
            {
                id: "_template_text_snippet",
                type: "text",
                title: "Text Snippet",
                icon: "bx-align-left",
                attributes: [
                    {
                        name: "template",
                        type: "label"
                    },
                    {
                        name: "textSnippet",
                        type: "label"
                    },
                    {
                        name: "label:textSnippetDescription",
                        type: "label",
                        value: "promoted,alias=Description,single,text"
                    }
                ]
            },
            {
                id: "_template_table",
                type: "book",
                title: "Table",
                icon: "bx bx-table",
                attributes: [
                    {
                        name: "template",
                        type: "label"
                    },
                    {
                        name: "viewType",
                        type: "label",
                        value: "table"
                    }
                ]
            },
            {
                id: "_template_geo_map",
                type: "book",
                title: "Geo Map",
                icon: "bx bx-map-alt",
                attributes: [
                    {
                        name: "template",
                        type: "label"
                    },
                    {
                        name: "viewType",
                        type: "label",
                        value: "geoMap"
                    },
                    {
                        name: "hidePromotedAttributes",
                        type: "label"
                    },
                    {
                        name: "label:geolocation",
                        type: "label",
                        value: "promoted,alias=Geolocation,single,text",
                        isInheritable: true
                    }
                ]
            }
        ]
    };

    return templates;
}
