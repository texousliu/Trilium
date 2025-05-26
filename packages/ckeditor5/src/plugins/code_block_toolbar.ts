import { CodeBlock, Plugin, Position, ViewDocumentFragment, WidgetToolbarRepository, type Node, type ViewNode } from "ckeditor5";

export default class CodeBlockToolbar extends Plugin {

    static get requires() {
        return [ WidgetToolbarRepository, CodeBlock ] as const;
    }

    afterInit() {
        const editor = this.editor;
        const widgetToolbarRepository = editor.plugins.get(WidgetToolbarRepository);

        widgetToolbarRepository.register("codeblock", {
            items: [
                {
                    label: "Hello",
                    items: [
                        {
                            label: "world",
                            items: []
                        }
                    ]
                }
            ],
            getRelatedElement(selection) {
                const selectionPosition = selection.getFirstPosition();
                if (!selectionPosition) {
                    return null;
                }

                let parent: ViewNode | ViewDocumentFragment | null = selectionPosition.parent;
                while (parent) {
                    if (parent.is("element", "pre")) {
                        return parent;
                    }

                    parent = parent.parent;
                }

                return null;
            }
        });
    }

}
