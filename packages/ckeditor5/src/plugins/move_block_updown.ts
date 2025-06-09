/**
 * https://github.com/TriliumNext/Notes/issues/1002
 */

import { Command, DocumentSelection, Element, Node, Plugin } from 'ckeditor5';

export default class MoveBlockUpDownPlugin extends Plugin {

    init() {
        const editor = this.editor;

        editor.commands.add('moveBlockUp', new MoveBlockUpCommand(editor));
        editor.commands.add('moveBlockDown', new MoveBlockDownCommand(editor));

		// Use native DOM capturing to intercept Ctrl/Alt + ↑/↓, 
		// as plugin-level keystroke handling may fail when the selection is near an object.
        this.bindMoveBlockShortcuts(editor);
    }
	
	bindMoveBlockShortcuts(editor: any) {
		editor.editing.view.once('render', () => {
			const domRoot = editor.editing.view.getDomRoot();
			if (!domRoot) return;

			const handleKeydown = (e: KeyboardEvent) => {
				const keyMap = {
					ArrowUp: 'moveBlockUp',
					ArrowDown: 'moveBlockDown'
				};

				const command = keyMap[e.key];
				const isCtrl = e.ctrlKey || e.metaKey;
				const hasModifier = (isCtrl || e.altKey) && !(isCtrl && e.altKey);

				if (command && hasModifier) {
					e.preventDefault();
					e.stopImmediatePropagation();
					editor.execute(command);
				}
			};

			domRoot.addEventListener('keydown', handleKeydown, { capture: true });
		});
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
		const firstBlock = selectedBlocks[0];
		const lastBlock = selectedBlocks[selectedBlocks.length - 1];
		const startOffset = model.document.selection.getFirstPosition()?.offset ?? 0;
		const endOffset = model.document.selection.getLastPosition()?.offset ?? 0;

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
			if (
				startOffset <= (firstBlock.maxOffset ?? Infinity) &&
				endOffset <= (lastBlock.maxOffset ?? Infinity)
			) {
				writer.setSelection(
					writer.createRange(
						writer.createPositionAt(firstBlock, startOffset),
						writer.createPositionAt(lastBlock, endOffset)
					)
				);
			}

			this.scrollToSelection();
        });
    }
	
	getSelectedBlocks(selection: DocumentSelection) {
		const blocks = [...selection.getSelectedBlocks()];

		// If the selected block is an object, such as a block quote or admonition, return the entire block.
		if (blocks.length === 1) {
			const block = blocks[0];
			const parent = block.parent;
			if (!parent?.name?.startsWith('$')) {
				return [parent as Element];
			}
		}

		return blocks;
	}
	
	scrollToSelection() {
		// Ensure scroll happens in sync with DOM updates
		requestAnimationFrame(() => {
			this.editor.editing.view.scrollToTheSelection();
		});
	};
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
