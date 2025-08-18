import CodeMirror, { ColorThemes, getThemeById } from "@triliumnext/codemirror";
import { t } from "../../../services/i18n";
import Column from "../../react/Column";
import FormCheckbox from "../../react/FormCheckbox";
import FormGroup from "../../react/FormGroup";
import FormSelect from "../../react/FormSelect";
import { useTriliumOption, useTriliumOptionBool } from "../../react/hooks";
import OptionsSection from "./components/OptionsSection";
import { useEffect, useMemo, useRef } from "preact/hooks";
import codeNoteSample from "./samples/code_note.txt?raw";
import { DEFAULT_PREFIX } from "../abstract_code_type_widget";

const SAMPLE_MIME = "application/typescript";

export default function CodeNoteSettings() {
    return (
        <>
            <Editor />
            <Appearance />
        </>
    )
}

function Editor() {
    const [ vimKeymapEnabled, setVimKeymapEnabled ] = useTriliumOptionBool("vimKeymapEnabled");

    return (
        <OptionsSection title={t("code-editor-options.title")}>
            <FormGroup description={t("vim_key_bindings.enable_vim_keybindings")}>
                <FormCheckbox
                    name="vim-keymap-enabled"
                    label={t("vim_key_bindings.use_vim_keybindings_in_code_notes")}
                    currentValue={vimKeymapEnabled} onChange={setVimKeymapEnabled}
                />
            </FormGroup>
        </OptionsSection>
    )
}

function Appearance() {
    const [ codeNoteTheme, setCodeNoteTheme ] = useTriliumOption("codeNoteTheme");
    const [ codeLineWrapEnabled, setCodeLineWrapEnabled ] = useTriliumOptionBool("codeLineWrapEnabled");

    const themes = useMemo(() => {
        return ColorThemes.map(({ id, name }) => ({
            id: "default:" + id,
            name
        }));
    }, []);

    return (
        <OptionsSection title={t("code_theme.title")}>
            <FormGroup className="row">
                <Column>
                    <label>{t("code_theme.color-scheme")}</label>
                    <FormSelect 
                        values={themes}
                        keyProperty="id" titleProperty="name"
                        currentValue={codeNoteTheme} onChange={setCodeNoteTheme}
                    />
                </Column>

                <Column className="side-checkbox">
                    <FormCheckbox
                        name="word-wrap"
                        label={t("code_theme.word_wrapping")}
                        currentValue={codeLineWrapEnabled} onChange={setCodeLineWrapEnabled}
                    />
                </Column>
            </FormGroup>

            <CodeNotePreview wordWrapping={codeLineWrapEnabled} themeName={codeNoteTheme} />
        </OptionsSection>
    );
}

function CodeNotePreview({ themeName, wordWrapping }: { themeName: string, wordWrapping: boolean }) {
    const editorRef = useRef<CodeMirror>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        // Clean up previous instance.
        editorRef.current?.destroy();
        containerRef.current.innerHTML = "";

        // Set up a new instance.
        const editor = new CodeMirror({
            parent: containerRef.current
        });
        editor.setText(codeNoteSample);
        editor.setMimeType(SAMPLE_MIME);
        editorRef.current = editor;
    }, []);

    useEffect(() => {
        editorRef.current?.setLineWrapping(wordWrapping);
    }, [ wordWrapping ]);

    useEffect(() => {
        if (themeName?.startsWith(DEFAULT_PREFIX)) {
            const theme = getThemeById(themeName.substring(DEFAULT_PREFIX.length));
            if (theme) {
                editorRef.current?.setTheme(theme);
            }
        }
    }, [ themeName ]);

    return (
        <div
            ref={containerRef}
            class="note-detail-readonly-code-content"
            style={{ margin: 0, height: "200px" }}
        />
    );
}