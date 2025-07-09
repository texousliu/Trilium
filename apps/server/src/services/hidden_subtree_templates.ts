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
                id: "_template_calendar",
                type: "book",
                title: "Calendar",
                icon: "bx bx-calendar",
                attributes: [
                    {
                        name: "template",
                        type: "label",
                    },
                    {
                        name: "collection",
                        type: "label"
                    },
                    {
                        name: "viewType",
                        type: "label",
                        value: "calendar"
                    },
                    {
                        name: "hidePromotedAttributes",
                        type: "label"
                    },
                    {
                        name: "label:startDate",
                        type: "label",
                        value: "promoted,alias=Start Date,single,date",
                        isInheritable: true
                    },
                    {
                        name: "label:endDate",
                        type: "label",
                        value: "promoted,alias=End Date,single,date",
                        isInheritable: true
                    },
                    {
                        name: "label:startTime",
                        type: "label",
                        value: "promoted,alias=Start Time,single,time",
                        isInheritable: true
                    },
                    {
                        name: "label:endTime",
                        type: "label",
                        value: "promoted,alias=End Time,single,time",
                        isInheritable: true
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
                        name: "collection",
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
                        name: "collection",
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
