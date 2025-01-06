/**
 * CKEditor dataview nodes can be converted to a output view or an editor view via downcasting
 *  * Upcasting is converting to the platonic ckeditor version.
 *  * Downcasting is converting to the output version.
 */
import { type RootElement } from 'ckeditor5/src/engine.js';
import { Autoformat } from "@ckeditor/ckeditor5-autoformat";
import { Plugin } from "ckeditor5/src/core.js";
import { Widget } from 'ckeditor5/src/widget.js';
import '../footnote.css';
export default class FootnoteEditing extends Plugin {
    static get requires(): readonly [typeof Widget, typeof Autoformat];
    /**
   * The root element of the document.
   */
    get rootElement(): RootElement;
    init(): void;
    /**
   * This method broadly deals with deletion of text and elements, and updating the model
   * accordingly. In particular, the following cases are handled:
   * 1. If the footnote section gets deleted, all footnote references are removed.
   * 2. If a delete operation happens in an empty footnote, the footnote is deleted.
   */
    private _handleDelete;
    /**
   * Clear the children of the provided footnoteContent element,
   * leaving an empty paragraph behind. This allows users to empty
   * a footnote without deleting it. modelWriter is passed in to
   * batch these changes with the ones that instantiated them,
   * such that the set can be undone with a single action.
   */
    private _clearContents;
    /**
   * Removes a footnote and its references, and renumbers subsequent footnotes. When a footnote's
   * id attribute changes, it's references automatically update from a dispatcher event in converters.js,
   * which triggers the `updateReferenceIds` method. modelWriter is passed in to batch these changes with
   * the ones that instantiated them, such that the set can be undone with a single action.
   */
    private _removeFootnote;
    /**
   * Deletes all references to the footnote with the given id. If no id is provided,
   * all references are deleted. modelWriter is passed in to batch these changes with
   * the ones that instantiated them, such that the set can be undone with a single action.
   */
    private _removeReferences;
    /**
   * Updates all references for a single footnote. This function is called when
   * the index attribute of an existing footnote changes, which happens when a footnote
   * with a lower index is deleted. batch is passed in to group these changes with
   * the ones that instantiated them.
   */
    private _updateReferenceIndices;
    /**
   * Reindexes footnotes such that footnote references occur in order, and reorders
   * footnote items in the footer section accordingly. batch is passed in to group changes with
   * the ones that instantiated them.
   */
    private _orderFootnotes;
}
