import { ComponentChildren } from "preact";
import { useNoteContext } from "../../react/hooks";
import { TabContext, TitleContext } from "../ribbon-interface";
import { useEffect, useMemo, useState } from "preact/hooks";
import { RIBBON_TAB_DEFINITIONS } from "../RibbonDefinition";

interface StandaloneRibbonAdapterProps {
    component: (props: TabContext) => ComponentChildren;
}

/**
 * Takes in any ribbon tab component and renders it in standalone mod using the note context, thus requiring no inputs.
 * Especially useful on mobile to detach components that would normally fit in the ribbon.
 */
export default function StandaloneRibbonAdapter({ component }: StandaloneRibbonAdapterProps) {
    const Component = component;
    const { note, ntxId, hoistedNoteId, notePath, noteContext, componentId } = useNoteContext();
    const definition = useMemo(() => RIBBON_TAB_DEFINITIONS.find(def => def.content === component), [ component ]);
    const [ shown, setShown ] = useState(unwrapShown(definition?.show, { note }));

    useEffect(() => {
        setShown(unwrapShown(definition?.show, { note }));
    }, [ note ]);

    return (
        <Component
            note={note}
            hidden={!shown}
            ntxId={ntxId}
            hoistedNoteId={hoistedNoteId}
            notePath={notePath}
            noteContext={noteContext}
            componentId={componentId}
            activate={() => {}}
        />
    );
}

function unwrapShown(value: boolean | ((context: TitleContext) => boolean | null | undefined) | undefined, context: TitleContext) {
    if (!value) return true;
    if (typeof value === "boolean") return value;
    return !!value(context);
}
