# Note Tree
This page explains how to manipulate the note tree in TriliumNext, focusing on moving notes.

![](1_Note%20Tree_image.png)

## Drag and Drop

![Drag and drop example](../../Attachments/drag-and-drop.gif)

You can easily rearrange the note tree by dragging and dropping notes, as demonstrated in the example above.

## Keyboard Manipulation

![Example of using keyboard keys to move a note](../../Attachments/move-note-with-keyboard.gif)Trilium offers efficient keyboard-based manipulation using the following [shortcuts](../Keyboard%20Shortcuts.md):

*   `CTRL-UP` and `CTRL-DOWN`: Move the note up or down in the order.
*   `CTRL-LEFT`: Move the note up in the hierarchy by changing its parent to the note's grandparent.
*   `CTRL-RIGHT`: Move the note down in the hierarchy by setting its parent to the note currently above it (this action is best understood through a demo or hands-on experience).
*   `LEFT` and `RIGHT`: Expand and collapse a sub-tree.

## Context Menu

You can also move notes using the familiar cut and paste functions available in the context menu, or with the associated keyboard [shortcuts](../Keyboard%20Shortcuts.md): `CTRL-C` ( [copy](../Note/Cloning%20Notes.md)), `CTRL-X` (cut) and `CTRL-V` (paste).

## Multiple selection

It is possible to select multiple notes at one time.

To do so, first select the note to start the selection with. Then hold Shift and click on the note to end the selection with. All the notes between the start and the end note will be selected as well.

![](Note%20Tree_image.png)

In the right-click menu, operations such as Cut, Copy, Move to, Clone to or Delete will apply to all the selected notes. It is also possible to apply [Bulk actions](../../Advanced%20Usage/Bulk%20actions.md) to them. The rest of the options will not be available and will appear disabled in the menu.