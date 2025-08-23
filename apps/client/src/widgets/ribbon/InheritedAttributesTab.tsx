import { useEffect, useState } from "preact/hooks";
import { TabContext } from "./ribbon-interface";
import FAttribute from "../../entities/fattribute";
import { useTriliumEventBeta } from "../react/hooks";
import attributes from "../../services/attributes";
import { t } from "../../services/i18n";
import attribute_renderer from "../../services/attribute_renderer";
import RawHtml from "../react/RawHtml";
import { joinElements } from "../react/react_utils";

export default function InheritedAttributesTab({ note, componentId }: TabContext) {
    const [ inheritedAttributes, setInheritedAttributes ] = useState<FAttribute[]>();

    function refresh() {
        const attrs = note.getAttributes().filter((attr) => attr.noteId !== this.noteId);
        attrs.sort((a, b) => {
            if (a.noteId === b.noteId) {
                return a.position - b.position;
            } else {
                // inherited attributes should stay grouped: https://github.com/zadam/trilium/issues/3761
                return a.noteId < b.noteId ? -1 : 1;
            }
        });

        setInheritedAttributes(attrs);
    }

    useEffect(refresh, [ note ]);
    useTriliumEventBeta("entitiesReloaded", ({ loadResults }) => {
        if (loadResults.getAttributeRows(componentId).find((attr) => attributes.isAffecting(attr, this.note))) {
            this.refresh();
        }
    });
    
    return (
        <div className="inherited-attributes-widget">
            <div className="inherited-attributes-container">
                {inheritedAttributes?.length > 0 ? (
                    joinElements(inheritedAttributes.map(attribute => (
                        <InheritedAttribute attribute={attribute} />
                    )), " ")
                ) : (
                    <>{t("inherited_attribute_list.no_inherited_attributes")}</>
                )}
            </div>
        </div>
    )
}
function InheritedAttribute({ attribute }: { attribute: FAttribute }) {
    const [ html, setHtml ] = useState<JQuery<HTMLElement> | string>("");
    useEffect(() => {
        attribute_renderer.renderAttribute(attribute, false).then(setHtml);
    }, []);

    return <RawHtml html={html} />
}