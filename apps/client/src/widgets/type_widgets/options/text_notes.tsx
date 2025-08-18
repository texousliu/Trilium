import { useEffect } from "preact/hooks";
import { t } from "../../../services/i18n";
import FormCheckbox from "../../react/FormCheckbox";
import FormRadioGroup from "../../react/FormRadioGroup";
import { useTriliumOption, useTriliumOptionBool } from "../../react/hooks";
import OptionsSection from "./components/OptionsSection";
import { toggleBodyClass } from "../../../services/utils";

export default function TextNoteSettings() {
    return (
        <>
            <FormattingToolbar />
            <EditorFeatures />
            <HeadingStyle />
        </>
    )
}

function FormattingToolbar() {
    const [ textNoteEditorType, setTextNoteEditorType ] = useTriliumOption("textNoteEditorType", true);
    const [ textNoteEditorMultilineToolbar, setTextNoteEditorMultilineToolbar ] = useTriliumOptionBool("textNoteEditorMultilineToolbar", true);

    return (
        <OptionsSection title={t("editing.editor_type.label")}>
            <FormRadioGroup
                name="editor-type"
                currentValue={textNoteEditorType} onChange={setTextNoteEditorType}
                values={[
                    {
                        value: "ckeditor-balloon",
                        label: t("editing.editor_type.floating.title"),
                        inlineDescription: t("editing.editor_type.floating.description")
                    },
                    {
                        value: "ckeditor-classic",
                        label: t("editing.editor_type.fixed.title"),
                        inlineDescription: t("editing.editor_type.fixed.description")
                    }
                ]}
            />

            <FormCheckbox
                name="multiline-toolbar"
                label={t("editing.editor_type.multiline-toolbar")}
                currentValue={textNoteEditorMultilineToolbar} onChange={setTextNoteEditorMultilineToolbar}
                containerStyle={{ marginLeft: "1em" }}
            />
        </OptionsSection>
    )
}

function EditorFeatures() {
    const [ textNoteEmojiCompletionEnabled, setTextNoteEmojiCompletionEnabled] = useTriliumOptionBool("textNoteEmojiCompletionEnabled");
    const [ textNoteCompletionEnabled, setTextNoteCompletionEnabled ] = useTriliumOptionBool("textNoteCompletionEnabled");

    return (
        <OptionsSection title={t("editorfeatures.title")}>
            <FormCheckbox
                name="emoji-completion-enabled"
                label={t("editorfeatures.emoji_completion_enabled")}
                currentValue={textNoteEmojiCompletionEnabled} onChange={setTextNoteEmojiCompletionEnabled}
            /> 

            <FormCheckbox
                name="note-completion-enabled"
                label={t("editorfeatures.note_completion_enabled")}
                currentValue={textNoteCompletionEnabled} onChange={setTextNoteCompletionEnabled}
            />
        </OptionsSection>
    );
}

function HeadingStyle() {
    const [ headingStyle, setHeadingStyle ] = useTriliumOption("headingStyle");

    useEffect(() => {
        toggleBodyClass("heading-style-", headingStyle);
    }, [ headingStyle ]);

    return (
        <OptionsSection title={t("heading_style.title")}>
            <FormRadioGroup
                name="heading-style"
                currentValue={headingStyle} onChange={setHeadingStyle}
                values={[
                    { value: "plain", label: t("heading_style.plain") },
                    { value: "underline", label: t("heading_style.underline") },
                    { value: "markdown", label: t("heading_style.markdown") }
                ]}
            />
        </OptionsSection>
    );
}