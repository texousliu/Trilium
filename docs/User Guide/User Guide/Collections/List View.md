# List View
<figure class="image"><img style="aspect-ratio:1387/758;" src="List View_image.png" width="1387" height="758"></figure>

List view is similar to <a class="reference-link" href="Grid%20View.md">Grid View</a>, but in the list view mode, each note is displayed in a single row with only the title and the icon of the note being visible by the default. By pressing the expand button it's possible to view the content of the note, as well as the children of the note (recursively).

In the example above, the "Node.js" note on the left panel contains several child notes. The right panel displays the content of these child notes as a single continuous document.

## Interaction

*   Each note can be expanded or collapsed by clicking on the arrow to the left of the title.
*   In the <a class="reference-link" href="../Basic%20Concepts%20and%20Features/UI%20Elements/Ribbon.md">Ribbon</a>, in the _Collection_ tab there are options to expand and to collapse all notes easily.

## Printing and exporting to PDF

Since v0.100.0, list collections can be [printed or exported to PDF](../Basic%20Concepts%20and%20Features/Notes/Printing%20%26%20Exporting%20as%20PDF.md).

A printed list collection will print all the notes in the collection, in the right order and preserving the full hierarchy.

If exported to PDF within the desktop application, there is additional functionality:

*   The table of contents of the PDF will reflect the structure of the notes.
*   Reference and inline links to other notes within the same hierarchy will be functional (will jump to the corresponding page). If a link refers to a note that is not in the printed hierarchy, it will be unlinked.