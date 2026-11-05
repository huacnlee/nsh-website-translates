---
title: "Editor"
description: "Editor コンポーネント:シンタックスハイライト、行番号、複数キャレット、折りたたみ、ソフトラップ、検索と置換、診断、デコレーション、そしてコードエディタ特有のキー操作に対応したコードエディタです。"
group: base
demo: el-editor
source_hash: 27f9d0cbb9ff5dd4
---

# エディター

`Editor` はコードエディターです。50を超える言語のシンタックスハイライト、行番号、複数キャレット、折りたたみ、ソフトラップ、検索と置換、診断とデコレーションに対応し、コードエディターらしいキー操作（行の移動と複製、コメント、インデント、入力に合わせて閉じる括弧と引用符）を備えています。どれほど長いファイルでも扱えます。生成されるのは表示中の行だけで、ハイライトは編集のたびに行単位で追従するため、長いファイルでも短いファイルと同じようにスクロールと入力ができます。入力はプラットフォームの入力を経由するので、入力メソッド（ピンイン、かな、デッドキー）やソフトウェアキーボードも、通常のテキストフィールドと同じように動作します。

エディターは動作を担い、テーマのトークンから作られた独自の見た目が付属します。テーマの `font-mono` を 13pt、行の高さ 20pt で表示し、行番号は `muted-foreground`、キャレットのある行の背後には薄い `muted` の帯、選択範囲は `primary` の色合い、インデントガイドは `border` で表示します。さらに、[`TextView`](./text-view.md) のコードブロックが使う組み込みのシンタックスカラーを、ライトとダークの両方で用意しています。各パーツは、これらのデフォルトよりもアプリのスタイルを優先します（`classes` と `styles`）。Rust では `nsh_base::editor()` で、TSX では `nsh/base` の `<Editor>` で作成します。

```rust tabs
use nsh_base::editor;
use nsh_core::prelude::*;

const MAIN: &str = "fn main() {\n    println!(\"Hello, world!\");\n}\n";

fn code() -> impl IntoElement {
    let source = signal(SharedString::from(MAIN));
    editor()
        .value(move || Some(source.get()))
        .language("rust")
        .on_change(move |value: &SharedString| source.set(value.clone()))
        .flex_1()
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { Editor } from "nsh/base";

const MAIN = `fn main() {
    println!("Hello, world!");
}
`;

function App() {
  const source = signal(MAIN);
  return <Editor value={source()} onChange={({ value }) => source.set(value)} language="rust" class="flex-1" />;
}

mount(App);
```

エディターはアプリから与えられたボックス（`flex-1`、高さ）を埋め、テキストをその内側でスクロールします。縦方向には常にスクロールし、行がボックスより長い場合は横方向にもスクロールします。`softWrap` を指定すると横スクロールは行わず、長い行はエディターの幅で折り返されます。

<a id="the-text"></a>

## テキスト

- **制御コンポーネント**: `value` を渡し、新しいテキスト全体を通知する `onChange` で再設定します。アプリが変更した `value`（読み込んだファイル、フォーマッターの出力など）は、元に戻す操作で取り消せる1回の編集としてテキストを置き換え、変更箇所から離れたキャレットと折りたたみはそのまま残ります。
- **非制御コンポーネント**: `defaultValue` を渡し、テキストは `onChange` または ref の `value()` から読み取ります。

改行は `\n` です。入力されたテキスト内の `\r\n` と `\r` は `\n` になります。

<a id="languages"></a>

## 言語

`language` は、言語を名前、エイリアス、拡張子、ファイル名のいずれかで、大文字小文字を問わず指定します。たとえば `"rust"`、`"rs"`、`"typescript"`、`"tsx"`、`"main.go"`、`"Dockerfile"`、`"Makefile"` です。この指定によって、ハイライト、`mod+/` で切り替えるコメント、対応とインデントを行う括弧、入力時に閉じるペア、単語を構成する文字、デフォルトのインデントが決まります。デフォルトのインデントは、スペース4つ、Web系の言語（JavaScript、TypeScript、JSON、HTML、CSS、YAML など）ではスペース2つ、Go と Makefile ではタブです。`tabSize` と `hardTabs` は、すべての言語に共通のインデントを設定します。それ以外の名前はプレーンテキストとして扱われます。ただし、アプリが登録している場合は別です（[独自の言語](#your-own-languages)）。

対応言語: Rust, JavaScript, JSX, TypeScript, TSX, JSON, Python, Go, C, C++, C#, Java, Kotlin, Swift, Objective-C, Objective-C++, Ruby, PHP, Lua, Shell, Fish, PowerShell, SQL, HTML, XML, Vue, Svelte, CSS, SCSS, Sass, Less, Markdown, YAML, TOML, INI, Dockerfile, Makefile, CMake, Dart, Scala, Elixir, Erlang, Haskell, OCaml, F#, Clojure, Zig, Perl, R, Julia, Nix, Terraform, Protocol Buffers, GraphQL, Diff。

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language={file().name} tabSize={2} softWrap class="flex-1" />
```

<a id="your-own-languages"></a>

### 独自の言語

Rust のコードを使うと、アプリのエディターに言語を追加でき、独自のハイライターを持つ任意の言語（tree-sitter 文法、アプリ独自のパーサー）をハイライトできます。`register_language` は `EditorLanguage` を登録します。これには、名前、エイリアス、拡張子、ファイル名と、編集ルール（コメント、括弧、入力時に閉じるペア、単語を構成する文字、インデント）が含まれ、`syntax` にはハイライトに使う組み込み文法の名前を指定します。`register_highlighter` は、組み込みまたは登録済みの言語にアプリのハイライターを割り当てます。ハイライターは `EditorHighlighter` を実装した型で、すべての編集（tree-sitter の編集と同じ形式の、行、バイト、位置）を受け取り、UI スレッドとは別のスレッドで、時間予算の範囲内に各行のトークン（`EditorToken`、または `EditorToken::from_scope` を通した tree-sitter のキャプチャや TextMate のスコープ）を返します。エディターはそのトークンを保持し、編集に合わせてテキストとともに移動させ、表示中の行についてあらためて問い合わせます。これは組み込みのハイライターに対する動作と同じです。`language` は、登録済みの言語を名前、エイリアス、拡張子、パスから最初に検索します。これはエディターでも diff ビューでも同様です。

言語はエンジンごとに保持されます。Rust アプリでは、エディターをマウントする前にルートで登録します。TSX アプリでは、アプリのクレートが UI セットのセットアップ内で登録し、アプリを実行するすべてのエンジンが最初にそのセットアップを呼び出します。

```rust
use nsh_base::editor::{EditorLanguage, register_highlighter, register_language};
use nsh_core::prelude::*;

static NIMBLE: EditorLanguage = EditorLanguage::new("Nimble")
    .extensions(&["nb"])
    .line_comment("#")
    .tab_size(2);

#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.setup(|| {
        register_language(&NIMBLE);
        register_highlighter("nimble", || Box::new(NimbleHighlighter::default()));
    });
}
```

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language="build.nb" class="flex-1" />
```

<a id="editing"></a>

## 編集

エディターは、一般的なコードエディターと同じように動作します。

