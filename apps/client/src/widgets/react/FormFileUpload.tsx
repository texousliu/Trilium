import { Ref } from "preact";

interface FormFileUploadProps {
    name?: string;
    onChange: (files: FileList | null) => void;
    multiple?: boolean;
    hidden?: boolean;
    inputRef?: Ref<HTMLInputElement>;
}

export default function FormFileUpload({ inputRef, name, onChange, multiple, hidden }: FormFileUploadProps) {
    return (
        <label class="tn-file-input tn-input-field" style={hidden ? { display: "none" } : undefined}>
            <input
                ref={inputRef}
                name={name}
                type="file"
                class="form-control-file"
                multiple={multiple}                
                onChange={e => onChange((e.target as HTMLInputElement).files)} />
        </label>
    )
}