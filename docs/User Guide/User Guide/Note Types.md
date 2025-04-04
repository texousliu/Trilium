# Note Types
One core features of Trilium is that it supports multiple types of notes, depending on the need.

## Creating a new note with a different type via the note tree

The default note type in Trilium (e.g. when creating a new note) is [Text](Note%20Types/Text.md), since it's for general use.

To create a new note of a different type, head to the [Note Tree](Basic%20Concepts%20and%20Features/UI%20Elements/Note%20Tree.md) and right click an existing note where to place the new one and select:

*   _Insert note after_, to put the new note underneath the one selected.
*   _Insert child note_, to insert the note as a child of the selected note.

![](Note%20Types_image.png)

## Creating a new note of a different type via add link or new tab

*   When adding a [link](Note%20Types/Text/Links.md) in a [Text](Note%20Types/Text.md) note, type the desired title of the new note and press Enter. Afterwards the type of the note will be asked.
*   Similarly, when creating a new tab, type the desired title and press Enter.

## Changing the type of a note

It is possible to change the type of a note after it has been created via the _Basic Properties_ tab in the [Ribbon](Basic%20Concepts%20and%20Features/UI%20Elements/Ribbon.md). Note that it's generally a good idea to change the note type only if the note is empty. Can also be used to edit the [source of a note](Advanced%20Usage/Note%20source.md).

## Supported note types

The following note types are supported by Trilium:

|     |     |
| --- | --- |
| [Text](Note%20Types/Text.md) | The default note type, which allows for rich text formatting, images, admonitions and right-to-left support. |
| [Code](Note%20Types/Code.md) | Uses a mono-space font and can be used to store larger chunks of code or plain text than a text note, and has better syntax highlighting. |
| [Saved Search](Note%20Types/Saved%20Search.md) | Stores the information about a search (the search text, criteria, etc.) for later use. Can be used for quick filtering of a large amount of notes, for example. The search can easily be triggered. |
| [Relation Map](Note%20Types/Relation%20Map.md) | Allows easy creation of notes and relations between them. Can be used for mainly relational data such as a family tree. |
| [Note Map](Note%20Types/Note%20Map.md) | Displays the relationships between the notes, whether via relations or their hierarchical structure. |
| [Render Note](Note%20Types/Render%20Note.md) | Used in [Scripts](Note%20Types/Code/Scripts.md), it displays the HTML content of another note. This allows displaying any kind of content, provided there is a script behind it to generate it. |
| [Book](Note%20Types/Book.md) | Displays the children of the note either as a grid, a list, or for a more specialized case: a calendar. |
| [Mermaid Diagrams](Note%20Types/Mermaid%20Diagrams.md) | Displays diagrams such as bar charts, flow charts, state diagrams, etc. Requires a bit of technical knowledge since the diagrams are written in a specialized format. |
| [Canvas](Note%20Types/Canvas.md) | Allows easy drawing of sketches, diagrams, handwritten content. Uses the same technology behind [excalidraw.com](https://excalidraw.com). |
| [Web View](Note%20Types/Web%20View.md) | Displays the content of an external web page, similar to a browser. |
| [Mind Map](Note%20Types/Mind%20Map.md) | Easy for brainstorming ideas, by placing them in a hierarchical layout. |
| [Geo map](Note%20Types/Geo%20map.md) | Displays the children of the note as a geographical map, one use-case would be to plan vacations. It even has basic support for tracks. Notes can also be created from it. |