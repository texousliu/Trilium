export function initSyntaxHighlighting(editor) {
    console.log("Init syntax highlight");
    initTextEditor(editor);
}

const tag = "SyntaxHighlightWidget";
const debugLevels = ["error", "warn", "info", "log", "debug"];
const debugLevel = "debug";

let warn = function() {};
if (debugLevel >= debugLevels.indexOf("warn")) {
    warn = console.warn.bind(console, tag + ": ");
}

let info = function() {};
if (debugLevel >= debugLevels.indexOf("info")) {
    info = console.info.bind(console, tag + ": ");
}

let log = function() {};
if (debugLevel >= debugLevels.indexOf("log")) {
    log = console.log.bind(console, tag + ": ");
}

let dbg = function() {};
if (debugLevel >= debugLevels.indexOf("debug")) {
    dbg = console.debug.bind(console, tag + ": ");
}

function assert(e, msg) {
    console.assert(e, tag + ": " + msg);
}

function initTextEditor(textEditor) {
    log("initTextEditor");

    let widget = this;
    const document = textEditor.model.document;

    // Create a conversion from model to view that converts 
    // hljs:hljsClassName:uniqueId into a span with hljsClassName
    // See the list of hljs class names at
    // https://github.com/highlightjs/highlight.js/blob/6b8c831f00c4e87ecd2189ebbd0bb3bbdde66c02/docs/css-classes-reference.rst

    textEditor.conversion.for('editingDowncast').markerToHighlight( {
        model: "hljs",
        view: ( { markerName } ) => {
            dbg("markerName " + markerName);
            // markerName has the pattern addMarker:cssClassName:uniqueId
            const [ , cssClassName, id ] = markerName.split( ':' );

            // The original code at 
            // https://github.com/ckeditor/ckeditor5/blob/master/packages/ckeditor5-find-and-replace/src/findandreplaceediting.js
            // has this comment
            //      Marker removal from the view has a bug: 
            //      https://github.com/ckeditor/ckeditor5/issues/7499
            //      A minimal option is to return a new object for each converted marker...
            return {
                name: 'span',
                classes: [ cssClassName ],
                attributes: {
                    // ...however, adding a unique attribute should be future-proof..
                    'data-syntax-result': id
                },
            };
        }
    });
    

    // XXX This is done at BalloonEditor.create time, so it assumes this
    //     document is always attached to this textEditor, empirically that
    //     seems to be the case even with two splits showing the same note,
    //     it's not clear if CKEditor5 has apis to attach and detach
    //     documents around
    document.registerPostFixer(function(writer) {
        log("postFixer");
        // Postfixers are a simpler way of tracking changes than onchange
        // See
        // https://github.com/ckeditor/ckeditor5/blob/b53d2a4b49679b072f4ae781ac094e7e831cfb14/packages/ckeditor5-block-quote/src/blockquoteediting.js#L54
        const changes = document.differ.getChanges();
        let dirtyCodeBlocks = new Set();

        for (const change of changes) {
            dbg("change " + JSON.stringify(change));

            if ((change.type == "insert") && (change.name == "codeBlock")) {
                // A new code block was inserted
                const codeBlock = change.position.nodeAfter;
                // Even if it's a new codeblock, it needs dirtying in case
                // it already has children, like when pasting one or more
                // full codeblocks, undoing a delete, changing the language,
                // etc (the postfixer won't get later changes for those).
                log("dirtying inserted codeBlock " + JSON.stringify(codeBlock.toJSON()));
                dirtyCodeBlocks.add(codeBlock);
                
            } else if (change.type == "remove" && (change.name == "codeBlock")) {
                // An existing codeblock was removed, do nothing. Note the
                // node is no longer in the editor so the codeblock cannot
                // be inspected here. No need to dirty the codeblock since
                // it has been removed
                log("removing codeBlock at path " + JSON.stringify(change.position.toJSON()));
                
            } else if (((change.type == "remove") || (change.type == "insert")) && 
                        change.position.parent.is('element', 'codeBlock')) {
                // Text was added or removed from the codeblock, force a
                // highlight
                const codeBlock = change.position.parent;
                log("dirtying codeBlock " + JSON.stringify(codeBlock.toJSON()));
                dirtyCodeBlocks.add(codeBlock);
            }
        }
        for (let codeBlock of dirtyCodeBlocks) {
            highlightCodeBlock(codeBlock, writer);
        }
        // Adding markers doesn't modify the document data so no need for
        // postfixers to run again
        return false;
    });

    // This assumes the document is empty and a explicit call to highlight
    // is not necessary here. Empty documents have a single children of type
    // paragraph with no text
    assert((document.getRoot().childCount == 1) && 
        (document.getRoot().getChild(0).name == "paragraph") &&
         document.getRoot().getChild(0).isEmpty);
    
}

function highlightCodeBlock(codeBlock, writer) {
    console.log("Highlight code block.");
}