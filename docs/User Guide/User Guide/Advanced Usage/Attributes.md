# Attributes
In Trilium, attributes are key-value pairs assigned to notes, providing additional metadata or functionality. There are two primary types of attributes:

1.  **Labels**: Simple key-value text records
2.  **Relations**: Named links to other notes

These attributes play a crucial role in organizing, categorising, and enhancing the functionality of notes.

![](Attributes_image.png)

## Labels

Labels in Trilium can be used for a variety of purposes:

*   **Metadata**: Assign labels with optional values for categorization, such as `#year=1999`, `#genre="sci-fi"`, or `#author="Neal Stephenson"`
*   **Configuration**: Labels can configure advanced features or settings
*   **Scripts and Plugins**: Used to tag notes with special metadata, such as the "weight" attribute in the <a class="reference-link" href="Advanced%20Showcases/Weight%20Tracker.md">Weight Tracker</a>.

Labels are also searchable, enhancing note retrieval.

### Common Labels for Advanced Configuration

## Relations

Relations define connections between notes, similar to links.

### Uses

*   **Metadata Relationships**: For example, linking a book note to an author note
*   **Scripting**: Attaching scripts to events or conditions related to the note

### Common Relations

*   **Event-based Relations**: Such as `runOnNoteCreation` or `runOnNoteChange`, which trigger scripts on specific actions
*   **Other Relations**: Include `template`, `renderNote`, `widget`, and sharing-related relations

## Multiplicity

Attributes in Trilium can be "multivalued", meaning multiple attributes with the same name can coexist.

## Attribute Definitions and Promoted Attributes

Special labels create "label/attribute" definitions, enhancing the organization and management of attributes. For more details, see <a class="reference-link" href="Attributes/Promoted%20Attributes.md">Promoted Attributes</a>.

## Attribute Inheritance

Trilium supports attribute inheritance, allowing child notes to inherit attributes from their parents. For more information, see <a class="reference-link" href="Attributes/Attribute%20Inheritance.md">Attribute Inheritance</a>.