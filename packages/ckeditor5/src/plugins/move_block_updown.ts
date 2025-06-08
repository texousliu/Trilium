/**
 * https://github.com/TriliumNext/Notes/issues/1002
 */

import { Command, DocumentSelection, Element, Node, Plugin } from 'ckeditor5';

export default class MoveBlockUpDownPlugin extends Plugin {

    init() {
        const editor = this.editor;
        editor.config.define('moveBlockUp', {
            keystroke: ['ctrl+arrowup', 'alt+arrowup'],
        });
        editor.config.define('moveBlockDown', {
            keystroke: ['ctrl+arrowdown', 'alt+arrowdown'],
        });

        editor.commands.add('moveBlockUp', new MoveBlockUpCommand(editor));
        editor.commands.add('moveBlockDown', new MoveBlockDownCommand(editor));

        for (const keystroke of editor.config.get('moveBlockUp.keystroke') ?? []) {
            editor.keystrokes.set(keystroke, 'moveBlockUp');
        }
        for (const keystroke of editor.config.get('moveBlockDown.keystroke') ?? []) {
            editor.keystrokes.set(keystroke, 'moveBlockDown');
        }
    }

}

abstract class MoveBlockUpDownCommand extends Command {

	abstract getSibling(selectedBlock: Element): Node | null;
    abstract get offset(): "before" | "after";

	override execute() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedBlocks = this.getSelectedBlocks(selection);
		const isEnabled = selectedBlocks.length > 0
			&& selectedBlocks.every(block => !!this.getSibling(block));

		if (!isEnabled) {
			return;
		}
		
		const movingBlocks = this.offset === 'before'
            ? selectedBlocks
            : [...selectedBlocks].reverse();

        // Store selection offsets
		const offsets = [
			model.document.selection.getFirstPosition()?.offset,
			model.document.selection.getLastPosition()?.offset
		];

		model.change((writer) => {
			// Move blocks
			for (const block of movingBlocks) {
				const sibling = this.getSibling(block);
				if (sibling) {
					const range = model.createRangeOn(block);
					writer.move(range, sibling, this.offset);
				}
			}

			// Restore selection to all items if many have been moved
			const range = writer.createRange(
				writer.createPositionAt(selectedBlocks[0], offsets[0]),
				writer.createPositionAt(
					selectedBlocks[selectedBlocks.length - 1], offsets[1]));
			writer.setSelection(range);
        });
    }
	
    getSelectedBlocks(selection: DocumentSelection) {
        return [...selection.getSelectedBlocks()];
    }
}

class MoveBlockUpCommand extends MoveBlockUpDownCommand {

    getSibling(selectedBlock: Element) {
        return selectedBlock.previousSibling;
    }

    get offset() {
        return "before" as const;
    }

}

class MoveBlockDownCommand extends MoveBlockUpDownCommand {

	/** @override */
	getSibling(selectedBlock: Element) {
		return selectedBlock.nextSibling;
	}

	/** @override */
	get offset() {
		return "after" as const;
	}
}
