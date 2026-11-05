---
title: "RichEditor"
description: "nsh/base のリッチテキストエディタ。アプリのスキーマで定義されるドキュメント、コマンド、プラグイン、履歴、キーマップ、入力ルール、Markdown を備え、ProseMirror のアーキテクチャを踏襲し、状態は Rust で管理されます。"
group: base
demo: el-rich-editor
source_hash: 7ce7527a59594417
---


# RichEditor

`RichEditor` は、ProseMirror のアーキテクチャに基づいて作られたリッチテキストエディターです。アプリは、スキーマ(段落、見出し、リスト、メンションなど、必要なノードタイプとマークタイプ)でドキュメントの構成要素を定義し、エディターはすべてのドキュメントをそのスキーマに対して有効な状態に保ちます。変更はトランザクションにまとめられたステップとして表されるため、元に戻したり、位置をマッピングしたり、JSON として受け渡したりできます。動作はプラグイン(履歴、キーマップ、入力ルール、Markdown ショートカット、アプリ独自のもの)によって与えられ、コマンドはツールバーが実行したり実行可否を問い合わせたりする値です。エディターの状態、コマンド、プラグインは Rust で動作します。入力、キーバインド、入力ルールが JS を待つことはなく、アプリは必要なときに状態を JSON として読み取ります。

エディターは 2 つの部分からなります。状態を保持しアプリのコードが操作するセッション(`createRichEditor`)と、セッションをネイティブに描画し、プラットフォームの入力をトランザクションに変換するビュー(`<RichEditor editor={…} />`)です。1 つのセッションを複数のビューで表示できます。

