import { useContext, useEffect, useMemo, useState } from "preact/hooks";
import { t } from "../../../services/i18n";
import FormCheckbox from "../../react/FormCheckbox";
import FormRadioGroup from "../../react/FormRadioGroup";
import { useTriliumOption, useTriliumOptionBool } from "../../react/hooks";
import OptionsSection from "./components/OptionsSection";
import { toggleBodyClass } from "../../../services/utils";
import FormGroup from "../../react/FormGroup";
import Column from "../../react/Column";
import { FormSelectGroup, FormSelectWithGroups } from "../../react/FormSelect";
import { Themes, type Theme } from "@triliumnext/highlightjs";
import { ensureMimeTypesForHighlighting, loadHighlightingTheme } from "../../../services/syntax_highlight";
import { normalizeMimeTypeForCKEditor } from "@triliumnext/commons";
import { ComponentChildren } from "preact";
import RawHtml, { getHtml } from "../../react/RawHtml";
import { ParentComponent } from "../../react/ReactBasicWidget";
import { CSSProperties } from "preact/compat";

export default function TextNoteSettings() {
    return (
        <>
            <FormattingToolbar />
            <EditorFeatures />
            <HeadingStyle />
            <CodeBlockStyle />
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

function CodeBlockStyle() {
    const themes = useMemo(() => groupThemesByLightOrDark(), []);
    const [ codeBlockTheme, setCodeBlockTheme ] = useTriliumOption("codeBlockTheme");
    const [ codeBlockWordWrap, setCodeBlockWordWrap ] = useTriliumOptionBool("codeBlockWordWrap");

    return (
        <OptionsSection title={t("highlighting.title")}>            
            <FormGroup className="row">
                <Column md={6}>
                    <label>{t("highlighting.color-scheme")}</label>
                    <FormSelectWithGroups
                        values={themes}
                        keyProperty="val" titleProperty="title"
                        currentValue={codeBlockTheme} onChange={(newTheme) => {
                            loadHighlightingTheme(newTheme);
                            setCodeBlockTheme(newTheme);
                        }}
                    />
                </Column>

                <Column md={6} className="side-checkbox">
                    <FormCheckbox
                        name="word-wrap"
                        label={t("code_block.word_wrapping")}
                        currentValue={codeBlockWordWrap} onChange={setCodeBlockWordWrap}
                    />
                </Column>
            </FormGroup>
            
            <CodeBlockPreview theme={codeBlockTheme} wordWrap={codeBlockWordWrap} />
        </OptionsSection>
    )
}

const SAMPLE_LANGUAGE = normalizeMimeTypeForCKEditor("application/javascript;env=frontend");
const SAMPLE_CODE = `\
const n = 10;
greet(n); // Print "Hello World" for n times

/**
 * Displays a "Hello World!" message for a given amount of times, on the standard console. The "Hello World!" text will be displayed once per line.
 *
 * @param {number} times    The number of times to print the \`Hello World!\` message.
 */
function greet(times) {
  for (let i = 0; i++; i < times) {
    console.log("Hello World!");
  }
}
`;

function CodeBlockPreview({ theme, wordWrap }: { theme: string, wordWrap: boolean }) {
    const [ code, setCode ] = useState<string>(SAMPLE_CODE);

    useEffect(() => {
        if (theme !== "none") {
            import("@triliumnext/highlightjs").then(async (hljs) => {
                await ensureMimeTypesForHighlighting();
                const highlightedText = hljs.highlight(SAMPLE_CODE, {
                    language: SAMPLE_LANGUAGE
                });
                if (highlightedText) {
                    setCode(highlightedText.value);
                }
            });
        } else {
            setCode(SAMPLE_CODE);
        }
    }, [theme]);

    const codeStyle = useMemo<CSSProperties>(() => {
        if (wordWrap) {
            return { whiteSpace: "pre-wrap" };
        } else {
            return { whiteSpace: "pre"};
        }
    }, [ wordWrap ]);

    return (
        <div className="note-detail-readonly-text-content ck-content code-sample-wrapper">
            <pre className="hljs" style={{ marginBottom: 0 }}>
                <code className="code-sample" style={codeStyle} dangerouslySetInnerHTML={getHtml(code)} />
            </pre>
        </div>
    )
}

interface ThemeData {
    val: string;
    title: string;
}

function groupThemesByLightOrDark() {
    const darkThemes: ThemeData[] = [];
    const lightThemes: ThemeData[] = [];

    for (const [ id, theme ] of Object.entries(Themes)) {
        const data: ThemeData = {
            val: "default:" + id,
            title: theme.name
        };

        if (theme.name.includes("Dark")) {
            darkThemes.push(data);
        } else {
            lightThemes.push(data);
        }
    }

    const output: FormSelectGroup<ThemeData>[] = [
        {
            title: "",
            items: [{
                val: "none",
                title: t("code_block.theme_none")
            }]
        },
        {
            title: t("code_block.theme_group_light"),
            items: lightThemes
        },
        {
            title: t("code_block.theme_group_dark"),
            items: darkThemes
        }
    ];
    return output;
}