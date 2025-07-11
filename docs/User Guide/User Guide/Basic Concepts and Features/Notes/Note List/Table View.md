# Table View
<figure class="image"><img style="aspect-ratio:1050/259;" src="Table View_image.png" width="1050" height="259"></figure>

The table view displays information in a grid, where the rows are individual notes and the columns are <a class="reference-link" href="../../../Advanced%20Usage/Attributes/Promoted%20Attributes.md">Promoted Attributes</a>. In addition, values are editable.

## Interaction

### Creating a new table

Right click the <a class="reference-link" href="../../UI%20Elements/Note%20Tree.md">Note Tree</a> and select _Insert child note_ and look for the _Table item_.

### Adding columns

Each column is a [promoted attribute](../../../Advanced%20Usage/Attributes/Promoted%20Attributes.md) that is defined on the Collection note. Ideally, the promoted attributes need to be inheritable in order to show up in the child notes.

To create a new column, simply press _Add new column_ at the bottom of the table.

There are also a few predefined columns:

*   The current item number, identified by the `#` symbol. This simply counts the note and is affected by sorting.
*   <a class="reference-link" href="../../../Advanced%20Usage/Note%20ID.md">Note ID</a>, representing the unique ID used internally by Trilium
*   The title of the note.

### Adding new rows

Each row is actually a note that is a child of the Collection note.

To create a new note, press _Add new row_ at the bottom of the table. By default it will try to edit the title of the newly created note.

Alternatively, the note can be created from the<a class="reference-link" href="../../UI%20Elements/Note%20Tree.md">Note Tree</a> or [scripting](../../../Scripting.md).

### Editing data

Simply click on a cell within a row to change its value. The change will not only reflect in the table, but also as an attribute of the corresponding note.

*   The editing will respect the type of the promoted attribute, by presenting a normal text box, a number selector or a date selector for example.
*   It also possible to change the title of a note.
*   Editing relations is also possible, by using the note autocomplete.

## Working with the data

### Sorting

It is possible to sort the data by the values of a column:

*   To do so, simply click on a column.
*   To switch between ascending or descending sort, simply click again on the same column. The arrow next to the column will indicate the direction of the sort.

### Reordering and hiding columns

*   Columns can be reordered by dragging the header of the columns.
*   Columns can be hidden or shown by right clicking on a column and clicking the item corresponding to the column.

### Reordering rows

Notes can be dragged around to change their order. This will also change the order of the note in the <a class="reference-link" href="../../UI%20Elements/Note%20Tree.md">Note Tree</a>.

Currently, it's possible to reorder notes even if sorting is used, but the result might be inconsistent.

## Limitations

The table functionality is still in its early stages, as such it faces quite a few important limitations:

1.  As mentioned previously, the columns of the table are defined as <a class="reference-link" href="../../../Advanced%20Usage/Attributes/Promoted%20Attributes.md">Promoted Attributes</a>.
    1.  But only the promoted attributes that are defined at the level of the Collection note are actually taken into consideration.
    2.  There are plans to recursively look for columns across the sub-hierarchy.
2.  Hierarchy is not yet supported, so the table will only show the items that are direct children of the _Collection_ note.
3.  Multiple labels and relations are not supported. If a <a class="reference-link" href="../../../Advanced%20Usage/Attributes/Promoted%20Attributes.md">Promoted Attributes</a> is defined with a _Multi value_ specificity, they will be ignored.

## Use in search

The table view can be used in a <a class="reference-link" href="../../../Note%20Types/Saved%20Search.md">Saved Search</a> by adding the `#viewType=table` attribute.

Unlike when used in a Collection, saved searches are not limited to the sub-hierarchy of a note and allows for advanced queries thanks to the power of the <a class="reference-link" href="../../Navigation/Search.md">Search</a>.

However, there are also some limitations:

*   It's not possible to reorder notes.
*   It's not possible to add a new row.

Columns are supported, by being defined as <a class="reference-link" href="../../../Advanced%20Usage/Attributes/Promoted%20Attributes.md">Promoted Attributes</a> to the <a class="reference-link" href="../../../Note%20Types/Saved%20Search.md">Saved Search</a> note.

Editing is also supported.