エディターのカーネルは Marijn Haverbeke による [ProseMirror](https://prosemirror.net) の Rust ポートであり、拡張レイヤーは [Tiptap](https://tiptap.dev) に倣っています。データ構造、コマンド、名前が引き継がれているため、両者についての知識もそのまま使えます。どちらも MIT ライセンスで、移植された部分にはそれぞれのライセンスが適用されます。

```tsx
import { mount } from "nsh";
import { RichEditor, createRichEditor, history, inputRules, keymap, markdown, markdownRules, starterKeymap, baseKeymap, toggleMark } from "nsh/base";

const editor = createRichEditor({
  content: "# Notes\n\nStart typing…",
  format: "markdown",
  plugins: [
    history(),
    keymap({ "Mod-b": toggleMark("bold"), "Mod-i": toggleMark("italic") }),
    starterKeymap(),
    baseKeymap(),
    inputRules(markdownRules()),
    markdown(),
  ],
});

function App() {
  return <RichEditor editor={editor} class="flex-1" />;
}

mount(App);
```

`schema` がない場合、エディターはスタータースキーマ(`starterSchema()`)を使用します。`plugins` がない場合は、スターターキット(`starterKit()`:スターターの入力ルールとキーバインド、基本キーバインド、履歴)が使われます。空の `plugins` 配列を渡すと、プラグインがまったくないエディターになります。

<a id="styling"></a>

## スタイル

エディターは、アプリの見た目でドキュメントを描画します。`classes` と `styles` で各パーツ(`root`、`content`、`caret`、`selection`、`placeholder`、`composition`、`selectedNode`、`listMarker`、テーブルの場合は `selectedCell`、`tableGrip`、`tableResizeHandle`、`tableDropIndicator`)のスタイルを指定でき、ノードは型ごとに(`nodes: { heading:
"text-2xl font-bold", "heading[level=2]": "text-xl" }`) and its marks (`marks: { bold: "font-bold" }`)指定できます。ノード仕様で `extra.listMarker` を `"bullet"` または `"ordered"` に設定したリスト(スタータースキーマのリスト)の項目は、`listMarker` パートにマーカーを表示します。マーカーは深さに応じた `•`、`◦`、`▪`、またはリストの `start` から始まる番号で、項目の前、リストのインデント(ブラウザーが `ul` をインデントするのと同様の、リストの `pl-6`)の位置に置かれます。

```tsx
<RichEditor
  editor={editor}
  classes={{
    nodes: { heading: "text-2xl font-bold", bulletList: "pl-6", codeBlock: "font-mono bg-muted p-3 rounded-md" },
    marks: { bold: "font-bold", italic: "italic", code: "font-mono bg-muted" },
    listMarker: "text-muted-foreground",
  }}
/>
```

`content` パートは、エディターのスクロールビュー内にあるドキュメントのボックスです。そのパディング(`content: "px-6 py-5"`)がテキスト周囲の余白になり、スクロールバーはエディター自身の端に沿って表示されます。エディターの上端または下端を越えて選択するようにドラッグすると、ドキュメントも一緒にスクロールし、ポインターが離れるほど速くなります。

<a id="bubble-menu"></a>

### バブルメニュー

`bubbleMenu` は Tiptap のバブルメニューで、アプリのコンテンツを選択範囲の隣に表示します。デフォルトでは選択範囲の上(`bubbleMenuPlacement`、スペースがなければ反対側に反転)に `bubbleMenuOffset` ポイント(8)の間隔で配置され、スクロールに合わせてテキストに追従するオーバーレイ内に表示されます。アプリは、表示したい間だけ、セッションの状態から次のように渡します。

```tsx
const revision = signal(editor.revision);
editor.on("revision", ({ revision: r }) => revision.set(r));
const inLink = () => (revision(), editor.isActive("link"));

<RichEditor
  editor={editor}
  bubbleMenu={inLink() ? <LinkMenu href={editor.getAttributes("link").href} /> : undefined}
  bubbleMenuPlacement="bottom"
/>
```

リンクメニューは、キャレット位置のリンクを `chain([extendMarkRange("link"), command("setLink", { href })])` で編集し、同じ `extendMarkRange` の後に `command("unsetLink")` で削除します。

<a id="schemas"></a>

## スキーマ

`defineSchema(spec)` は ProseMirror 形式のスキーマを読み取り、問題があればその内容を示してスローします。ノードタイプでは、`content`(コンテント式: `"inline*"`、`"paragraph+"`、`"(heading | paragraph) block*"`)、`group`、`inline` か `atom` か、許可する `marks`、デフォルト値とバリデーションを持つ `attrs`(`"string"`、`"number"`、`"boolean"`)を指定します。最初のブロックタイプがデフォルトとなり、Enter で作成されるものや、必須コンテンツを埋めるものになります。仕様が知らないキーは、エディター上に構築されるフレームワーク向けに、タイプの追加データとして保持されます。

```tsx
import { createRichEditor, defineSchema } from "nsh/base";

const schema = defineSchema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*", group: "block" },
    mention: { group: "inline", inline: true, atom: true, attrs: { id: {}, label: { default: "" } } },
    text: { group: "inline" },
  },
  marks: { bold: {}, link: { attrs: { href: {} }, inclusive: false } },
});

const editor = createRichEditor({ schema, doc: schema.parse("Hello") });
```

`RichSchema` はドキュメントの読み書きを行います。`parse(content, format?)`(デフォルトはプレーンテキスト、`"markdown"`、または JSON)、`parseMarkdown(markdown)`、`serialize(doc, format?)`(デフォルトは Markdown、`"text"`、`"json"`)、そして属性のデフォルト値を補ったドキュメントを返す `check(doc)` があります。`nodes`、`marks`、`topNode` はそのタイプに名前を付けます。Markdown はスタータースキーマの名前(`paragraph`、`heading`、`blockquote`、`codeBlock`、`bulletList`、`orderedList`、`listItem`、`bold`、`italic`、`code`、`link`、`strike`)に対応付けられます。

<a id="commands"></a>

## コマンド

コマンドは値です。`toggleMark("bold")` は、アプリが保持し、キーにバインドし、エディターに渡せるオブジェクトを作ります。`editor.run(command)` はコマンドを実行して適用されたかどうかを返し、`editor.can(command)` は何も変更せずに実行可否を問い合わせます。ツールバーがボタンを有効にするかどうかの判断にはこれを使います。`editor.isActive(name, attrs?)` は、選択範囲でマークまたはノードがアクティブかどうかを返します(`isActive("heading", { level: 2 })`)。

| コマンド | 内容 |
| --- | --- |
| `toggleMark(name, attrs?)` | 選択範囲にマークを追加し、すでにある場合は削除します。カーソル位置では、次に入力するテキストに対して作用します |
| `setMark(name, attrs?)` / `unsetMark(name)` | マークを追加または削除します |
| `setBlockType(name, attrs?)` | 選択したテキストブロックを指定のタイプにします(`setBlockType("heading", { level: 2 })`) |
| `wrapIn(name, attrs?)` / `lift()` | 選択したブロックをノード(引用など)で包みます / 親から取り出します |
| `wrapInList(name, attrs?)` | 選択したブロックをリストで包みます |
| `splitListItem(name)` / `sinkListItem(name)` / `liftListItem(name)` | リスト項目を分割、インデント、アウトデントします |
| `undo()` / `redo()` | 変更を元に戻す、またはやり直します(`history()` を使用) |
| `selectAll()`、`setTextSelection(anchor, head?)`、`setNodeSelection(pos)` | 選択します |
| `insertText(text)`、`insertContent(content, format?)` | 選択範囲を置き換えてテキストまたはコンテンツを挿入します |
| `setNodeAttribute(pos, attr, value)` | 指定位置のノードの属性を、元に戻せる 1 回の変更として設定します |
| `command(name)` | パラメーターのないコマンドを名前で指定します: `"splitBlock"`、`"joinBackward"`、`"exitCode"`、`"newlineInCode"`、`"selectParentNode"`、… |
| `chain(commands)` | コマンドを順に、1 つのトランザクション(元に戻す操作 1 回分)として実行します。すべてが適用できる場合にのみ適用されます |
| `first(commands)` | 適用できる最初のコマンドを実行します |

```tsx
editor.run(chain([setBlockType("heading", { level: 1 }), toggleMark("bold")]));
const canIndent = editor.can(sinkListItem("listItem"));
```

<a id="the-session"></a>

## セッション

| メンバー | 内容 |
| --- | --- |
| `state`、`doc`、`selection` | 状態、ドキュメント、選択範囲を JSON として返します。読み取り時に生成されます |
| `revision` | 状態が適用したトランザクションの数 |
| `isEmpty`、`undoDepth`、`redoDepth`、`composing` | UI がエディターについて表示する情報 |
| `setContent(content, format?)` | ドキュメントを、元に戻せる 1 回の変更として置き換えます |
| `insertContent(content, format?)` | 選択範囲を置き換えてコンテンツを挿入します |
| `getJSON()`、`getMarkdown()`、`getText()`、`textBetween(from?, to?, separator?)` | 指定した形式のドキュメント |
| `dispatch(tr)` | JSON で与えられたトランザクション(現在のドキュメントに対するステップ)を適用します |
| `on(event, listener)` | JS の次のターンで、すべての `event` のペイロードとともに `listener` を呼び出します: `revision`(`{ revision }`、あらゆる変更の後、どのソースからでも)、`update`、`selectionUpdate`、`transaction`、`focus`、`blur`、`delete`。購読を停止する関数を返します。コンポーネントのレンダリング中に追加したリスナーは、そのコンポーネントとともに停止します |
| `focus()`、`blur()` | エディターを表示しているビューにキーボードフォーカスを移す、またはビューから外します |

位置は ProseMirror と同じ方法で数えます。テキストは UTF-16 コードユニット単位、リーフノードは 1、コンテンツを持つノードは 2 つの境界を数えます。編集後も残す必要があるものは、ノードの属性またはマークに ID を持たせます。位置クエリ(`resolve(pos)`、`nodeAt(pos)`、`coordsAtPos(pos)`、`findParentNode(name, pos)`、...)は、ドキュメント外の位置(`0` から `doc.content.size`)に対して `RangeError` をスローします(ProseMirror の `resolve` と同様)。該当するものがない場合(ノード末尾での `nodeAt`、エディターを表示するビューがない場合の `coordsAtPos`)は `null` を返します。`run` と `can` は、エディターが知らないコマンド、ノード、マークのタイプに対して `TypeError` をスローします。

<a id="taking-over-transactions"></a>

### トランザクションの引き継ぎ

`editor.dispatchTransaction = (tr) => { … }` を使うと、アプリがすべてのトランザクションを自らコミットします。ハンドラーは各トランザクションを JSON として受け取り、`editor.applyTransaction(tr)` でコミットするか、破棄します。コラボレーション、ログ記録、アプリのチェックを通す必要があるトランザクションで使います。`null` でコミットをエディターに戻します。ハンドラーは入力を JS の次のターンで受け取り、ドキュメントはコミットされた時点で変わります。

<a id="extensions"></a>

## 拡張機能

拡張機能は Tiptap のものです。各拡張機能は、ノードまたはマークタイプ、キーバインド、入力ルールとペーストルール、プラグイン、名前付きコマンドをまとめて提供し、拡張機能から作られたエディターは、それらからスキーマ、キーマップ、ルール、コマンドテーブルを得ます。組み込みの拡張機能は Tiptap と同じ名前のクラスで、そのまま、または設定して使えます。

```tsx
import { RichEditor, StarterKit, Underline, command, createRichEditor } from "nsh/base";

const editor = createRichEditor({
  extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false })],
  content: "Hello",
  editable: true,
});

editor.run(command("toggleHeading", { level: 2 }));
editor.run(command("toggleBold"));
```

`StarterKit` は、`Document`、`Paragraph`、テキストノード、`Heading`、`Blockquote`、`BulletList`、`OrderedList`、`ListItem`、`TaskList`、`TaskItem`、`CodeBlock`、`HardBreak`、`HorizontalRule`、`RichImage`(Tiptap の `Image`)、`Bold`、`Italic`、`Strike`、`Code`、`Underline`、`RichLink`(Tiptap の `Link`)、`Highlight`、`Subscript`、`Superscript`、`RichTextStyle`(Tiptap の `TextStyle`)、`TextAlign`、`History`、`TrailingNode`、`Typography`、`ListKeymap` を提供します。これらの名前のオプションに `false` を設定すると、その拡張機能は除外され、オブジェクトを設定するとその拡張機能を構成できます(`heading: { levels }`、`history: { depth }`、`textAlign: { types }`、`codeBlock: { enableTabIndentation }`)。各クラスの `configure(options)` と `extend({...})` は `RichExtension` を作り、それには `name`、`type`、`priority`、`options` があります。すべてのエディターには、コアのキーマップ(Enter、Backspace、Delete、全選択)も追加されます。

各拡張機能は Tiptap のコマンドを追加し、`command(name, args)` がそれらを実行します: `toggleBold`、`setItalic`、`unsetStrike`、`toggleHeading({ level })`、`setParagraph`、`toggleBlockquote`、`toggleBulletList`、`toggleOrderedList`、`toggleTaskList`、`toggleCodeBlock({ language })`、`setHardBreak`、`setHorizontalRule`、`setImage({ src })`、`toggleHighlight({ color })`、`setTextAlign("center")`、`unsetTextAlign`、そして以下のリンク、文字数カウント、サジェストのコマンド。

リストのトグルは、ワードプロセッサーのリストボタンと同様に、リスト全体に作用します。箇条書きリスト内の `toggleOrderedList` は、ネストされたリストを含むすべてのレベルを番号付きにし、リスト自身のトグルは、選択したブロックを周囲のすべてのリストから取り出します。

`extensions` の順序は、同順位の間での優先度です。後に列挙された拡張機能は、それより前のものよりも先にキーをバインドします。それ以外の順位付けには `priority`(デフォルトは 100)を使います。`extensions` を使うと、エディターの `plugins` は拡張機能のプラグインの後に来ます。

<a id="the-apps-extensions"></a>

### アプリ独自の拡張機能

`defineExtension` で拡張機能を 1 つ作ります。その関数は、その拡張機能を使ってエディターが作られるときに一度だけ、拡張機能のオプションとともに実行され、データを返します。コマンド、ルール、プラグインは、上記のファクトリーが作るものです。

```tsx
import { StarterKit, command, createRichEditor, defineExtension, insertText, textRule } from "nsh/base";

const Signature = defineExtension({
  name: "signature",
  priority: 200,
  addOptions: () => ({ text: "— Sent from NSH" }),
  addCommands: (options) => ({ insertSignature: insertText(options.text) }),
  addKeyboardShortcuts: () => ({ "Mod-Alt-s": command("insertSignature") }),
  addInputRules: () => [textRule("\\(sig\\)$", "✍")],
});

const editor = createRichEditor({ extensions: [StarterKit, Signature.configure({ text: "Best, Ana" })] });
```

`node` または `mark`(`defineSchema` の形式)を指定すると、ノード拡張機能またはマーク拡張機能になります。`addGlobalAttributes` は他のタイプに属性を追加します。`addProseMirrorPlugins` は、`RichEditorPlugin` を含むプラグインを返します。`addPasteRules` は、ペーストされたテキスト用の `textRule` ルールと `markRule` ルールを返します。組み込みクラスの `extend({...})` は、そのクラスが提供する部分を置き換えます: `Underline.extend({ addKeyboardShortcuts: () => ({ "Mod-Alt-u": toggleMark("underline") }) })`。

アプリのクレートは、UI セットを通じて Rust で書かれた拡張機能を登録し、JS はそれらを名前で取得します。

```rust
use nsh_base::rich_editor::extensions::{Extension, RichExtensionRegistry};

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.rich_extension("mention", || Extension::new("mention") /* .add_plugins(...) */);
}
```

```tsx
const editor = createRichEditor({ extensions: [StarterKit, richExtension("mention", { char: "@" })] });
```

`richExtension(name, options)` は、すべての組み込み拡張機能も名前(`"text"`、`"bold"`、...)で見つけます。

<a id="plugins"></a>

## プラグイン

| ファクトリー | 追加されるもの |
| --- | --- |
| `history({ depth?, newGroupDelay? })` | 元に戻す履歴。`newGroupDelay` ミリ秒(500)以内の変更はまとめて元に戻されます |
| `keymap(bindings)` | キー名によるコマンド: `"Mod-b"`(Apple プラットフォームでは Cmd、それ以外では Ctrl)、`"Shift-Enter"`、`"Alt-ArrowUp"` |
| `baseKeymap()` | Enter、Backspace、Delete、全選択、およびプラットフォームのテキスト編集キー |
| `starterKeymap()` | スタータースキーマのバインド: マーク、見出し、リスト、コードブロック、ハードブレーク |
| `inputRules(rules)` | カーソルの前に入力されたテキストがルールに一致すると、ルールが生成するものに変換されます。直後に Backspace を押すと元に戻ります |
| `markdown(options?)` | 入力中の Markdown、Markdown のペースト、Markdown のコピー(`blockRules`、`inlineRules`、`paste`、`copyAsMarkdown`) |
| `starterKit()` | スターターの入力ルールとバインド、基本バインド、履歴 |

プラグインのリスト内の位置が、そのまま優先度になります。リストの前方にあるキーマップと入力ルールが、キーやテキストを先に処理します。入力ルールは `markdownRules()`(見出し、引用、リスト、コードフェンス、ルール、一般的なマーク)、`typographyRules()`(スマートクォート、省略記号、エムダッシュ)、`textRule(match, replacement)`、`markRule(match, mark)`、`wrappingRule(match, node)`、`textblockRule(match, node)` から提供されます。ルールの `match` は `$` で終わる正規表現で、カーソルの前のテキストに対してマッチされます。

<a id="the-apps-plugins"></a>

### アプリ独自のプラグイン

`new RichEditorPlugin(key)` は、アプリ独自の動作を持つプラグインを作ります。動作はチェーン呼び出しで設定します。

```tsx
import { RichEditorPlugin, createRichEditor, starterKit } from "nsh/base";

const suggestions = new RichEditorPlugin("suggestions")
  .captureKeys(["ArrowUp", "ArrowDown", "Enter", "Escape"], (key) => moveSuggestion(key))
  .filterTransaction((tr) => tr.meta?.locked !== true)
  .appendTransaction((trs, state) => null);

const editor = createRichEditor({ plugins: [starterKit(), suggestions] });

// While the suggestion list is open, its keys are the list's.
suggestions.capturing = true;
editor.setDecorations("suggestions", [{ from: 5, to: 9, kind: "inline", attrs: { class: "bg-accent" } }]);
```

- `captureKeys(keys, handler)`: `capturing` が true の間、エディターはこれらのキーを消費し、直後にどのキーが押されたかを `handler` に伝えます。キーボードの応答性は、プラグインがない場合と変わりません。
- `editor.setDecorations(key, decorations)`: ビューがドキュメントを変更せずにその上に描画する、インライン属性、ノード属性、ウィジェット。再設定されるまで、あらゆる変更に追従します。
- `filterTransaction(hook)` と `appendTransaction(hook)` は、その呼び出しの中でアプリ自身の呼び出し(`run`、`dispatch`、`setContent`、…)が作るトランザクションを見ます。`filterTransaction` はトランザクションを破棄でき、`appendTransaction` はもう 1 つ返して一緒に適用させることができます。`on("revision", …)` は、入力を含むすべての変更を受け取ります。
<a id="links-character-counts-and-suggestions"></a>

## リンク、文字数、サジェスト

3つのプラグインが Tiptap の Link、CharacterCount、Suggestion の動作をすべてネイティブで提供します。

```tsx
import { RichEditor, characterCount, createRichEditor, insertMention, link, starterKit, starterSchema, suggestion, withMention } from "nsh/base";

const editor = createRichEditor({
  schema: withMention(starterSchema()),
  plugins: [
    starterKit(),
    link({ defaultProtocol: "https" }),
    characterCount({ limit: 280 }),
    suggestion({ key: "mention", char: "@", decorationClass: "text-primary", captureKeys: ["ArrowUp", "ArrowDown", "Enter"] }),
  ],
});

editor.on("transaction", () => {
  const s = editor.suggestion("mention");
  if (s?.active) showPeople(s.query, editor.coordsAtPos(s.range.from), s.lastKey);
  setCount(`${editor.characters()} / ${editor.characterLimit}`);
});

// The list picked someone:
editor.run(insertMention(editor.suggestion("mention")!.range, "u1", "Joan"));
```

- `link(options?)`: スペースまたは Enter の前に入力した URL はリンクになり、貼り付けたテキスト内の URL も同様です(`autolink`)。選択範囲の上に URL を貼り付けると、その選択範囲がリンクになります(`linkOnPaste`)。Mod を押しながらリンクを押した場合、またはエディタが読み取り専用の場合は、アプリの URL 処理を通じてリンクを開きます(`openOnClick`)。`enableClickSelection` は、押下時にリンク全体を選択します。URL はプロトコルの有無にかかわらず検出され(`nsh.dev`、`https://nsh.dev/docs`、メールアドレス)、プロトコルのないホストに付与されるプロトコルは `defaultProtocol`(`http`)です。リンクで使えるプロトコルは `http`、`https`、`ftp`、`ftps`、`mailto`、`tel`、`callto`、`sms`、`cid`、`xmpp` と `protocols` にあるものです。そのため、`setLink({ href })`、`toggleLink(attrs?)`、オートリンクではスクリプト(`javascript:`)や data URL は除外されます。`unsetLink()` は、選択範囲のリンクを削除します。
- `characterCount(options?)`: `editor.characters(mode?)` は、テキストの文字数(`"textSize"`、JS の `length` と同じ UTF-16 単位)またはドキュメントの位置数(`"nodeSize"`)を数えます。`editor.words()` は単語数(Unicode の単語境界)を数えます。`limit` を指定すると、上限を超える変更は拒否され、貼り付けた内容は収まる分だけに切り詰められます。最初のドキュメントが上限を超えている場合も切り詰められます(`autoTrim`)。`setCharacterLimit(limit)` は上限を変更し、`editor.characterLimit` は上限を読み取ります。
- `suggestion(options?)`: カーソルの前に入力されたトリガー(`char`、デフォルトは `@`)を追跡します。`allowSpaces` はクエリにスペースを含められるようにし、`allowedPrefixes` はトリガーの前に置けるものを列挙し(デフォルトはスペース。`anyPrefix` は何でも許可します)、`startOfLine` はトリガーが行頭にあることを要求します(`/` コマンドメニュー向け)。`editor.suggestion(key)` は `{ active, range, query, text, lastKey, keyCount }` を返します。アクティブな範囲にはアプリの `decorationClass` が含まれます(クエリが空の間は `decorationEmptyClass` も含まれます)。サジェストがアクティブな間、`captureKeys` のキーはアプリのリストのものになります。エディタがそれらのキーを受け取って最後のキーを状態に記録し、Escape はサジェストを閉じます(`exitSuggestion(key)` でも閉じます)。`replaceSuggestion(content, key?)` は、トリガーとクエリをテキストまたは JSON コンテンツに置き換えます。
- `withMention(schema, { name?, char? })` は、Tiptap の mention ノードを追加します。これは `id`、`label` とトリガーを持つインラインのアトムで、テキストでは `@label`、HTML では `<span data-type="mention">` として書き出されます。`insertMention(range, id, label?)` は、サジェストの範囲をメンションとスペースに置き換えます。

ポップアップはアプリ側のものです。サジェストの状態を読み取り、`coordsAtPos(range.from)` に自身を配置し、項目を独自の方法で描画します。

<a id="tables"></a>

## テーブル

`TableKit` は Tiptap のテーブルを提供します。`RichTable`(Tiptap の `Table`)、`RichTableRow`、`RichTableHeader`、`RichTableCell` です。これは `StarterKit` と並べて追加します。

```tsx
import { RichEditor, StarterKit, TableKit, addRowAfter, createRichEditor, insertTable, mergeCells } from "nsh/base";

const editor = createRichEditor({
  extensions: [StarterKit, TableKit.configure({ table: { cellMinWidth: 40 } })],
});

editor.run(insertTable({ rows: 3, cols: 3, withHeaderRow: true }));
editor.run(addRowAfter());
```

テーブルには、オプション `resizable`(true)、`cellMinWidth`(25)、`lastColumnResizable`(true)、`allowTableNodeSelection`(false)、`HTMLAttributes` があります。`TableKit.configure({ tableHeader: false })` は拡張を1つ除外します。セルはブロックを保持でき、`colspan`、`rowspan`、`colwidth`(結合している列ごとのポイント単位の幅)を持ちます。行には `height` があります。

Tab と Shift-Tab でセル間を移動し、最後のセルで Tab を押すと行が追加されます。セルの端での矢印キーは次のセルへ進みます。Shift を押しながらの矢印キー、またはセルをまたぐドラッグで、セルの矩形範囲が選択されます(型 `"cell"` の選択で、その `anchor` と `head` は最初と最後のセルの直前の位置です)。Backspace と Delete は選択したセルを空にし、すべてのセルが選択されている場合はテーブルを削除します。

エディタ内では、テーブルはセルのグリッドになります。各列の幅はそのセルの `colwidth` で決まり、指定のない列は残りの幅を分け合います(最小幅は `cellMinWidth`)。各行は少なくとも `height` の高さになります。見た目はテーマから始まり、1ポイントの `border` のグリッド、`muted` 上のヘッダーセル、パディング付きのセル、そして選択色で表示される `selectedCell` パーツの下の各選択セルで構成されます。`classes.nodes`(`table`、`tableCell`、`tableHeader`)とパーツで、そのすべてのスタイルを変更できます。セルの最初または最後の行で上キー・下キーを押すと、上または下のセルへ移動します。

ドキュメントが編集可能な間は、次のとおりです。

- デスクトップでは、各列の右の境界線と各行の下の境界線でサイズを変更できます。ポインターにはリサイズカーソルと `tableResizeHandle` の線が表示され、テーブルはドラッグに追従し、離すと `colwidth` または `height` が1ステップで設定されます。これは元に戻す操作で取り消せます。`resizable: false` でこの機能をオフにでき、`lastColumnResizable: false` は最後の列の幅を保持します。
- 選択範囲があるテーブルには、各列の上の上側の境界線と、各行の横の左側の境界線にグリップ(`tableGrip`)が表示されます。グリップを押すとその列または行が選択されます。デスクトップでドラッグすると、ドロップ位置(`tableDropIndicator`)が表示され、離すとそこへ移動します。

```tsx
<RichEditor
  editor={editor}
  classes={{
    nodes: { tableHeader: "font-semibold", tableCell: "px-3 py-2" },
    selectedCell: "bg-primary/10",
    tableGrip: "bg-muted-foreground/60 rounded-full",
  }}
/>
```

コマンドはすべて `nsh/base` のヘルパーです。

- `insertTable({ rows, cols, withHeaderRow })`(デフォルトは 3 × 3 でヘッダー行付き)と `deleteTable()`。
- `addColumnBefore()`、`addColumnAfter()`、`deleteColumn()`、`addRowBefore()`、`addRowAfter()`、`deleteRow()`。
- `mergeCells()`、`splitCell()`、`mergeOrSplit()`。
- `toggleHeaderRow()`、`toggleHeaderColumn()`、`toggleHeaderCell()`。
- `setCellAttribute(name, value)`、`setCellSelection({ anchorCell, headCell })`、`goToNextCell()`、`goToPreviousCell()`、そしてセルの欠落や重複があるテーブルを修復する `fixTables()`。
- `moveTableRow({ from, to, select })` と `moveTableColumn({ from, to, select })` は、結合セルがまたぐ行または列とともに、行または列を移動します。`setColumnWidth({ col, width })` と `setRowHeight({ row, height })` はそれらのサイズを設定します(`null` は内容に合わせたサイズにします)。これらは、選択範囲のテーブル以外のテーブルを対象にするために、テーブル直前の位置である `table` を受け取ります。

テーブルは HTML(`<table>` と `<th>` / `<td>`、`colspan`、`rowspan`、`data-colwidth`)と Markdown で読み書きできます。ヘッダー行があり、各セルが1つの段落だけであるテーブルは GFM のパイプテーブルになり、それ以外のテーブルは HTML として書き出され、読み戻すと同じテーブルになります。プレーンテキストでは、1行がタブで区切られたセルの並びになります。
