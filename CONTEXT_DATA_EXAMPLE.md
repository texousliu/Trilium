# Context Data Pattern - Usage Examples

This document shows how to use the new context data pattern to communicate between type widgets (inside splits) and shared components (sidebars, toolbars).

## Architecture

Data is stored directly on the `NoteContext` object:
- **Type widgets** (PDF, Text, Code) publish data using `useSetContextData()`
- **Sidebar/toolbar components** read data using `useGetContextData()`
- Data is automatically cleared when switching notes
- Components automatically re-render when data changes

## Example 1: PDF Page Navigation

### Publishing from PDF Viewer (inside split)

```tsx
// In Pdf.tsx
import { useSetContextData } from "../../react/hooks";

interface PdfPageInfo {
    pageNumber: number;
    title: string;
}

export default function PdfPreview({ note, blob }) {
    const { noteContext } = useActiveNoteContext();
    const [pages, setPages] = useState<PdfPageInfo[]>([]);

    useEffect(() => {
        // When PDF loads, extract page information
        const pageInfo = extractPagesFromPdf();
        setPages(pageInfo);
    }, [blob]);

    // Publish pages to context data
    useSetContextData(noteContext, "pdfPages", pages);

    return <iframe className="pdf-preview" ... />;
}
```

### Consuming in Sidebar (outside split)

```tsx
// In PdfPageNavigation.tsx (sidebar widget)
import { useGetContextData } from "../../react/hooks";

export default function PdfPageNavigation() {
    const pages = useGetContextData<PdfPageInfo[]>("pdfPages");

    if (!pages || pages.length === 0) {
        return null; // Don't show if no PDF is active
    }

    return (
        <RightPanelWidget id="pdf-nav" title="PDF Pages">
            <ul>
                {pages.map(page => (
                    <li key={page.pageNumber}>
                        Page {page.pageNumber}: {page.title}
                    </li>
                ))}
            </ul>
        </RightPanelWidget>
    );
}
```

## Example 2: Table of Contents

### Publishing from Text Editor

```tsx
// In TextTypeWidget.tsx
import { useSetContextData } from "../../react/hooks";

interface Heading {
    id: string;
    level: number;
    text: string;
}

function TextTypeWidget() {
    const { noteContext } = useActiveNoteContext();
    const [headings, setHeadings] = useState<Heading[]>([]);

    const extractHeadings = useCallback((editor: CKTextEditor) => {
        const extractedHeadings = [];
        // Extract headings from editor...
        setHeadings(extractedHeadings);
    }, []);

    // Publish headings to context
    useSetContextData(noteContext, "toc", headings);

    return <div className="text-editor">...</div>;
}
```

### Consuming in Sidebar

```tsx
// In TableOfContents.tsx
import { useGetContextData } from "../../react/hooks";

export default function TableOfContents() {
    const headings = useGetContextData<Heading[]>("toc");

    if (!headings || headings.length === 0) {
        return <div className="no-headings">No headings available</div>;
    }

    return (
        <RightPanelWidget id="toc" title="Table of Contents">
            <ul>
                {headings.map(h => (
                    <li key={h.id} style={{ marginLeft: `${(h.level - 1) * 20}px` }}>
                        {h.text}
                    </li>
                ))}
            </ul>
        </RightPanelWidget>
    );
}
```

## Example 3: Code Outline

### Publishing from Code Editor

```tsx
// In CodeTypeWidget.tsx
interface CodeSymbol {
    name: string;
    kind: 'function' | 'class' | 'variable';
    line: number;
}

function CodeTypeWidget() {
    const { noteContext } = useActiveNoteContext();
    const [symbols, setSymbols] = useState<CodeSymbol[]>([]);

    // When code changes, extract symbols
    const onCodeChange = useCallback((editor: CodeMirror) => {
        const extractedSymbols = parseSymbols(editor.getValue());
        setSymbols(extractedSymbols);
    }, []);

    useSetContextData(noteContext, "codeOutline", symbols);

    return <div className="code-editor">...</div>;
}
```

### Consuming in Sidebar

```tsx
// In CodeOutline.tsx
function CodeOutline() {
    const symbols = useGetContextData<CodeSymbol[]>("codeOutline");

    if (!symbols) return null;

    return (
        <RightPanelWidget id="code-outline" title="Outline">
            {symbols.map((symbol, i) => (
                <div key={i} className={`symbol-${symbol.kind}`}>
                    {symbol.name} (Line {symbol.line})
                </div>
            ))}
        </RightPanelWidget>
    );
}
```

## Benefits

1. **Simple & Direct**: Data lives where it belongs (on the note context)
2. **Automatic Cleanup**: Data cleared when switching notes
3. **Reactive**: Components automatically re-render when data changes
4. **Type-Safe**: Full TypeScript support with generics
5. **No Global State**: Each context has its own data
6. **Works with Splits**: Each split can have different data

## Data Keys Convention

Use descriptive, namespaced keys:
- `"toc"` - Table of contents headings
- `"pdfPages"` - PDF page information
- `"codeOutline"` - Code symbols/outline
- `"searchResults"` - Search results within note
- `"imageGallery"` - Image list for gallery view
- `"noteStats"` - Statistics about the note
