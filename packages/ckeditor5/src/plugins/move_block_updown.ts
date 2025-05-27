/**
 * https://github.com/TriliumNext/Notes/issues/1002
 */

import { Command, DocumentSelection, Element, Plugin } from 'ckeditor5';

export default class MoveBlockUpDownPlugin extends Plugin {

    init() {
        const editor = this.editor;
        editor.config.define('moveBlockUp', {
            keystroke: 'ctrl+arrowup',
        });
        editor.config.define('moveBlockDown', {
            keystroke: 'ctrl+arrowdown',
        });

        const keystrokeUp = editor.config.get('moveBlockUp.keystroke')!;
        const keystrokeDown = editor.config.get('moveBlockDown.keystroke')!;

        editor.commands.add('moveBlockUp', new MoveBlockUpCommand(editor));
        editor.commands.add('moveBlockDown', new MoveBlockDownCommand(editor));

        editor.keystrokes.set(keystrokeUp, 'moveBlockUp');
        editor.keystrokes.set(keystrokeDown, 'moveBlockDown');
    }

}

abstract class MoveBlockUpDownCommand extends Command {

	abstract getSelectedBlocks(selection: DocumentSelection);
	abstract getSibling(selectedBlock: Element);
    abstract get offset(): "before" | "after";

    refresh() {
		const selection = this.editor.model.document.selection;
		const selectedBlocks = this.getSelectedBlocks(selection);

		this.isEnabled = true;
		for (const selectedBlock of selectedBlocks) {
			if (!this.getSibling(selectedBlock)) this.isEnabled = false;
		}
	}

	execute() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedBlocks = this.getSelectedBlocks(selection);

		model.change((writer) => {
			for (const selectedBlock of selectedBlocks) {
				const sibling = this.getSibling(selectedBlock);
				if (sibling) {
					const range = model.createRangeOn(selectedBlock);
					writer.move(range, sibling, this.offset);
				}
			}
		});
	}
}

class MoveBlockUpCommand extends MoveBlockUpDownCommand {

    getSelectedBlocks(selection: DocumentSelection) {
        return [...selection.getSelectedBlocks()];
    }

    getSibling(selectedBlock: Element) {
        return selectedBlock.previousSibling;
    }

    get offset() {
        return "before" as const;
    }

}

class MoveBlockDownCommand extends MoveBlockUpDownCommand {

	/** @override */
	getSelectedBlocks(selection: DocumentSelection) {
		return [...selection.getSelectedBlocks()].reverse();
	}

	/** @override */
	getSibling(selectedBlock: Element) {
		return selectedBlock.nextSibling;
	}

	/** @override */
	get offset() {
		return "after" as const;
	}
}
