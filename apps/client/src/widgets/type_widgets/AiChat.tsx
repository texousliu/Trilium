import { useEffect, useRef, useState } from "preact/hooks";
import { useEditorSpacedUpdate, useLegacyWidget } from "../react/hooks";
import { type TypeWidgetProps } from "./type_widget";
import LlmChatPanel from "../llm_chat";

export default function AiChat({ note, noteContext }: TypeWidgetProps) {
    const dataRef = useRef<string>();
    const spacedUpdate = useEditorSpacedUpdate({
        note,
        getData: async () => dataRef.current,
        onContentChange: (newContent) => dataRef.current = newContent
    });
    const [ ChatWidget, llmChatPanel ] = useLegacyWidget(() => {
        return new LlmChatPanel();
    }, {
        noteContext,
        containerClassName: "ai-chat-widget-container",
        containerStyle: {
            height: "100%"
        }
    });

    useEffect(() => {
        llmChatPanel.setDataCallbacks(
            async (data) => {
                dataRef.current = data;
                spacedUpdate.scheduleUpdate();
            },
            async () => dataRef.current
        );
    }, []);

    useEffect(() => {
        llmChatPanel.setCurrentNoteId(note.noteId);
    }, [ note ]);

    return ChatWidget;
}
