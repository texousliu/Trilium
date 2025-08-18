import { t } from "../../../services/i18n"
import FormCheckbox from "../../react/FormCheckbox"
import FormGroup from "../../react/FormGroup"
import { useTriliumOptionBool } from "../../react/hooks"
import OptionsSection from "./components/OptionsSection"

export default function CodeNoteSettings() {
    return (
        <>
            <Editor />
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