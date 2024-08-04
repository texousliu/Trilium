# TriliumNext Notes

[English](https://github.com/TriliumNext/Notes/blob/master/README.md) | [Chinese](https://github.com/TriliumNext/Notes/blob/master/README-ZH_CN.md) | [Russian](https://github.com/TriliumNext/Notes/blob/master/README.ru.md) | [Japanese](https://github.com/TriliumNext/Notes/blob/master/README.ja.md) | [Italian](https://github.com/TriliumNext/Notes/blob/master/README.it.md)

TriliumNext Notes is a hierarchical note taking application with focus on building large personal knowledge bases.

See [screenshots](https://triliumnext.github.io/Docs/Wiki/screenshot-tour) for quick overview:

<a href="https://triliumnext.github.io/Docs/Wiki/screenshot-tour"><img src="https://github.com/TriliumNext/Docs/blob/main/Wiki/images/screenshot.png?raw=true" alt="Trilium Screenshot" width="1000"></a>

## ⚠️ Why TriliumNext?

[The original Trilium project is in maintenance mode](https://github.com/zadam/trilium/issues/4620)

## 💬 Discuss with us

Feel free to join our official discussions and community. We are focused on the development on Trilium, and would love to hear what features, suggestions, or issues you may have!

- [Matrix](https://matrix.to/#/#triliumnext:matrix.org) (For synchronous discussions)
- [Github Discussions](https://github.com/TriliumNext/Notes/discussions) (For Asynchronous discussions)
- [Wiki](https://triliumnext.github.io/Docs/) (For common how-to questions and user guides)

The two rooms linked above are mirrored, so you can use either XMPP or Matrix, from any client you prefer, on pretty much any platform under the sun!

### Unofficial Communities

[Trilium Rocks](https://discord.gg/aqdX9mXX4r)

## 🎁 Features

* Notes can be arranged into arbitrarily deep tree. Single note can be placed into multiple places in the tree (see [cloning](https://triliumnext.github.io/Docs/Wiki/cloning-notes)
* Rich WYSIWYG note editing including e.g. tables, images and [math](https://triliumnext.github.io/Docs/Wiki/text-notes) with markdown [autoformat](https://triliumnext.github.io/Docs/Wiki/text-notes#autoformat)
* Support for editing [notes with source code](https://triliumnext.github.io/Docs/Wiki/code-notes), including syntax highlighting
* Fast and easy [navigation between notes](https://triliumnext.github.io/Docs/Wiki/note-navigation), full text search and [note hoisting](https://triliumnext.github.io/Docs/Wiki/note-hoisting)
* Seamless [note versioning](https://triliumnext.github.io/Docs/Wiki/note-revisions)
* Note [attributes](https://triliumnext.github.io/Docs/Wiki/attributes) can be used for note organization, querying and advanced [scripting](https://triliumnext.github.io/Docs/Wiki/scripts)
* [Synchronization](https://triliumnext.github.io/Docs/Wiki/synchronization) with self-hosted sync server
  * there's a [3rd party service for hosting synchronisation server](https://trilium.cc/paid-hosting)
* [Sharing](https://triliumnext.github.io/Docs/Wiki/sharing) (publishing) notes to public internet
* Strong [note encryption](https://triliumnext.github.io/Docs/Wiki/protected-notes) with per-note granularity
* Sketching diagrams with built-in Excalidraw (note type "canvas")
* [Relation maps](https://triliumnext.github.io/Docs/Wiki/relation-map) and [link maps](https://triliumnext.github.io/Docs/Wiki/link-map) for visualizing notes and their relations
* [Scripting](https://triliumnext.github.io/Docs/Wiki/scripts) - see [Advanced showcases](https://triliumnext.github.io/Docs/Wiki/advanced-showcases)
* [REST API](https://triliumnext.github.io/Docs/Wiki/etapi) for automation
* Scales well in both usability and performance upwards of 100 000 notes
* Touch optimized [mobile frontend](https://triliumnext.github.io/Docs/Wiki/mobile-frontend) for smartphones and tablets
* [Night theme](https://triliumnext.github.io/Docs/Wiki/themes)
* [Evernote](https://triliumnext.github.io/Docs/Wiki/evernote-import) and [Markdown import & export](https://triliumnext.github.io/Docs/Wiki/markdown)
* [Web Clipper](https://triliumnext.github.io/Docs/Wiki/web-clipper) for easy saving of web content

✨ Check out the following third-party resources for more TriliumNext related goodies:

- [awesome-trilium](https://github.com/Nriver/awesome-trilium) for 3rd party themes, scripts, plugins and more.
- [TriliumRocks!](https://trilium.rocks/) for tutorials, guides, and much more.

## 🏗 Builds

Trilium is provided as either desktop application (Linux and Windows) or web application hosted on your server (Linux). Mac OS desktop build is available, but it is [unsupported](https://triliumnext.github.io/Docs/Wiki/faq#mac-os-support).

* If you want to use TriliumNext on the desktop, download binary release for your platform from [latest release](https://github.com/TriliumNext/Notes/releases/latest), unzip the package and run ```trilium``` executable.
* If you want to install TriliumNext on your own server, follow [this page](https://triliumnext.github.io/Docs/Wiki/server-installation).
  * Currently only recent versions of Chrome and Firefox are supported (tested) browsers.

TriliumNext will also provided as a Flatpak:

<img width="240" src="https://flathub.org/assets/badges/flathub-badge-en.png">

## 📝 Documentation

[See wiki for complete list of documentation pages.](https://triliumnext.github.io/Docs)

You can also read [Patterns of personal knowledge base](https://triliumnext.github.io/Docs/Wiki/patterns-of-personal-knowledge) to get some inspiration on how you might use Trilium.

## 💻 Contribute

Clone locally and run
```
npm install
npm run start-server
```

## 👏 Shoutouts

* [CKEditor 5](https://github.com/ckeditor/ckeditor5) - best WYSIWYG editor on the market, very interactive and listening team
* [FancyTree](https://github.com/mar10/fancytree) - very feature rich tree library without real competition. Trilium Notes would not be the same without it.
* [CodeMirror](https://github.com/codemirror/CodeMirror) - code editor with support for huge amount of languages
* [jsPlumb](https://github.com/jsplumb/jsplumb) - visual connectivity library without competition. Used in [relation maps](https://triliumnext.github.io/Docs/Wiki/Relation-map) and [link maps](https://triliumnext.github.io/Docs/Wiki/Link-map)

## 🤝 Support

You can support the original Trilium developer using GitHub Sponsors, [PayPal](https://paypal.me/za4am) or Bitcoin (bitcoin:bc1qv3svjn40v89mnkre5vyvs2xw6y8phaltl385d2).
Support for the TriliumNext organization will be possible in the near future.

## 🔑 License

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
