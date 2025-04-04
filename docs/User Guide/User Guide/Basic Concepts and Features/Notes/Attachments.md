# Attachments
A [note](../Notes.md) in Trilium can _own_ one or more attachments, which can be either images or files. These attachments can be displayed or linked within the note that owns them.

This can be especially useful to include dependencies for your [scripts](../../Note%20Types/Code/Scripts.md). The <a class="reference-link" href="../../Advanced%20Usage/Advanced%20Showcases/Weight%20Tracker.md">Weight Tracker</a> shows how to use [chartjs](https://chartjs.org/) which is attached to the [script note](#root/HcUYTojFohtb).

Each note exclusively owns its attachments, meaning attachments cannot be shared or linked from one note to another. If an attachment link is copied to a different note, the attachment itself is duplicated, and the copies are managed independently thereafter.

Attachments, especially image files, are the recommended method for embedding visuals in notes. It is important to link image attachments within the text of the owning note; otherwise, they will be automatically deleted after a configurable timeout period if not referenced.

## Attachment previews

Attachments share the same content preview for images, videos, PDFs, etc. as the <a class="reference-link" href="../../Note%20Types/File.md">File</a> note type.