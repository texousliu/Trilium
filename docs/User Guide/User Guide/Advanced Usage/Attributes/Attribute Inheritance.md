# Attribute Inheritance
Inheritance refers to the process of having a [label](Labels.md) or a [relation](Relations.md) shared across multiple notes, generally in parent-child relations (or anywhere if using templates).

## Standard Inheritance

In Trilium, attributes can be automatically inherited by child notes if they have the `isInheritable` flag set to `true`. This means the attribute (a key-value pair) is applied to the note and all its descendants.

To make an attribute inheritable, simply use the visual editor for <a class="reference-link" href="Labels.md">Labels</a> or <a class="reference-link" href="Relations.md">Relations</a>. Alternatively, the attribute can be manually defined where `#myLabel=value` becomes `#myLabel(inheritable)=value` when inheritable.

As an example, the `archived` label can be set to be inheritable, allowing you to hide a whole subtree of notes from searches and other dialogs by applying this label at the top level.

## Copying Inheritance

Copying inheritance differs from standard inheritance by using a `child:` prefix in the attribute name. This prefix causes new child notes to automatically receive specific attributes from the parent note. These attributes are independent of the parent and will persist even if the note is moved elsewhere.

### How to Use

*   **Syntax:** `#child:attributeName`
*   **Chained Inheritance:** You can chain this inheritance, such as `#child:child:attributeName`, where each child down the hierarchy receives the appropriate attribute.

### Example

If a parent note has the label `#child:exampleAttribute`, all newly created child notes will inherit the `#exampleAttribute` label. This can be useful for setting default properties for notes in a specific section.

## Template Inheritance

Attributes can also be inherited from [templates](../Templates.md). When a new note is created using a template, it inherits the attributes defined in that template. This is particularly useful for maintaining consistency across notes that follow a similar structure or function.