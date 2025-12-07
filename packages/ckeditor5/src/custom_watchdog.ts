import { CKEditorError, EditorWatchdog } from "ckeditor5";

const IGNORED_ERRORS = [
    // See: https://github.com/TriliumNext/Trilium/issues/5776
    "TypeError: Cannot read properties of null (reading 'parent')"
]

export default class CustomWatchdog extends EditorWatchdog {

    _isErrorComingFromThisItem(error: CKEditorError): boolean {
        for (const ignoredError of IGNORED_ERRORS) {
            if (error.message.includes(ignoredError)) {
                return false;
            }
        }

        return super._isErrorComingFromThisItem(error);
    }

}
