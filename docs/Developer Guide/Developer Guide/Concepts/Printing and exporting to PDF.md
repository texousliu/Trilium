# Printing and exporting to PDF
Note printing is handled by `note_detail.js`, in the `printActiveNoteEvent` method. Exporting to PDF works similarly.

## How it works

Both printing and exporting as PDF use the same mechanism: a note is rendered individually in a separate webpage that is then sent to the browser or the Electron application either for printing or exporting as PDF.

The webpage that renders a single note can actually be accessed in a web browser. For example `http://localhost:8080/#root/WWRGzqHUfRln/RRZsE9Al8AIZ?ntxId=0o4fzk` becomes `http://localhost:8080/?print#root/WWRGzqHUfRln/RRZsE9Al8AIZ`.

Accessing the print note in a web browser allows for easy debugging to understand why a particular note doesn't render well. The mechanism for rendering is similar to the one used in <a class="reference-link" href="#root/0ESUbbAxVnoK">Note List</a>.

## Syntax highlighting

Syntax highlighting for code blocks is supported as well:

*   It works by injecting a Highlight.js stylesheet into the print.
*   The theme used is hard-coded (the _Visual Studio Light theme_, at the time of writing) in order not to have a dark background in print.
*   <a class="reference-link" href="Syntax%20highlighting.md">Syntax highlighting</a> is handled by the content renderer.

## Customizing the print CSS

As an advanced use case, it's possible to customize the CSS used for printing such as adjusting the fonts, sizes or margins. Note that <a class="reference-link" href="#root/pOsGYCXsbNQG/pKK96zzmvBGf/AlhDUqhENtH7">Custom app-wide CSS</a> will not work for printing.

To do so:

*   Create a CSS [code note](#root/pOsGYCXsbNQG/KSZ04uQ2D1St/6f9hih2hXXZk).
*   On the note being printed, apply the `~printCss` relation to point to the newly created CSS code note.
*   To apply the CSS to multiple notes, consider using [inheritable attributes](#root/pOsGYCXsbNQG/tC7s2alapj8V/zEY4DaJG4YT5/bwZpz2ajCEwO) or <a class="reference-link" href="#root/pOsGYCXsbNQG/tC7s2alapj8V/KC1HB96bqqHX">Templates</a>.

For example, to change the font of the document from the one defined by the theme or the user to a serif one:

```
body {
	--main-font-family: serif !important;
    --detail-font-family: var(--main-font-family) !important;
}
```

To remark:

*   Multiple CSS notes can be add by using multiple `~printCss` relations.
*   If migrating from a previous version where <a class="reference-link" href="#root/pOsGYCXsbNQG/pKK96zzmvBGf/AlhDUqhENtH7">Custom app-wide CSS</a>, there's no need for `@media print {`  since the style-sheet is used only for printing.