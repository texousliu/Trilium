# Note List
When a note has one or more child notes, they will be listed at the end of the note for easy navigation.

## View types

By default, the notes will be displayed in a grid, however there are also some other view types available.

> [!TIP]
> Generally the view type can only be changed in a [Book](../../Note%20Types/Book.md) note from the [Ribbon](../UI%20Elements/Ribbon.md), but it can also be changed manually on any type of note using the `#viewType` attribute.

### Grid view

![](1_Note%20List_image.png)

This view presents the child notes in a grid format, allowing for a more visual navigation experience.

*   For [Text](../../Note%20Types/Text.md) note, the text can be slighly scrollable via the mouse wheel to reveal more context.
*   For [Code](../../Note%20Types/Code.md) notes, syntax highlighting is applied.
*   For [File](../../Note%20Types/File.md) notes, a preview is made available for audio, video and PDF notes.
*   If the note does not have a content, a list of its child notes will be displayed instead.

This is the default view type.

### List view

![](Note%20List_image.png)

In the list view mode, each note is displayed in a single row with only the title and the icon of the note being visible by the default. By pressing the expand button it's possible to view the content of the note, as well as the children of the note (recursively).

### Calendar view

![](2_Note%20List_image.png)

In the calendar view, child notes are represented as events, with a start date and optionally an end date. The view also has interaction support such as moving or creating new events. See [Calendar View](Note%20List/Calendar%20View.md) for more information.