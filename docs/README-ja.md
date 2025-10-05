# Trilium Notes

![GitHub Sponsors](https://img.shields.io/github/sponsors/eliandoran)
![LiberaPay patrons](https://img.shields.io/liberapay/patrons/ElianDoran)\
![Docker Pulls](https://img.shields.io/docker/pulls/triliumnext/trilium)
![GitHub ダウンロード
(全アセット、全リリース)](https://img.shields.io/github/downloads/triliumnext/trilium/total)\
[![RelativeCI](https://badges.relative-ci.com/badges/Di5q7dz9daNDZ9UXi0Bp?branch=develop)](https://app.relative-ci.com/projects/Di5q7dz9daNDZ9UXi0Bp)
[![翻訳状況](https://hosted.weblate.org/widget/trilium/svg-badge.svg)](https://hosted.weblate.org/engage/trilium/)

[英語](./README.md) | [中国語（簡体）](./docs/README-ZH_CN.md) |
[中国語（繁体）](./docs/README-ZH_TW.md) | [ロシア語](./docs/README-ru.md) |
[日本語](./docs/README-ja.md) | [イタリア語](./docs/README-it.md) |
[スペイン語](./docs/README-es.md)

Trilium Notes
は、大規模な個人知識ベースの構築に重点を置いた、無料かつオープンソースのクロスプラットフォームの階層型ノート作成アプリケーションです。

概要については [スクリーンショット](https://triliumnext.github.io/Docs/Wiki/screenshot-tour)
を参照してください:

<a href="https://triliumnext.github.io/Docs/Wiki/screenshot-tour"><img src="./docs/app.png" alt="Trilium Screenshot" width="1000"></a>

## 📚 ドキュメント

**包括的なドキュメントは [docs.triliumnotes.org](https://docs.triliumnotes.org/) でご覧ください**

当社のドキュメントは複数の形式でご利用いただけます:
- **オンラインドキュメント**: [docs.triliumnotes.org](https://docs.triliumnotes.org/)
  で完全なドキュメントを参照してください
- **アプリ内ヘルプ**: Trilium内で `F1` キーを押すと、アプリケーション内で同じドキュメントに直接アクセスできます
- **GitHub**: このリポジトリの [ユーザーガイド](./docs/User%20Guide/User%20Guide/) を参照してください

### クイックリンク
- [スタートガイド](https://docs.triliumnotes.org/)
- [インストール手順](./docs/User%20Guide/User%20Guide/Installation%20&%20Setup/Server%20Installation.md)
- [Docker
  のセットアップ](./docs/User%20Guide/User%20Guide/Installation%20&%20Setup/Server%20Installation/1.%20Installing%20the%20server/Using%20Docker.md)
- [TriliumNext
  のアップグレード](./docs/User%20Guide/User%20Guide/Installation%20%26%20Setup/Upgrading%20TriliumNext.md)
- [基本概念と機能](./docs/User%20Guide/User%20Guide/Basic%20Concepts%20and%20Features/Notes.md)
- [個人ナレッジベースのパターン](https://triliumnext.github.io/Docs/Wiki/patterns-of-personal-knowledge)

## 🎁 機能

* ノートは任意の深さのツリーに配置できます。1つのノートをツリー内の複数の場所に配置できます（[クローン](https://triliumnext.github.io/Docs/Wiki/cloning-notes)を参照）
* 豊富な WYSIWYG ノートエディター 例:
  表、画像、[数式](https://triliumnext.github.io/Docs/Wiki/text-notes) とマークダウン
  [自動フォーマット](https://triliumnext.github.io/Docs/Wiki/text-notes#autoformat) など
* 構文の強調表示を含む [ソースコード付きノート](https://triliumnext.github.io/Docs/Wiki/code-notes)
  の編集をサポート
* [ノート間のナビゲーション](https://triliumnext.github.io/Docs/Wiki/note-navigation)、全文検索、[ノートのホイスト](https://triliumnext.github.io/Docs/Wiki/note-hoisting)
  が高速かつ簡単に行えます
* シームレスな [ノートのバージョン管理](https://triliumnext.github.io/Docs/Wiki/note-revisions)
* ノート[属性](https://triliumnext.github.io/Docs/Wiki/attributes) は、ノートの整理、クエリ、高度な
  [スクリプト](https://triliumnext.github.io/Docs/Wiki/scripts) に使用できます
* UI は英語、ドイツ語、スペイン語、フランス語、ルーマニア語、中国語（簡体字および繁体字）でご利用いただけます
* より安全なログインのための直接的な
  [OpenIDとTOTPの統合](./docs/User%20Guide/User%20Guide/Installation%20%26%20Setup/Server%20Installation/Multi-Factor%20Authentication.md)
* セルフホスト同期サーバーとの [同期](https://triliumnext.github.io/Docs/Wiki/synchronization)
  * [同期サーバーをホストするためのサードパーティサービス](https://trilium.cc/paid-hosting) があります
* インターネット上でノートの [共有](https://triliumnext.github.io/Docs/Wiki/sharing)（公開）
* ノートごとに調整可能で強力な
  [ノート暗号化](https://triliumnext.github.io/Docs/Wiki/protected-notes)
* [Excalidraw](https://excalidraw.com/) をベースにした図のスケッチ（ノートタイプ「キャンバス」）
* ノートとそのリレーションを視覚化するための
  [リレーションマップ](https://triliumnext.github.io/Docs/Wiki/relation-map) と
  [リンクマップ](https://triliumnext.github.io/Docs/Wiki/link-map)
* [Mind Elixir](https://docs.mind-elixir.com/) をベースとしたマインドマップ
* 位置ピンと GPX トラック付きの
  [ジオマップ](./docs/User%20Guide/User%20Guide/Note%20Types/Geo%20Map.md)
* [スクリプト](https://triliumnext.github.io/Docs/Wiki/scripts) -
  [高度なショーケース](https://triliumnext.github.io/Docs/Wiki/advanced-showcases) を参照
* 自動化のための [REST API](https://triliumnext.github.io/Docs/Wiki/etapi)
* 10万件以上のノートでも、使いやすさとパフォーマンスの両面に優れた拡張性を実現
* スマートフォンとタブレット向けにタッチ操作に最適化された
  [モバイルフロントエンド](https://triliumnext.github.io/Docs/Wiki/mobile-frontend)
* 組み込みの [ダークテーマ](https://triliumnext.github.io/Docs/Wiki/themes)、ユーザーテーマのサポート
* [Evernote](https://triliumnext.github.io/Docs/Wiki/evernote-import) と
  [Markdown のインポートとエクスポート](https://triliumnext.github.io/Docs/Wiki/markdown)
* [Web Clipper](https://triliumnext.github.io/Docs/Wiki/web-clipper)
  でWebコンテンツを簡単に保存
* カスタマイズ可能な UI (サイドバー ボタン、ユーザー定義のウィジェットなど)
* [メトリクス(Metrics)](./docs/User%20Guide/User%20Guide/Advanced%20Usage/Metrics.md)
  と [Grafana
  ダッシュボード](./docs/User%20Guide/User%20Guide/Advanced%20Usage/Metrics/grafana-dashboard.json)

✨ TriliumNext 関連のその他の情報については、次のサードパーティのリソース/コミュニティをご覧ください:

- [awesome-trilium](https://github.com/Nriver/awesome-trilium)
  サードパーティのテーマ、スクリプト、プラグインなど。
- [TriliumRocks!](https://trilium.rocks/) ではチュートリアルやガイドなど、その他多数。

## ❓なぜTriliumNext なのか？

オリジナルの Trilium 開発者 ([Zadam](https://github.com/zadam))
は、https://github.com/TriliumNext にあるコミュニティプロジェクトに Trilium リポジトリを快く提供してくれました

### ⬆️Zadam/Trilium から移行しますか?

zadam/Trilium インスタンスから TriliumNext/Trilium インスタンスへの移行には特別な手順はありません。通常通り
[TriliumNext/Triliumをインストール](#-installation) するだけで、既存のデータベースが使用されます。

[v0.90.4](https://github.com/TriliumNext/Trilium/releases/tag/v0.90.4)
までのバージョンは、最新の zadam/trilium バージョン
[v0.63.7](https://github.com/zadam/trilium/releases/tag/v0.63.7)
と互換性があります。それ以降のバージョンの TriliumNext/Trilium では同期バージョンがインクリメントされるため、直接移行することはできません。

## 💬 私たちと議論しましょう

ぜひ公式の会話にご参加ください。機能に関するご意見、ご提案、問題など、ぜひお聞かせください！

- [Matrix](https://matrix.to/#/#triliumnext:matrix.org) （同期ディスカッション用）
  - `General`マトリックスルームも [XMPP](xmpp:discuss@trilium.thisgreat.party?join)
    にブリッジされています
- [Github Discussions](https://github.com/TriliumNext/Trilium/discussions)
  (非同期ディスカッション用)
- [Github Issues](https://github.com/TriliumNext/Trilium/issues)
  (バグレポートや機能リクエスト用)

## 🏗 インストール

### Windows / MacOS

[最新リリース ページ](https://github.com/TriliumNext/Trilium/releases/latest)
からプラットフォーム用のバイナリ リリースをダウンロードし、パッケージを解凍して `trilium` 実行可能ファイルを実行します。

### Linux

ディストリビューションが以下の表に記載されている場合は、ディストリビューションのパッケージを使用してください。

[![Packaging
status](https://repology.org/badge/vertical-allrepos/triliumnext.svg)](https://repology.org/project/triliumnext/versions)

[最新リリース ページ](https://github.com/TriliumNext/Trilium/releases/latest)
からプラットフォーム用のバイナリ リリースをダウンロードし、パッケージを解凍して `trilium` 実行可能ファイルを実行することもできます。

TriliumNext は Flatpak としても提供されていますが、FlatHub ではまだ公開されていません。

### ブラウザ（どのOSでも）

サーバーインストール (下記参照) を使用する場合は、Web インターフェイス (デスクトップアプリとほぼ同じ) に直接アクセスできます。

現在、Chrome と Firefox の最新バージョンのみがサポート (およびテスト) されています。

### Mobile

To use TriliumNext on a mobile device, you can use a mobile web browser to
access the mobile interface of a server installation (see below).

See issue https://github.com/TriliumNext/Trilium/issues/4962 for more
information on mobile app support.

If you prefer a native Android app, you can use
[TriliumDroid](https://apt.izzysoft.de/fdroid/index/apk/eu.fliegendewurst.triliumdroid).
Report bugs and missing features at [their
repository](https://github.com/FliegendeWurst/TriliumDroid). Note: It is best to
disable automatic updates on your server installation (see below) when using
TriliumDroid since the sync version must match between Trilium and TriliumDroid.

### Server

To install TriliumNext on your own server (including via Docker from
[Dockerhub](https://hub.docker.com/r/triliumnext/trilium)) follow [the server
installation docs](https://triliumnext.github.io/Docs/Wiki/server-installation).


## 💻 Contribute

### Translations

If you are a native speaker, help us translate Trilium by heading over to our
[Weblate page](https://hosted.weblate.org/engage/trilium/).

Here's the language coverage we have so far:

[![Translation
status](https://hosted.weblate.org/widget/trilium/multi-auto.svg)](https://hosted.weblate.org/engage/trilium/)

### Code

Download the repository, install dependencies using `pnpm` and then run the
server (available at http://localhost:8080):
```shell
git clone https://github.com/TriliumNext/Trilium.git
cd Trilium
pnpm install
pnpm run server:start
```

### Documentation

Download the repository, install dependencies using `pnpm` and then run the
environment required to edit the documentation:
```shell
git clone https://github.com/TriliumNext/Trilium.git
cd Trilium
pnpm install
pnpm edit-docs:edit-docs
```

### Building the Executable
Download the repository, install dependencies using `pnpm` and then build the
desktop app for Windows:
```shell
git clone https://github.com/TriliumNext/Trilium.git
cd Trilium
pnpm install
pnpm run --filter desktop electron-forge:make --arch=x64 --platform=win32
```

For more details, see the [development
docs](https://github.com/TriliumNext/Trilium/tree/main/docs/Developer%20Guide/Developer%20Guide).

### Developer Documentation

Please view the [documentation
guide](https://github.com/TriliumNext/Trilium/blob/main/docs/Developer%20Guide/Developer%20Guide/Environment%20Setup.md)
for details. If you have more questions, feel free to reach out via the links
described in the "Discuss with us" section above.

## 👏 Shoutouts

* [zadam](https://github.com/zadam) for the original concept and implementation
  of the application.
* [Larsa](https://github.com/LarsaSara) for designing the application icon.
* [nriver](https://github.com/nriver) for his work on internationalization.
* [Thomas Frei](https://github.com/thfrei) for his original work on the Canvas.
* [antoniotejada](https://github.com/nriver) for the original syntax highlight
  widget.
* [Dosu](https://dosu.dev/) for providing us with the automated responses to
  GitHub issues and discussions.
* [Tabler Icons](https://tabler.io/icons) for the system tray icons.

Trilium would not be possible without the technologies behind it:

* [CKEditor 5](https://github.com/ckeditor/ckeditor5) - the visual editor behind
  text notes. We are grateful for being offered a set of the premium features.
* [CodeMirror](https://github.com/codemirror/CodeMirror) - code editor with
  support for huge amount of languages.
* [Excalidraw](https://github.com/excalidraw/excalidraw) - the infinite
  whiteboard used in Canvas notes.
* [Mind Elixir](https://github.com/SSShooter/mind-elixir-core) - providing the
  mind map functionality.
* [Leaflet](https://github.com/Leaflet/Leaflet) - for rendering geographical
  maps.
* [Tabulator](https://github.com/olifolkerd/tabulator) - for the interactive
  table used in collections.
* [FancyTree](https://github.com/mar10/fancytree) - feature-rich tree library
  without real competition.
* [jsPlumb](https://github.com/jsplumb/jsplumb) - visual connectivity library.
  Used in [relation
  maps](https://triliumnext.github.io/Docs/Wiki/relation-map.html) and [link
  maps](https://triliumnext.github.io/Docs/Wiki/note-map.html#link-map)

## 🤝 Support

Trilium is built and maintained with [hundreds of hours of
work](https://github.com/TriliumNext/Trilium/graphs/commit-activity). Your
support keeps it open-source, improves features, and covers costs such as
hosting.

Consider supporting the main developer
([eliandoran](https://github.com/eliandoran)) of the application via:

- [GitHub Sponsors](https://github.com/sponsors/eliandoran)
- [PayPal](https://paypal.me/eliandoran)
- [Buy Me a Coffee](https://buymeacoffee.com/eliandoran)

## 🔑 License

Copyright 2017-2025 zadam, Elian Doran, and other contributors

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License as published by the Free
Software Foundation, either version 3 of the License, or (at your option) any
later version.
