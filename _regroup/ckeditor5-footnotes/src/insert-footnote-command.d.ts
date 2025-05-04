import { Command } from 'ckeditor5/src/core.js';
export default class InsertFootnoteCommand extends Command {
    /**
   * Creates a footnote reference with the given index, and creates a matching
   * footnote if one doesn't already exist. Also creates the footnote section
   * if it doesn't exist. If `footnoteIndex` is 0 (or not provided), the added
   * footnote is given the next unused index--e.g. 7, if 6 footnotes exist so far.
   */
    execute({ footnoteIndex }?: {
        footnoteIndex?: number;
    }): void;
    /**
   * Called automatically when changes are applied to the document. Sets `isEnabled`
   * to determine whether footnote creation is allowed at the current location.
   */
    refresh(): void;
    /**
   * Returns the footnote section if it exists, or creates on if it doesn't.
   */
    private _getFootnoteSection;
}