- **複数キャレット。** Alt+クリック（Option+クリック）でキャレットを追加します。`mod+d` は選択範囲の次の出現箇所を選択し、`mod+shift+l` はすべての出現箇所を選択します。キャレット追加のキーを使うと、上または下の行にキャレットを追加できます。入力、削除、移動、およびすべてのコマンドは、各キャレットで実行されます。Escape で1つのキャレットに戻ります。`undoSelection`（`cmd+u`、`ctrl+u`）は、直前の移動の前の選択状態に戻します。
- **選択範囲の拡張。** `expandSelection`（`ctrl+shift+cmd+right`、`shift+alt+right`）で、単位ごとに選択範囲を広げます。単語、文字列の内容と文字列全体、括弧ペアの内容とペア全体、行、テキスト全体の順です。`shrinkSelection` は同じ順序で戻します。`splitSelectionIntoLines`（`shift+alt+i`）は、複数行にまたがる選択範囲を、行ごとに1つの選択範囲へ変換します。
- **インデント。** 改行すると現在の行のインデントを引き継ぎ、開き括弧の後ではレベルを1つ増やします（Python の `:`、Ruby の `do` など）。括弧のペアの間で Enter を押すと、閉じ括弧が単独の行に置かれます。Tab と Shift+Tab は、選択した行をインデント、アウトデントします。先頭の空白で Backspace を押すと、1つ前のインデント位置まで戻ります。`autoIndent` でこれらを無効にできます。
- **括弧と引用符。** 入力に合わせて閉じられ、選択範囲を囲み、閉じる側をもう一度入力するとそれを飛び越します（`autoClose`）。キャレット位置の括弧と対応する括弧は、枠線で強調表示されます。
- **元に戻す。** 入力のまとまり（単語、削除、コマンド）ごとに取り消されます。移動やプレスで新しい単位が始まります。
- **折りたたみ。** より深くインデントされた行が続く行は、ガターのマーカーで折りたたまれます。折りたたみは `⌄`、展開は `›` と、行の後ろの `⋯` で行います。折りたたみの中にキャレットが移動すると、その折りたたみは開きます（[折りたたみ](#folding)）。
- **プレス。** ポインターでは、クリックでキャレットを置き、ダブルクリックで単語、トリプルクリックで行を選択し、Shift+クリックで選択範囲を拡張し、ドラッグではクリックで選択した単位ごとに選択します。Alt+Shift ドラッグ（Option+Shift。Linux では Control+Alt も可）では矩形選択を行い、同じ列の間で行ごとに1つの選択範囲を作ります。短い行の末尾を超えても選択は続きます。タッチスクリーンでは、タップでキャレットを置き、ダブルタップまたは長押しで指の下の単語を選択し、その選択範囲の両端のハンドルを指でドラッグすると、各端が移動します（その周囲のテキストは引き続きスクロールします）。
- **クリップボード。** 選択範囲がない状態でコピーまたは切り取りを行うと、キャレットのある行全体が対象になり、貼り付けるとキャレットのある行の上に行全体として挿入されます。

`readOnly` は、テキストが選択、検索、コピーされている間も、そのままの状態を保ちます。

<a id="keys"></a>

## キー

エディターのキーは、エディターがフォーカスを持っている間に機能します。ほかの入力はそれぞれのキーを保持します。`mod` は macOS と iOS では Command、それ以外では Control です（`keymap` のキーストローク）。

| キー (macOS) | キー (Windows, Linux) | コマンド |
|---|---|---|
| 矢印キー（Shift で選択） | 矢印キー（Shift で選択） | 文字と行単位で移動 |
| `alt+left` / `alt+right` | `ctrl+left` / `ctrl+right` | 単語単位で移動 |
| `cmd+left` / `cmd+right`, `home` / `end`, `ctrl+a` / `ctrl+e` | `home` / `end` | 行の最初の空白以外の文字（もう一度で行頭） / 行末 |
| `cmd+up` / `cmd+down` | `ctrl+home` / `ctrl+end` | テキストの先頭 / 末尾 |
| `pageup` / `pagedown` | `pageup` / `pagedown` | 1ページ上 / 下 |
| `alt+backspace` / `alt+delete` | `ctrl+backspace` / `ctrl+delete` | 左 / 右の単語を削除 |
| `cmd+backspace` / `cmd+delete`, `ctrl+k` | `ctrl+shift+backspace` / `ctrl+shift+delete` | 行頭 / 行末まで削除 |
| `cmd+z` / `cmd+shift+z` | `ctrl+z` / `ctrl+shift+z`, `ctrl+y` | 元に戻す / やり直す |
| `cmd+a` | `ctrl+a` | すべて選択 |
| `cmd+l` | `ctrl+l` | 行を選択（もう一度で次の行も選択） |
| `cmd+d` | `ctrl+d` | 次の出現箇所を選択 |
| `cmd+shift+l` | `ctrl+shift+l` | すべての出現箇所を選択 |
| `cmd+alt+up` / `cmd+alt+down` | `ctrl+alt+up` / `ctrl+alt+down` | 上 / 下にキャレットを追加 |
| `escape` | `escape` | 1つの選択範囲に戻す |
| `alt+up` / `alt+down` | `alt+up` / `alt+down` | 行を上 / 下に移動 |
| `alt+shift+up` / `alt+shift+down` | `alt+shift+up` / `alt+shift+down` | 行を上 / 下に複製 |
| `cmd+shift+k` | `ctrl+shift+k` | 行を削除 |
| `cmd+enter` / `cmd+shift+enter` | `ctrl+enter` / `ctrl+shift+enter` | 下 / 上に新しい行を挿入 |
| `tab` / `shift+tab`, `cmd+]` / `cmd+[` | `tab` / `shift+tab`, `ctrl+]` / `ctrl+[` | インデント / アウトデント |
| `cmd+/` | `ctrl+/` | 行コメントを切り替え |
| `cmd+shift+\` | `ctrl+shift+\` | 対応する括弧へ移動 |
| `ctrl+j` | `ctrl+j` | 行を連結 |
| `ctrl+t` | | キャレットの前後の文字を入れ替え |
| `ctrl+alt+left` / `ctrl+alt+right`（Shift で選択） | | 単語の一部（camelCase、snake_case）単位で移動 |
| `shift+alt+a` | `shift+alt+a` | ブロックコメントを切り替え |
| `shift+alt+i` | `shift+alt+i` | 選択範囲を行ごとに分割 |
| `ctrl+shift+cmd+right` / `ctrl+shift+cmd+left` | `shift+alt+right` / `shift+alt+left` | 選択範囲を拡大 / 縮小 |
| `cmd+u` | `ctrl+u` | 前の選択範囲に戻す |
| `cmd+g` / `cmd+shift+g`, `f3` / `shift+f3` | `f3` / `shift+f3` | 次 / 前の一致を検索 |
| `cmd+e` | | 選択範囲を検索（`onFindWithSelection`） |
| `cmd+alt+[` / `cmd+alt+]` | `ctrl+shift+[` / `ctrl+shift+]` | キャレットの行を折りたたみ / 展開 |
| `f12` | `f12` | キャレット位置の定義へ移動（`onDefinitionRequest`） |
| `cmd+.` | `ctrl+.` | 選択範囲に対するコードアクション（`onCodeActionRequest`） |
| `cmd+c` / `cmd+x` / `cmd+v` | `ctrl+c` / `ctrl+x` / `ctrl+v` | コピー / 切り取り / 貼り付け |

macOS と iOS には、Cocoa のテキストキーもあります。`ctrl+b` / `ctrl+f` / `ctrl+p` / `ctrl+n` で移動し、`ctrl+h` / `ctrl+d` で削除します。

デフォルトのキーがないコマンドとアプリ独自のコマンドは、アプリが [`keymap`](../modules/nsh.md#keymap) で割り当てたキーを使い、ref の `run` を通じて実行されます。

```tsx
import { keymap } from "nsh";

let editor!: EditorRef;

keymap.bind({
  "f9": () => editor.run("sortLinesAscending"),
  "mod+shift+u": () => editor.run("transformToUppercase"),
  "mod+alt+0": () => editor.run("foldAll"),
  "mod+alt+j": () => editor.run("unfoldAll"),
});
```

<a id="find-and-replace"></a>

## 検索と置換

`search` は検索対象を指定します（`{ query, caseSensitive?, wholeWord?, regex?, inSelection? }`）。一致箇所はハイライトされ、選択範囲がある一致箇所はより強調されます。`onSearchChange` は `{ result }`（`{ count, current, error }`）を通知します。内容は、一致の件数、選択範囲がある一致箇所（0 始まり）、そして正規表現が無効である場合はその理由です。`findNext` と `findPrevious` は次の一致と前の一致を選択し、端まで来ると反対側に戻ります。`replace(text)` は現在の一致を置換して次の一致を選択し、`replaceAll(text)` はすべての一致を1回の編集として置換して、その件数である `{ count }` を返します。正規表現の置換文字列では、グループを `$1` と `${name}` のように参照します。

`inSelection` は、有効にした時点で選択されていた範囲（何も選択されていなければキャレットのある行）の内部だけを検索します。有効なままの間はその範囲が維持され、編集を経ても、選択範囲が一致から一致へ移動しても変わりません。`findWithSelection`（macOS では `cmd+e`）は、選択中のテキスト、またはキャレット位置の単語を `onFindWithSelection` とともに通知し、検索バーがそれをクエリとして受け取れるようにします。

検索バーはアプリ独自のものです。

```tsx
import { signal, Text, View } from "nsh";
import { Button, Editor, type EditorRef, type EditorSearchResult, Input } from "nsh/base";

function Find(props: { source: string; onChange: (value: string) => void }) {
  let editor!: EditorRef;
  const query = signal("");
  const replacement = signal("");
  const result = signal<EditorSearchResult>({ count: 0 });
  const status = () =>
    result().error ?? (result().current != null ? `${result().current! + 1} of ${result().count}` : `${result().count} found`);
  return (
    <View class="flex-1">
      <View class="flex-row items-center gap-2 border-b border-border p-2">
        <Input value={query()} onChange={({ value }) => query.set(value)} onSubmit={() => editor.run("findNext")} placeholder="Find" class="flex-1" />
        <Text class="text-sm text-muted-foreground">{status()}</Text>
        <Button onPress={() => editor.run("findPrevious")} class="px-2"><Text>↑</Text></Button>
        <Button onPress={() => editor.run("findNext")} class="px-2"><Text>↓</Text></Button>
        <Input value={replacement()} onChange={({ value }) => replacement.set(value)} placeholder="Replace" class="flex-1" />
        <Button onPress={() => editor.replace(replacement())} class="px-2"><Text>Replace</Text></Button>
        <Button onPress={async () => console.log("replaced", (await editor.replaceAll(replacement())).count)} class="px-2"><Text>All</Text></Button>
      </View>
      <Editor
        ref={editor}
        value={props.source}
        onChange={(e) => props.onChange(e.value)}
        language="ts"
        search={query() ? { query: query() } : undefined}
        onSearchChange={(e) => result.set(e.result)}
        class="flex-1"
      />
    </View>
  );
}
```

<a id="diagnostics"></a>

## 診断

`diagnostics` は、言語サーバーやリンターが報告する問題を示します。各範囲の下に、深刻度の色（`error`、`warning`、`info`、`hint`）の細い波線を引きます。位置は言語サーバーと同じく、0 始まりの行と UTF-16 の列で表すため、診断はそのまま受け渡せます。マークは、アプリが新しい診断を渡すまで、ユーザーが入力しても対象のテキストに追従します。メッセージの表示（リストや、行上のホバーカード）はアプリの役割です。

診断は、言語サーバーの `Diagnostic` のそのほかの項目も保持できます。`tags` は、言語クライアントと同様にテキストを描画します。`unnecessary` のコード（未使用の変数、到達不能なコード）は薄く表示され、`deprecated` のコードは取り消し線付きで表示されます。これらは `unnecessaryText` と `deprecatedText` の部分で適用されます。タグを持つヒントは、そのテキストだけが表示されます。`codeDescription.href` はそのコード（リントルールなど）を説明するページで、`relatedInformation` はそれについて説明する他の場所を列挙します（`{ location: { uri?, range }, message }`）。ホバー時に両方がアプリに渡され、アプリはホバーカードに表示し、ページを開きます。言語サーバーはタグを数値（`1`、`2`）で送信しますが、エディターはその名前を受け取ります。

```tsx
const problems = signal<EditorDiagnostic[]>([]);

async function lint(text: string) {
  // [{ range, severity, message, source?, code?, codeDescription?, tags?, relatedInformation? }]
  problems.set(await check(text));
}

<Editor
  value={source()}
  onChange={({ value }) => {
    source.set(value);
    lint(value);
  }}
  language="ts"
  diagnostics={problems()}
  classes={{ diagnosticWarning: "bg-orange-500", unnecessaryText: "text-zinc-400" }}
  class="flex-1"
/>
```

<a id="decorations"></a>

## デコレーション

`decorations` は、アプリが選んだ範囲にスタイルを適用します。たとえば、言語サーバーによるセマンティックハイライト、実行中のステートメント、レビューで変更された行などです。デコレーションの `class` と `style` はそのテキストのスタイルを、`lineClass` と `lineStyle` はテキストの背後にある行のスタイルを指定します。診断と同様に、アプリが新しいデコレーションを設定するまで、編集を経ても対象のテキストに追従します。

```tsx
const range = (line: number, start: number, end: number) => ({ start: { line, column: start }, end: { line, column: end } });

<Editor
  value={source()}
  language="sql"
  readOnly
  decorations={[
    { range: range(4, 0, 0), lineClass: "bg-green-500/10" },
    { range: range(7, 6, 18), class: "underline text-blue-600" },
  ]}
  class="flex-1"
/>
```
<a id="gutter-and-overview-ruler-marks"></a>

### ガターとオーバービュールーラーのマーク

デコレーションの`gutter`は、行番号の手前の帯に、その範囲がカバーするすべての行に沿ってマークを表示します。対象は、バージョン管理の差分で追加または変更された行や、ブレークポイントです(空の範囲はその行をカバーします。`lineClass`の場合と同様です)。`placement: "before"`を指定すると、行が削除された位置、つまり範囲の開始位置の手前の境界に、帯を横切る線として表示されます。帯の幅は`gutterDecorationsWidth`ポイント(デフォルトは3)で、デコレーションにガターマークがある間は維持されるため、マークの出入りでテキストの位置は変わりません。折りたたみ内の範囲は、その折りたたみの行にマークされます。

デコレーションの`overviewRuler`は、オーバービュールーラーにマークを表示します。オーバービュールーラーはエディターの右端に沿った帯で、幅は14ポイント(スクロールバーと同じ幅。`overviewRuler`の部分で別の幅を指定できます)あり、Monaco のものと同様に、テキスト全体をその高さに対応付けます。マークの高さは最低6ポイントで、ルーラーの`lane`を占めます。指定できる値は`left`、`center`(デフォルト)、`right`、`full`です。ルーラーは、そこにマークを持つデコレーションがある間表示されます。

各マークはアプリの`class`と`style`を使用し、これらがない場合は前景色で描画されます。どちらもデコレーションの範囲と同様に編集に追従します。マークされた範囲を削除する編集は、その位置に空の範囲を残します。

```tsx
<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  decorations={[
    { range: range(2, 0, 0), gutter: { class: "bg-yellow-500" }, overviewRuler: { lane: "left", class: "bg-yellow-500" } },
    { range: { start: { line: 3, column: 0 }, end: { line: 5, column: 0 } }, gutter: { class: "bg-green-500" } },
    { range: range(6, 0, 0), gutter: { class: "bg-red-500", placement: "before" }, overviewRuler: { lane: "left", class: "bg-red-500" } },
  ]}
  class="flex-1"
/>
```

<a id="your-own-highlighting"></a>

### 独自のハイライト

デコレーションの`token`は、組み込みのハイライトがその種類のトークンを色付けするのと同じ色でテキストを色付けします(`comment`、`keyword`、`string`、`number`、`title`、`attr`、`built`、`deletion`)。これは、組み込みのハイライターがその位置で見つけた結果の代わりに使われます。アプリ独自のハイライター(言語サーバーのセマンティックトークンや独自のパーサー)が自身のトークンをこれらに対応付けることで、ライトとダークの両方でエディターの色が適用されます。最も内側のデコレーションのトークンが優先され、`class`と`style`はその上に適用されます。`highlighting={false}`は組み込みのハイライターをオフにするため、アプリのトークンだけがテキストを色付けしますが、コメント、括弧、インデントは引き続き`language`が判断します。

```tsx
const kinds: Record<string, EditorToken> = { keyword: "keyword", function: "title", string: "string", type: "built" };

<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  highlighting={false}
  decorations={semanticTokens().map((t) => ({ range: range(t.line, t.start, t.end), token: kinds[t.type] }))}
  class="flex-1"
/>
```

<a id="folding"></a>

## 折りたたみ

折りたたみは、直前の行よりも深くインデントされた行から始まります。`foldRanges`を使うと、代わりにアプリ独自の範囲をエディターに渡せます(`{ startLine, endLine }`。言語サーバーの折りたたみ範囲の形式で、受け取ったままそのまま渡されます)。`startLine`行目に折りたたみが表示され、その後ろから`endLine`までの行が折りたたまれます。これらは、アプリが新しい範囲を渡すまで、編集をまたいでもそれぞれの行に留まります。

折りたたみは入れ子にできます。ブロックを折りたたんでも内側の折りたたみは折りたたまれたままなので、ブロックを展開すると内側は以前の状態で表示されます。`foldRecursive`はブロックとその内側のすべてのブロックを折りたたみ、`unfoldRecursive`はそれらをすべて展開し、`foldLevel(n)`はネストレベル`n`のすべてのブロックを折りたたみ、`foldSelection`(または`foldRange(range)`)は折りたたみの開始位置に関係なく任意の行を折りたたみます。`onFoldChange`は変更のたびに折りたたまれた範囲を通知し、`folds()`と`setFolds(ranges)`はそれらを読み取り・復元するため、ファイルと一緒に保存できます。

```tsx
const ranges = signal<EditorFoldRange[]>([]);
const folded = new Map<string, EditorFoldRange[]>();

<Editor
  ref={editor}
  value={file().text}
  language={file().name}
  foldRanges={ranges()} // from the language server's textDocument/foldingRange
  onFoldChange={({ folds }) => folded.set(file().name, folds)}
  class="flex-1"
/>
<Button onPress={() => editor.foldLevel(2)}><Text>Fold the methods</Text></Button>
```

<a id="breakpoints-and-context-menus"></a>

## ブレークポイントとコンテキストメニュー

行番号を押すと`onLineNumberPress({ line })`が通知されます。アプリがデコレーションとして描画するブレークポイントの設定箇所です。セカンダリボタン(右クリック、Mac では Control キーを押しながらクリック)は`onContextMenu({ position, x, y })`を通知します。これはポインターの下にあるテキスト内の位置とルートビュー内の点で、アプリはここで独自のメニューを開きます。タッチスクリーンでは、長押し、ダブルタップ、ハンドルを離す操作、選択範囲のタップでも同じ通知が行われ、`selection`が付きます。これは、ルートビュー内の選択範囲のボックス(`{ x, y, width, height }`)と、その上端中央の`x`と`y`で、編集メニュー用です。

```tsx
<Editor
  value={source()}
  onContextMenu={({ x, y, selection }) =>
    Menu.popup(selection ? editItems : contextItems, { x, y })
  }
/>
```

```tsx
const breakpoints = signal<number[]>([]);

<Editor
  value={source()}
  language="py"
  onLineNumberPress={({ line }) =>
    breakpoints.set(breakpoints().includes(line) ? breakpoints().filter((l) => l !== line) : [...breakpoints(), line])
  }
  decorations={breakpoints().map((line) => ({ range: range(line, 0, 0), lineClass: "bg-red-500/15" }))}
  class="flex-1"
/>
```

<a id="language-features"></a>

## 言語機能

候補の表示、ホバー情報、定義へ移動、コードアクションは、アプリの言語サーバーから提供されます。エディターは補完リスト、インライン補完、定義リンクを、それぞれのキー操作とともに自分で描画します。それ以外については、エディターがアプリにタイミングと位置を伝え、アプリがポップアップを描画します([`Overlay`](./overlay.md)を`pageBounds`に固定して表示します)。

<a id="completion"></a>

### 補完

`completion`を指定すると、エディターはアプリに候補を問い合わせ、入力中の単語の下(ウィンドウの下端付近では上)にリストとして表示します。

- 単語の末尾で文字、数字、または`_`を入力すると、`onCompletionRequest(event)`、トリガー`"typing"`で問い合わせます。`event`には、`id`、キャレットの`offset`と`position`、`query`(ここまでに入力した単語)、単語の開始位置を示す`queryStart`オフセットが含まれます。`completionTriggerCharacters`(`["."]`、`["::", "<"]`)の各文字は、その直後に空のクエリで、トリガー`"character"`(と`character`)として問い合わせます。`showCompletions()`または`run("showCompletions")`はキャレット位置で、トリガー`"invoked"`として問い合わせます。
- アプリは`presentCompletions(event.id, items)`で応答します。各項目は言語サーバーの`CompletionItem`の形式です。`label`が必須で、任意で`kind`(`"function"`、`"variable"`、`"class"`など)、`detail`、`documentation`、`insertText`、`filterText`、`sortText`、`range`を指定できます。表示されるのは最新のリクエストへの応答で、それより前の応答や、キャレットがすでに離れた単語に対する応答は破棄されます。
- 入力を続けると、リストがその場で絞り込まれます。クエリは各項目の`filterText`(なければラベル)に対し、大文字小文字を区別せず、文字が順番に現れるものとして照合されます。並び順は、クエリで始まる単語が最初、次に最も近い一致、その後`sortText`の順です。一致した文字は強調表示されます。入力が進むたびにエディターに再度問い合わせさせるには、`incomplete: true`(`presentCompletions(id, items, true)`)を渡します。
- 上下キー(および Control+P / Control+N)でリスト内を移動し、Page Up と Page Down で1ページ分移動し、Enter と Tab で確定し、Escape で閉じます。ポインターは項目をマークし、クリック(タッチスクリーンではタップ)で確定します。選択中の項目の`documentation`がリストの横に表示されます。
- 確定すると、項目の`range`(なければクエリ)が、その`insertText`(なければラベル)に置き換えられます。これは元に戻す操作で取り消せる1ステップとして、キャレット位置と、直前に同じテキストがある他のすべてのキャレット位置で行われ、`onCompletionAccept({ item })`が通知されます。
- リストは、キャレットが単語を離れたとき、スペースやその他の句読点を入力したとき、エディターがフォーカスを失ったとき、キャレットがスクロールで表示範囲外に出たときに閉じます。

リストが表示されていない状態で入力が一時停止する(`inlineCompletionDelay`、デフォルトは300ミリ秒)と、インライン補完を問い合わせます。`onInlineCompletionRequest({ id, offset, position })`です。`presentInlineCompletion(id, text)`はキャレット位置に`text`を控えめな色で表示し、Tab で挿入されます。Escape、編集、移動で消去されます。

```tsx
let editor!: EditorRef;

<Editor
  ref={(r) => (editor = r)}
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  completion
  completionTriggerCharacters={["."]}
  onCompletionRequest={async (e) => {
    const items = await server.completion(e.position);
    editor.presentCompletions(e.id, items);
  }}
  onInlineCompletionRequest={async (e) => {
    editor.presentInlineCompletion(e.id, await assistant.suggest(e.offset));
  }}
  class="flex-1"
/>
```

<a id="hovers-and-presses"></a>

### ホバーとプレス

- `onHover(event)`: ボタンを押していない状態でマウスが文字の上にとどまっています(デスクトップとウェブ。ドラッグはテキストを選択します)。`event`には、`position`、UTF-16の`offset`、その単語の`range`、ポインターの`pagePosition`、単語の`pageBounds`、押されている`modifiers`、そこにある`diagnostics`が含まれ、そのメッセージをアプリが表示します。別の単語に移動すると、次のホバーがすぐに通知されます。
- `onHoverEnd()`: マウスが単語やエディターから離れたか、その下でテキストが変更またはスクロールされました。
- `onTextPress(event)`: エディターがキャレットを置いた後に、文字が押されました: `{ position, offset, range, pagePosition, modifiers, clicks }`。
- `caretBounds()`と`rangeBounds(range)`: キャレットと範囲の位置です。`{ bounds, pageBounds }`(エディター内とルートビュー内)。アプリのポップアップがそこに開きます。

```tsx
const hover = signal<EditorHoverEvent | null>(null);

<Editor
  ref={editor}
  value={source()}
  language="ts"
  onHover={(event) => hover.set(event)}
  onHoverEnd={() => hover.set(null)}
  class="flex-1"
/>
<If when={hover()}>
  {(event) => (
    <Overlay anchor={event().pageBounds} placement="top" class="rounded-md border border-border bg-popover p-2">
      <Text>{event().diagnostics.map((d) => d.message).join("\n") || describe(event().range)}</Text>
    </Overlay>
  )}
</If>
```

<a id="go-to-definition-and-code-actions"></a>

### 定義へ移動とコードアクション

Mod(macOS と iOS では Command、それ以外では Control)を押し続けると、コードエディターと同様に、マウスの下の単語がリンクになります。

- Mod を押したまま単語の上にいる場合(マウスがそこにある間に押した場合、または押したままマウスをそこへ動かした場合)、エディターは`onDefinitionRequest(event)`、トリガー`"hover"`で問い合わせます。`event`には、`id`、文字の`position`と`offset`、単語の`range`が含まれます。言語サーバーが定義を見つけたら`presentDefinitionLink(event.id, range)`で応答します。その範囲に下線が引かれ(`definitionLink`の部分)、その上でポインターが手の形になります。リンクは、Mod を離したとき、マウスがリンクから離れたとき、テキストが変更またはスクロールされたとき、または`hideDefinitionLink()`で消えます。表示されるのは最新のリクエストへの応答で、それより前の応答は破棄されます。
- 単語を Mod+クリックすると、トリガー`"press"`で問い合わせます。リンク上ではキャレットは動きません。F12(`goToDefinition`、`run("goToDefinition")`)はキャレット位置の単語について、トリガー`"key"`で問い合わせます。定義への移動はアプリが行います。同じテキスト内であれば`revealPosition`と`setSelections`を使い、別のファイルであればアプリ独自のナビゲーションを使います。
- Mod+.(`showCodeActions`、`run("showCodeActions")`)は`onCodeActionRequest({ range, position, bounds })`を通知します。内容は、プライマリ選択範囲(開始位置が先)、キャレット、そのボックスです。アプリは言語サーバーにアクションを問い合わせ、`bounds.pageBounds`にメニューを表示し(`Menu`(./menu.md)または`Overlay`)、選択されたアクションの編集を`edit(edits)`で適用します。

```tsx
let editor!: EditorRef;

<Editor
  ref={(r) => (editor = r)}
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  onDefinitionRequest={async (e) => {
    const target = await server.definition(e.position);
    if (!target) return;
    if (e.trigger === "hover") editor.presentDefinitionLink(e.id, target.originRange ?? e.range);
    else editor.revealPosition(target.range.start, true);
  }}
  onCodeActionRequest={async (e) => {
    const actions = await server.codeActions(e.range);
    const picked = await choose(actions, e.bounds?.pageBounds);
    if (picked) editor.edit(picked.edits);
  }}
  class="flex-1"
/>
```

<a id="size-and-scrolling"></a>

## サイズとスクロール

`minRows`と/または`maxRows`を指定すると、エディターはテキストに合わせて大きくなります。高さは行数分で、最低でも`minRows`行あり、`maxRows`からはテキストがスクロールします。これはメッセージボックスやノートブックのセルと同様です。指定しない場合はアプリがサイズを決め、`scrollBeyondLastLine`によってテキストを最終行の先までスクロールさせることができます。指定できるのは、最大で1画面分(`true`、デフォルト)、まったくスクロールさせない(`false`)、または行数です。キャレットが移動しても、その周囲の`cursorSurroundingLines`行は表示範囲内に保たれます。選択範囲をエディターの端の外までドラッグするとスクロールが続き、ポインターが遠くへ離れるほど速くなります。

`showWhitespaces`は、スペースごとに`·`を、タブごとに`→`を表示し(`whitespace`の部分)、`rulers`は指定した各桁に線を引きます(`ruler`の部分)。これらは行の長さの目安になります。

```tsx
<Editor
  defaultValue={message()}
  language="markdown"
  minRows={2}
  maxRows={8}
  rulers={[72]}
  showWhitespaces
/>
```

<a id="methods"></a>

## メソッド

`ref={editor}`は、アプリのボタン、メニュー、キー操作から使えるエディターのメソッド(`EditorRef`)を提供します。値を返すメソッド(`value()`、`selections()`、`replaceAll()`、`canUndo()`、`caretBounds()`、`folds()`など)は、JS ではその値の`Promise`を返すため、`await`してください: `const text = await editor.value()`。テキストの末尾を超える行を指定されたメソッド(`fold`、`scrollToLine`、`goToLine`など)は、何も変更せず、メソッド名と行を示す警告をログに出力します。

| メソッド | 説明 |
|---|---|
| `focus()`, `blur()` | フォーカスを取得、または手放します。 |
| `value()` | `Promise<string>`: テキスト。 |
| `setValue(value)` | テキストを置き換えます。元に戻す操作で取り消せる編集として行われます。 |
| `insert(text)` | 各選択範囲に`text`をそのまま入力します(括弧は自動で閉じません)。 |
| `edit(edits)` | `{ range, text }`の置換(現在のテキストの範囲。先の置換と重なるものはスキップされます)を、元に戻す操作で取り消せる1ステップとして適用します。選択範囲は周囲のテキストとともに移動します。コードアクションや整形の編集はここに渡します。 |
| `selections()` | `Promise<EditorSelection[]>`: すべての選択範囲、`{ anchor, head }`、プライマリ(最新)が最後。 |
| `setSelections(selections)` | 選択範囲を設定し(最後のものがプライマリ)、プライマリの選択範囲が見えるようにスクロールします。 |
| `run(command)` | コマンドを実行します。対応するキー操作と同じ動作です([コマンド](#commands))。 |
| `replace(text)` | 現在の一致を置換し、次を選択します。 |
| `replaceAll(text)` | `Promise<EditorReplaceAll>`: すべての一致を1回の編集として置換します。`{ count }`は件数です。 |
| `fold(line)`, `unfold(line)` | 行`line`(0始まり)以下の行を折りたたむ、または展開します。 |
| `foldRecursive(line)`, `unfoldRecursive(line)` | 行`line`の折りたたみとその内側のすべての折りたたみを折りたたむ、またはすべて展開します。 |
| `foldLevel(level)` | ネストレベル`level`(1が最も外側)のすべての折りたたみを折りたたみます。 |
| `foldRange(range)` | 折りたたみの開始位置に関係なく、`range`(`{ startLine, endLine }`)の行を折りたたみます。 |
| `folds()` | `Promise<EditorFoldRange[]>`: 入れ子のものを含む、折りたたまれた範囲。 |
| `setFolds(folds)` | `folds`だけを折りたたみます。 |
| `scrollToLine(line)` | 行`line`が見えるようにスクロールし、それを隠している折りたたみを展開します。 |
| `canUndo()`, `canRedo()` | `Promise<boolean>`: 取り消せる編集、またはやり直せる編集があるかどうか。 |
| `caretBounds()` | `Promise<EditorBounds \| null>`: プライマリキャレットのボックス、`{ bounds, pageBounds }`。エディター内(スクロール適用済み)とルートビュー内の両方。エディターのレイアウト前は`null`。 |
| `rangeBounds(range)` | `Promise<EditorBounds[]>`: `range`のボックス。対象となる行ごとに1つ。 |
| `scrollOffset()`, `setScrollOffset(offset)` | `Promise<Point>`: テキストがどれだけスクロールされているか。`{ x, y }`までスクロールします。 |
| `visibleRange()` | `Promise<EditorRange>`: ビューポートに表示されているテキスト。最初の行の先頭から最後の行の末尾まで。 |
| `selectedText()` | `Promise<string>`: プライマリ選択範囲のテキスト。 |
| `offsetToPosition(offset)`, `positionToOffset(position)` | `Promise<EditorPosition>`, `Promise<number>`: `value()`のUTF-16オフセットと位置の間の変換。 |
| `revealPosition(position, center)` | `position`が見えるようにスクロールし、それを隠している折りたたみを展開します。`center`を指定すると中央に表示します。 |
| `goToLine(line)` | キャレットを行`line`(0始まり)の先頭に置き、中央にスクロールします。 |
| `showCompletions()` | キャレット位置での補完を問い合わせます。直前の単語がクエリになります([補完](#completion))。 |
| `presentCompletions(id, items, incomplete?)` | 補完リクエスト`id`に応答します。リストには`items`が表示され、その後に入力された内容で絞り込まれます。`incomplete`を指定すると、入力を続けるたびに再度問い合わせます。項目がない場合はリストを閉じます。 |
| `hideCompletions()` | 補完リストを閉じます。 |
| `presentInlineCompletion(id, text)`, `hideInlineCompletion()` | インライン補完リクエスト`id`に`text`で応答し、キャレット位置に表示します。または消去します。 |
| `presentDefinitionLink(id, range)`, `hideDefinitionLink()` | 定義リクエスト`id`(トリガー`"hover"`)に応答します。`range`がリンクとして下線表示されます([定義へ移動](#go-to-definition-and-code-actions))。または非表示にします。 |

```tsx
let editor!: EditorRef;

<Button onPress={() => editor.run("toggleComment")}><Text>Comment</Text></Button>
<Button onPress={async () => save(await editor.value())}><Text>Save</Text></Button>
<Button onPress={async () => (await editor.canUndo()) && editor.run("undo")}><Text>Undo</Text></Button>
<Button onPress={() => editor.setSelections([{ anchor: { line: 0, column: 0 }, head: { line: 0, column: 0 } }])}>
  <Text>Go to the top</Text>
</Button>
<Editor ref={editor} value={source()} onChange={({ value }) => source.set(value)} language="rs" class="flex-1" />
```
<a id="commands"></a>

### コマンド

`run` はエディタのコマンドを名前で受け取ります（`EditorCommand`）:

| コマンド | 内容 |
|---|---|
| `moveLeft`, `moveRight`, `moveUp`, `moveDown`, `moveWordLeft`, `moveWordRight`, `moveLineStart`, `moveLineEnd`, `movePageUp`, `movePageDown`, `moveDocumentStart`, `moveDocumentEnd` | キャレットを移動します。 |
| `selectLeft`, `selectRight`, `selectUp`, `selectDown`, `selectWordLeft`, `selectWordRight`, `selectLineStart`, `selectLineEnd`, `selectPageUp`, `selectPageDown`, `selectDocumentStart`, `selectDocumentEnd` | 選択範囲を拡張します。 |
| `moveToMatchingBracket` | キャレット位置の括弧に対応する括弧へ移動します。 |
| `selectAll`, `selectLine`, `selectWord`, `selectNextOccurrence`, `selectPreviousOccurrence`, `selectAllOccurrences` | 選択します。 |
| `moveSubwordLeft`, `moveSubwordRight`, `selectSubwordLeft`, `selectSubwordRight` | 単語の一部（camelCase の山、snake_case の区切り）単位で移動または拡張します。 |
| `moveParagraphUp`, `moveParagraphDown`, `selectParagraphUp`, `selectParagraphDown` | 段落の前後の空行まで移動または拡張します。 |
| `expandSelection`, `shrinkSelection` | 選択範囲を一段階広げる、または戻します。 |
| `undoSelection`, `redoSelection` | 直前の移動前の選択に戻る、または再び進みます。 |
| `splitSelectionIntoLines` | 各選択範囲を行ごとに 1 つの選択に分割します。 |
| `addCaretAbove`, `addCaretBelow`, `singleSelection` | キャレットを追加します。単一の選択に戻します。 |
| `deleteBackward`, `deleteForward`, `deleteWordLeft`, `deleteWordRight`, `deleteToLineStart`, `deleteToLineEnd`, `deleteLine` | 削除します。 |
| `newline`, `newlineBelow`, `newlineAbove`, `indent`, `outdent`, `toggleComment`, `toggleBlockComment` | 行、インデント、コメントを操作します。 |
| `sortLinesAscending`, `sortLinesDescending` | 選択した行を並べ替えます（キャレットのみの場合はすべての行）。 |
| `transformToUppercase`, `transformToLowercase`, `transformToTitleCase` | 選択範囲の大文字・小文字を変更します（キャレットの場合はその単語）。 |
| `trimTrailingWhitespace` | すべての行末の空白を削除します。 |
| `moveLinesUp`, `moveLinesDown`, `duplicateLinesUp`, `duplicateLinesDown`, `joinLines`, `transposeCharacters` | 並べ替えます。 |
| `undo`, `redo` | 元に戻す、やり直す。 |
| `fold`, `unfold`, `foldAll`, `unfoldAll` | キャレットの行、またはすべてを折りたたみます。 |
| `foldRecursive`, `unfoldRecursive` | キャレット位置の折りたたみとその内側のすべての折りたたみを折りたたむ、または展開します。 |
| `foldSelection` | 複数行にまたがる各選択範囲の行を折りたたみます。 |
| `findNext`, `findPrevious` | `search` の次または前の一致を選択します。 |
| `findWithSelection` | 検索バー用に選択テキストを通知します（`onFindWithSelection`）。 |
| `copy`, `cut`, `paste` | クリップボード。 |
| `showCompletions` | キャレット位置で補完を要求します（[補完](#completion)）。 |
| `goToDefinition` | キャレット位置の単語の定義を要求します（`onDefinitionRequest`、トリガー `"key"`）。 |
| `showCodeActions` | 選択範囲に対するコードアクションを要求します（`onCodeActionRequest`）。 |

<a id="styling-the-parts"></a>

## パーツのスタイル

`class` と `style` はエディタのボックスをスタイルします。`classes` はパーツごとの Tailwind クラスを、`styles` はパーツごとのインラインスタイルを受け取ります。パーツのクラスはそのパーツ自身のデフォルトスタイルの後に適用されるため優先され、その `styles` はクラスよりも優先されます。フォントは `fontFamily`、`fontSize`、`lineHeight` で設定し、エディタはこのフォントでテキストを測定します。

```tsx
<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="tsx"
  fontFamily="JetBrains Mono"
  fontSize={14}
  lineHeight={22}
  class="flex-1 rounded-lg border border-border"
  classes={{
    gutter: "bg-muted",
    lineNumber: "text-xs",
    activeLine: "bg-yellow-500/10",
    selection: "bg-blue-500/30",
  }}
  styles={{ caret: { backgroundColor: "#f59e0b", width: 3 } }}
/>
```

| パーツ | 内容 | デフォルト |
|---|---|---|
| `gutter` | 行番号と折りたたみマーカーの列 | 番号の前に 12pt、マーカーの後に 4pt |
| `lineNumber` | すべての行番号 | 右揃え、`muted-foreground` |
| `activeLineNumber` | キャレットがある行の番号、`lineNumber` の後に適用 | `foreground` |
| `foldMarker` | 折りたたみが始まる行のマーカー | `⌄`、折りたたみ時は `›`、`muted-foreground` |
| `overviewRuler` | 右端のオーバービュールーラー。デコレーションの印がある間のみ表示 | なし |
| `content` | ガターの隣のテキスト領域 | テキストの前に 4pt |
| `line` | テキストのすべての行 | |
| `activeLine` | キャレットがある行の背面、スクロールインジケーターの下 | `muted`、薄い色 |
| `selection` | 選択されたテキストの背面 | `primary` の色合い |
| `caret` | キャレット | 幅 2pt、`foreground`、点滅 |
| `composition` | 入力メソッドが変換中のテキスト | 下線付き |
| `searchMatch` | `search` の一致箇所 | 半透明のアンバー |
| `currentSearchMatch` | 選択が重なっている一致箇所、`searchMatch` の後に適用 | より濃いアンバー |
| `matchingBracket` | キャレット位置の括弧とその対応する括弧 | 1pt の枠線 |
| `indentGuide` | インデントレベルごとのガイド | `border` の 1pt の線 |
| `foldPlaceholder` | 折りたたまれた行がテキストの後に表示するもの | ` ⋯ `、`muted-foreground` |
| `placeholder` | テキストが空のときに表示されるもの | `muted-foreground` |
| `diagnosticError` | エラーの下の線 | `destructive` |
| `diagnosticWarning` | 警告の下の線 | アンバー |
| `diagnosticInfo` | 情報の下の線 | 青 |
| `diagnosticHint` | ヒントの下の線 | `muted-foreground` |
| `unnecessaryText` | `unnecessary` 診断のテキスト | `muted-foreground` |
| `deprecatedText` | `deprecated` 診断のテキスト | 取り消し線 |
| `whitespace` | スペースとタブの印（`showWhitespaces`） | `·` と `→`、`muted-foreground` の 60 % |
| `ruler` | `rulers` の線 | `border` の 1pt の線 |
| `selectionHandle` | タッチ選択の両端にあるハンドルのつまみ | `primary` の 10pt のドット |
| `selectionHandleStart`, `selectionHandleEnd` | 開始側のつまみ（その行の上）と終了側のつまみ（下）、`selectionHandle` の後に適用 | |
| `completionMenu` | 補完リストのボックス | `popover`、1pt の `border`、角丸、影 |
| `completionItem` | リストのすべての項目 | 1 行の高さ、8pt のパディング |
| `selectedCompletionItem` | 選択中の項目、`completionItem` の後に適用 | `accent` |
| `completionMatch` | クエリに一致したラベルの文字 | セミボールド、`primary` |
| `completionDetail` | 項目の詳細、ラベルの後 | 右揃え、`muted-foreground` |
| `completionKind` | 項目の種類、ラベルの前 | 短い名前（`fn`、`var`、`cls`）、`muted-foreground` |
| `completionDocumentation` | 選択中の項目のドキュメント、リストの横 | `completionMenu` と同じ、幅は最大 320pt |
| `inlineCompletion` | キャレット位置のインライン補完 | `muted-foreground` |
| `definitionLink` | 定義リンクの下線 | テキストの下に `primary` の 1pt の線 |

<a id="props"></a>

## プロパティ

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | アプリが制御するテキスト（`onChange` から再度設定します）。 |
| `defaultValue` | `.default_value(..)` | `string` | | エディタが自身でテキストを保持する場合の初期テキスト。 |
| `language` | `.language(..)` | `string` | プレーンテキスト | 言語の名前、エイリアス、拡張子、またはファイル名（[言語](#languages)）。 |
| `placeholder` | `.placeholder(..)` | `string` | | テキストが空のときに表示されます。 |
| `readOnly` | `.read_only(..)` | `boolean` | `false` | テキストは選択とコピーのみ可能で、変更はできません。 |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | 表示されたときにフォーカスを受け取ります。 |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | ガターの行番号。 |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | 長い行をエディタの幅で折り返します。 |
| `tabSize` | `.tab_size(..)` | `number` | 言語の設定 | タブおよびインデント 1 レベルの桁数。 |
| `hardTabs` | `.hard_tabs(..)` | `boolean` | 言語の設定 | タブでインデントします。 |
| `folding` | `.folding(..)` | `boolean` | `true` | インデントされた行をガターのマーカーで折りたためます。 |
| `foldRanges` | `.fold_ranges(..)` | `EditorFoldRange[]` | インデントによる | 折りたたみの開始位置。アプリが指定します（[折りたたみ](#folding)）。 |
| `highlighting` | `.highlighting(..)` | `boolean` | `true` | 組み込みのシンタックスハイライト（[独自のハイライト](#your-own-highlighting)）。 |
| `autoClose` | `.auto_close(..)` | `boolean` | `true` | 括弧と引用符を入力時に自動で閉じます。 |
| `autoIndent` | `.auto_indent(..)` | `boolean` | `true` | 改行時にインデントを維持し、開き括弧の後ではインデントを増やします。 |
| `activeLine` | `.active_line(..)` | `boolean` | `true` | キャレットがある行をハイライトします。 |
| `indentGuides` | `.indent_guides(..)` | `boolean` | `true` | インデントのガイド。 |
| `scrollBeyondLastLine` | `.scroll_beyond_last_line(..)` | `boolean \| number` | `true` | 最終行より先までテキストをスクロールできます。最大 1 画面分（`true`）、まったくスクロールしない（`false`）、または指定した行数分。 |
| `fontFamily` | `.font_family(..)` | `string` | テーマの `font-mono` | テキストの描画と測定に使うフォント。 |
| `fontSize` | `.font_size(..)` | `number` | `13` | フォントサイズ（ポイント）。 |
| `lineHeight` | `.line_height(..)` | `number` | `20` | 1 行の高さ（ポイント）。 |
| `search` | `.search(..)` | `EditorSearch` | | 検索する内容（[検索と置換](#find-and-replace)）。 |
| `diagnostics` | `.diagnostics(..)` | `EditorDiagnostic[]` | `[]` | マークする問題（[診断](#diagnostics)）。 |
| `decorations` | `.decorations(..)` | `EditorDecoration[]` | `[]` | アプリがスタイルを指定する範囲（[デコレーション](#decorations)）。 |
| `gutterDecorationsWidth` | `.gutter_decorations_width(..)` | `number` | `3` | ガターにあるデコレーションの印の領域の幅（ポイント）。 |
| `classes` | `.classes(..)` | `EditorClasses` | `{}` | パーツごとの Tailwind クラス。 |
| `styles` | `.styles(..)` | `EditorStyles` | `{}` | クラスより優先される、パーツごとのインラインスタイル。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | | スクリーンリーダーがエディタを呼ぶ名前。 |
| `showWhitespaces` | `.show_whitespaces(..)` | `boolean` | `false` | スペースとタブを `·` と `→` で表示します。 |
| `rulers` | `.rulers(..)` | `number[]` | `[]` | 縦線を描画する桁位置。 |
| `minRows` | `.min_rows(..)` | `number` | | エディタはテキストに合わせて、この行数から拡大します（[サイズとスクロール](#size-and-scrolling)）。 |
| `maxRows` | `.max_rows(..)` | `number` | | エディタはテキストに合わせて、この行数まで拡大し、それを超えるとスクロールします。 |
| `cursorSurroundingLines` | `.cursor_surrounding_lines(..)` | `number` | `1` | キャレットの上下に表示したままにする行数。 |
| `completion` | `.completion(..)` | `boolean` | `false` | エディタが候補を要求し、リストとして表示します（[補完](#completion)）。 |
| `completionTriggerCharacters` | `.completion_trigger_characters(..)` | `string[]` | `[]` | 入力中に補完を要求するその他のトリガー。 |
| `inlineCompletionDelay` | `.inline_completion_delay(..)` | `number` | `300` | インライン補完を要求するまでの入力の中断時間（ミリ秒）。 |
| `class`, `style` | スタイルメソッド | `string`, `StyleProp<ViewStyle>` | | エディタのボックス。 |

<a id="events"></a>

## イベント

| イベント | Rust | 説明 |
|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | テキストが変更されました: `{ value }`、変更後のテキスト全体。 |
| `onSelectionChange` | `.on_selection_change(\|selections: &Vec<EditorSelection>\| ..)` | 選択が変更されました: `{ selections }`、すべての選択（プライマリが最後）。 |
| `onFocus`, `onBlur` | `.on_focus(\|\| ..)`, `.on_blur(\|\| ..)` | エディタがフォーカスを得た、または失いました。 |
| `onSearchChange` | `.on_search_change(\|result: &EditorSearchResult\| ..)` | 検索の一致が変更されました: `{ result }`、`{ count, current, error }`。 |
| `onLineNumberPress` | `.on_line_number_press(\|line: &u32\| ..)` | 行番号が押されました: `{ line }`、0 から始まる行番号。 |
| `onContextMenu` | `.on_context_menu(\|event: &EditorContextMenuEvent\| ..)` | テキスト上でセカンダリボタンが押された、またはタッチでテキストが選択されました: `{ position, x, y, selection? }`。 |
| `onHover` | `.on_hover(\|event: &EditorHoverEvent\| ..)` | マウスが文字の上で止まっています（[言語機能](#language-features)）。 |
| `onHoverEnd` | `.on_hover_end(\|\| ..)` | ホバーが終了しました。 |
| `onTextPress` | `.on_text_press(\|event: &EditorTextPressEvent\| ..)` | 文字が押されました: その単語、修飾キー、クリック数とともに通知されます。 |
| `onFindWithSelection` | `.on_find_with_selection(\|query: &String\| ..)` | `findWithSelection` が実行されました: `{ query }`、検索バーのクエリ用のテキスト。 |
| `onFoldChange` | `.on_fold_change(\|folds: &Vec<EditorFoldRange>\| ..)` | 折りたたまれた範囲が変更されました: `{ folds }`、入れ子を含むすべての範囲。 |
| `onCompletionRequest` | `.on_completion_request(\|event: &EditorCompletionRequest\| ..)` | エディタが補完を要求しています: `{ id, offset, position, query, queryStart, trigger, character? }`（[補完](#completion)）。 |
| `onCompletionAccept` | `.on_completion_accept(\|event: &EditorCompletionAcceptEvent\| ..)` | 項目が受け入れられ、挿入されました: `{ item }`。 |
| `onInlineCompletionRequest` | `.on_inline_completion_request(\|event: &EditorInlineCompletionRequest\| ..)` | 入力が中断されました: `{ id, offset, position }`、インライン補完用。 |
| `onDefinitionRequest` | `.on_definition_request(\|event: &EditorDefinitionRequest\| ..)` | エディタが定義を要求しています: `{ id, position, offset, range, trigger }`（[定義へ移動](#go-to-definition-and-code-actions)）。 |
| `onCodeActionRequest` | `.on_code_action_request(\|event: &EditorCodeActionRequest\| ..)` | ユーザーがコードアクションを要求しました: `{ range, position, bounds? }`。 |

<a id="accessibility"></a>

## アクセシビリティ

スクリーンリーダーは、エディタを `accessibilityLabel` で呼びます。フォーカスはテキスト入力と同じ扱いのため、プラットフォームのテキストサービス（入力メソッド、音声入力、ソフトウェアキーボード）が利用できます。

<a id="related"></a>

## 関連項目

- [TextView](./text-view.md): Markdown と HTML のドキュメント。コードブロックはエディタと同じシンタックスカラーを共有します。
- [DiffView](./diff-view.md): 2 つのテキスト間の変更を、エディタのシンタックスカラーで表示します。
- [Input](./input.md): プラットフォーム標準の編集機能を備えた、単一行および複数行のテキストフィールド。
- [`keymap`](../modules/nsh.md#keymap): エディタのコマンドに対するアプリのキー割り当て。
- [`nsh/base`](../modules/nsh-base.md): その他の基本コンポーネント。
