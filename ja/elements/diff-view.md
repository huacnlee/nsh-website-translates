---
title: "DiffView"
description: "DiffView コンポーネント: 2 つのテキスト間、またはパッチの変更内容を、サイド・バイ・サイドまたは統一表示で表示します。行内で変更された単語のハイライト、展開可能なセパレータへの未変更行の折りたたみ、シンタックスハイライト、ソフトラップ、変更ごとのアクション、行の選択、レビュー用注釈に対応しています。"
group: base
demo: el-diff-view
source_hash: 2004ab3c0d854626
---

# DiffView

`DiffView` は、コードレビューツールのように2つのテキストの差分を表示します。表示形式は、古いテキストを左、新しいテキストを右に行を揃えて並べる左右分割(side by side)か、削除行を追加行の上に表示する unified のどちらかです。変更された行では変更された単語がハイライトされ、変更と変更の間の未変更行は展開できるセパレーターに折りたたまれ、テキストは [`Editor`](./editor.md) のシンタックスカラーでハイライトされます。2つのテキスト(`oldValue` と `newValue`)、または unified diff のファイル群(`patch`: `git diff` のもの、プルリクエストのもの)を、それぞれのヘッダーの下に表示します。変更のレビュー、特に AI が提案した編集のレビューを目的としており、各変更に対するアプリのアクションで、その変更を残すか元に戻すかを選べます。表示範囲内の行だけが生成されるため、長いファイルも短いファイルと同じようにスクロールできます。

`DiffView` は動作を担い、テーマのトークンから作られた独自の外観を備えています。テーマの `font-mono` を 20pt の行に 13pt で表示し、行番号は `muted-foreground`、追加行は緑、削除行は赤で色付けし、変更された単語はより濃い色で示し、変更された各行のガターの端にバーを表示し、セパレーターは `muted` に表示します。各パーツは、これらのデフォルトの上にアプリのスタイルを適用します(`classes` と `styles`)。Rust では `nsh_base::diff_view()` で、TSX では `nsh/base` の `<DiffView>` で作成します。

```rust tabs
use nsh_base::diff_view;
use nsh_core::prelude::*;

const OLD: &str = "fn total(prices: &[u32]) -> u32 {\n    prices.iter().sum()\n}\n";
const NEW: &str = "fn total(prices: &[u64]) -> u64 {\n    prices.iter().copied().sum()\n}\n";

fn review() -> impl IntoElement {
    diff_view().old_value(OLD).new_value(NEW).language("rust").flex_1()
}
```

```tsx tabs
import { mount } from "nsh";
import { DiffView } from "nsh/base";

const OLD = `fn total(prices: &[u32]) -> u32 {
    prices.iter().sum()
}
`;
const NEW = `fn total(prices: &[u64]) -> u64 {
    prices.iter().copied().sum()
}
`;

function App() {
  return <DiffView oldValue={OLD} newValue={NEW} language="rust" class="flex-1" />;
}

mount(App);
```

ビューはアプリから与えられたボックス(`flex-1`、高さ)を埋め、その内部でスクロールします。縦方向には行をスクロールし、横方向には最も長い行までスクロールします。左右分割ビューでは両側が一緒にスクロールします。`softWrap` を指定すると、長い行は折り返されずに各側の幅で折り返され、左右分割の行は高い方の側の高さになるため、両側の位置は揃ったままです。

<a id="two-texts-or-a-patch"></a>

## 2つのテキストまたはパッチ

- **2つのテキスト**: `oldValue` と `newValue`。行はそのまま比較されるため、末尾の改行の追加や削除も、git と同じく変更として扱われます。
- **パッチ**: `patch`。1つまたは複数のファイルの unified diff です(`git diff`、`git format-patch`、`diff -u`。リネーム、モード、新規ファイル、削除されたファイル、バイナリファイル、先頭のコミットメッセージは、git が出力する形式で読み取られます)。ビューにはハンクの行がファイル内の行番号付きで表示され、各ハンクはそのヘッダー(含まれる関数)のセパレーターの下に置かれ、複数ファイルの場合は各ファイルが専用のヘッダーの下に置かれます([Files of a patch](#files-of-a-patch))。`language` が設定されていない場合、各ファイルのパスから言語が決まります。

```tsx
const PATCH = `diff --git a/src/total.rs b/src/total.rs
--- a/src/total.rs
+++ b/src/total.rs
@@ -10,3 +10,3 @@ impl Cart {
-    fn total(&self) -> u32 {
+    fn total(&self) -> u64 {
         self.prices.iter().sum()
     }
`;

<DiffView patch={PATCH} layout="unified" class="flex-1" />
```

`language` は、`Editor` と同様に、名前、エイリアス、拡張子、ファイル名のいずれかで言語を指定します(`"rust"`、`"tsx"`、`"main.go"`、`"Dockerfile"`)。

## Files of a patch

複数ファイルのパッチでは、各ファイルがヘッダー行の下に表示されます。デフォルトでは、パス(リネームされた場合は `old → new`)、追加行数と削除行数、`▾` が表示され、押すとそのファイルはヘッダーだけに折りたたまれ(`▸`)、もう一度押すと展開されます。`renderFileHeader` はヘッダーをアプリ独自の方法で描画します(1ファイルのパッチでも上に1つ表示されます)。ファイルの情報(`DiffFile`)として、`index`、`path`、`oldPath`(リネーム元またはコピー元)、`status`(`"modified"`、`"added"`、`"deleted"`、`"renamed"`、`"copied"`)、`binary`(パッチにそのファイルの行が含まれない場合)、`added`、`deleted`、`hunks`、`firstHunk`、`collapsed` が渡されます。アプリのヘッダーは ref の `toggleFile(path)` を呼び出します。状態は `collapseFile` と `expandFile` で設定し、すべての変更は `onFileToggle({ file })` で通知されます。折りたたまれたファイルは、新しい `patch` にそのファイルが含まれている間は折りたたまれたままです。

変更はファイルをまたいで順番に数えられます。ファイルの変更は `firstHunk` から `firstHunk + hunks - 1` までで、`goToHunk`、`renderHunkActions`、`hunks()` がこれを使います(`DiffHunk` の `file` はそのファイルのインデックスで、行はそのファイル内で数えられます)。`stats()` はすべてのファイルの変更数を合計します。`goToHunk` は、折りたたまれたファイルを先に展開します。

```tsx
let diff!: DiffViewRef;
const files = signal<DiffFile[]>([]);

<View class="flex-1 flex-row">
  <View class="w-48">
    <Each of={files()}>
      {(file) => (
        <Button onPress={() => diff.scrollToFile(file().path)} class="px-2 py-1">
          <Text class="text-sm">{file().path} +{file().added} −{file().deleted}</Text>
        </Button>
      )}
    </Each>
  </View>
  <DiffView
    ref={(r) => {
      diff = r;
      r.files().then((list) => files.set(list));
    }}
    patch={PULL_REQUEST}
    renderFileHeader={(file) => (
      <Button onPress={() => diff.toggleFile(file.path)} class="flex-1 flex-row items-center gap-2 bg-muted px-2">
        <Text>{file.collapsed ? "▸" : "▾"}</Text>
        <Text class="flex-1 text-sm font-medium">{file.oldPath ? `${file.oldPath} → ${file.path}` : file.path}</Text>
        <Text class="text-xs text-muted-foreground">{file.binary ? "Binary" : file.status}</Text>
      </Button>
    )}
    class="flex-1"
  />
</View>
```

## Layout and inline changes

`layout` は `"split"`(デフォルト。左右分割で、各削除行は最も似ている追加行の隣に表示されます)または `"unified"`(1列。変更の削除行が追加行の上に並び、両方の行番号が表示されます)です。`inline` は、変更された行の中で何をハイライトするかを決めます。

| `inline` | ハイライトされるもの |
|---|---|
| `"wordAlt"`(デフォルト) | 変更された単語。1文字だけ離れている場合は結合されるため、変更されたフレーズが1つにまとまって見えます |
| `"word"` | 変更された各単語 |
| `"char"` | 変更された各文字 |
| `"none"` | なし。行の色付けのみ |

単語とは、文字、数字、`_` の連続です。CJK の各文字、かな、ハングルの音節はそれぞれ1つの単語として扱われるため、文中の1文字が変更されても、その文字だけがマークされます。ほぼ全体が変更された行では、行の色付けのみが表示されます。

`indicators` は、変更された行を行番号の横にマークします。`"bars"`(デフォルト。ガターの端のバー)、`"classic"`(テキストの前に `+` と `−`)、または `"none"` を指定できます。`background={false}` を指定すると変更された行は色付けされず、`lineNumbers={false}` を指定すると行番号が非表示になります。

```tsx
<DiffView oldValue={before()} newValue={after()} language="md" layout="unified" inline="word" indicators="classic" class="flex-1" />
```

## Collapsed lines

各変更の前後には `contextLines` 行の未変更行が表示されます(デフォルトは3)。変更と変更の間、および最初の変更の前と最後の変更の後の未変更行は、隠れている行数を示すセパレーターに折りたたまれます。セパレーターを押すと、すべての行が表示されます。`expandAll` はすべての行を表示します。ref の `expand`、`expandAll()`、`collapseAll()` を使うと、アプリから行の展開と折りたたみができます。

`renderSeparator` はセパレーターをアプリ独自の方法で描画します。セパレーター(`DiffSeparator`)として、`gap`、折りたたまれた範囲のインデックス(最初の変更の前は 0、変更 `i - 1` と `i` の間は `i`)、`lines`(隠れている行数)、`first`、`last`、パッチの場合はハンクの `header` が渡されます。`expand(gap, direction, lines)` は、`"all"` で隠れている行をすべて表示する(デフォルト)か、`lines`(デフォルトは 20)行を `"up"` でセパレーターの下の変更のすぐ上に表示するか、`"down"` でセパレーターの上の変更のすぐ下に表示します。最初のセパレーターは上方向に、最後のセパレーターは下方向に展開されます。

```tsx
let diff!: DiffViewRef;

<DiffView
  ref={diff}
  oldValue={before()}
  newValue={after()}
  language="ts"
  renderSeparator={(sep) => (
    <View class="flex-1 flex-row items-center gap-1 bg-muted px-2">
      <If when={!sep.first}>
        <Button onPress={() => diff.expand(sep.gap, "down")} class="px-1"><Text>↓</Text></Button>
      </If>
      <If when={!sep.last}>
        <Button onPress={() => diff.expand(sep.gap, "up")} class="px-1"><Text>↑</Text></Button>
      </If>
      <Button onPress={() => diff.expand(sep.gap)} class="flex-1">
        <Text class="text-xs text-muted-foreground">{sep.header ?? `${sep.lines} unchanged lines`}</Text>
      </Button>
    </View>
  )}
  class="flex-1"
/>
```

## Keeping and reverting changes

`renderHunkActions` は、表示範囲内の各変更の右上にアプリのアクションを配置し、変更の情報(`DiffHunk`: `index`、`oldStart`、`oldLines`、`newStart`、`newLines`(0 から始まる行)、パッチの場合はそのファイルのインデックスである `file`)を渡します。アクションは ref を呼び出します。`revertHunk(index)` は変更の古い行を新しいテキストに戻し、`acceptHunk(index)` は変更の新しい行を古いテキストにします。ビューは結果をすぐに表示し、両方のテキストを `onChange({ change })`(`{ oldValue, newValue }`)で通知します。アプリはこれを props として設定します。AI の編集を1つずつ残すか元に戻すかは、次のように行います。

```tsx
import { signal, Text, View } from "nsh";
import { Button, DiffView, type DiffViewRef } from "nsh/base";

function Proposal(props: { file: string; current: string; proposed: string; onApply: (text: string) => void }) {
  let diff!: DiffViewRef;
  const current = signal(props.current);
  const proposed = signal(props.proposed);
  return (
    <View class="flex-1">
      <DiffView
        ref={diff}
        oldValue={current()}
        newValue={proposed()}
        language={props.file}
        onChange={({ change: { oldValue, newValue } }) => {
          current.set(oldValue);
          proposed.set(newValue);
          props.onApply(oldValue);
        }}
        renderHunkActions={(hunk) => (
          <View class="flex-row gap-1">
            <Button onPress={() => diff.revertHunk(hunk.index)} class="rounded bg-background px-2 py-0.5 border border-border">
              <Text class="text-xs">Revert</Text>
            </Button>
            <Button onPress={() => diff.acceptHunk(hunk.index)} class="rounded bg-primary px-2 py-0.5">
              <Text class="text-xs text-primary-foreground">Keep</Text>
            </Button>
          </View>
        )}
        class="flex-1"
      />
    </View>
  );
}
```

ここでは古いテキストが現状のファイルであるため、変更を残すとファイルに適用され(`onApply`)、元に戻すと提案から取り除かれます。`patch` を表示しているビューはファイルの抜粋を表示するため、その変更はそのまま残ります。

## Methods

`ref={diff}` は、ビューのメソッド(`DiffViewRef`)を提供します。値を返すメソッド(`hunks()`、`stats()`)は JS ではその値の `Promise` を返すため、`await` します: `const changes = await diff.hunks()`。画面に表示する件数については、`onStatsChange` が変化に応じて通知します。diff に存在しない変更、セパレーター、ファイルを渡したメソッドは何も変更せず、メソッド名と値を示す警告をログに出力します。

| メソッド | 説明 |
|---|---|
| `hunks()` | `Promise<DiffHunk[]>`: 変更を順番に返します。 |
| `stats()` | `Promise<DiffStats>`: `{ added, deleted, hunks }`、追加行数と削除行数、変更の数。 |
| `goToHunk(index)` | 変更 `index` を、その最初の行を先頭にして表示範囲へスクロールします。 |
| `revertHunk(index)` | 変更 `index` の古い行を新しいテキストに戻し、テキストを通知します(`onChange`)。 |
| `acceptHunk(index)` | 変更 `index` の新しい行を古いテキストにし、テキストを通知します(`onChange`)。 |
| `expand(gap, direction?, lines?)` | セパレーター `gap` が隠している行を表示します: `"all"`(デフォルト)、または `lines`(デフォルトは 20)行を `"up"` または `"down"`。 |
| `expandAll()` | すべての未変更行を表示します。 |
| `collapseAll()` | 未変更行を再び折りたたみます。 |
| `nextHunk()` | `Promise<number \| null>`: 次の変更を先頭にスクロールし、そのインデックスを返します(最後の次は最初)。 |
| `previousHunk()` | `Promise<number \| null>`: 前の変更を先頭にスクロールし、そのインデックスを返します(最初の前は最後)。 |
| `currentHunk()` | `Promise<number \| null>`: ビューがその位置にとどまっている間は最後に移動した変更、そうでなければビューの先頭にある変更、または表示範囲内の最初の変更。 |
| `selectedLines()` | `Promise<DiffLineRange \| null>`: 行番号で選択された行。 |
| `setSelectedLines(range)` | 片側の行を選択します(`null`: 選択なし)。`onLineSelectionChange` は発生しません。 |
| `selectedText()` | `Promise<string>`: 選択された行のテキスト。 |
| `files()` | `Promise<DiffFile[]>`: パッチのファイルを順番に、それぞれの件数とともに返します(2つのテキストの場合はなし)。 |
| `scrollToFile(path)` | `path` のファイルのヘッダーを先頭にスクロールします。 |
| `collapseFile(path)` | `path` のファイルのヘッダーだけを表示します。 |
| `expandFile(path)` | `path` のファイルの行を再び表示します。 |
| `toggleFile(path)` | `path` のファイルを折りたたみ、折りたたまれている場合は展開します。 |
| `hunkBounds()` | `Promise<DiffHunkBounds[]>`: 各変更の行内での位置を順番に返します([An overview ruler](#an-overview-ruler))。 |
| `scrollOffset()` | `Promise<Point>`: 行がどこまでスクロールされているか(`x` は 0)。 |
| `setScrollOffset(offset)` | 行を `offset.y` まで可能な範囲で即座にスクロールします。ドラッグ中のサムがポインターに追従するのと同じ動作です。 |

`nextHunk()` と `previousHunk()` は、ビューがその位置にとどまっている間は移動先の変更から、そうでなければビューの先頭から続けるため、先頭までスクロールできない末尾付近の変更も数に含まれます。次の変更と前の変更のボタンと、`onStatsChange` からの件数は次のとおりです。

```tsx
let diff!: DiffViewRef;
const stats = signal<DiffStats>({ added: 0, deleted: 0, hunks: 0 });

<View class="flex-row items-center gap-2 p-2">
  <Text class="text-sm text-green-600">+{stats().added}</Text>
  <Text class="text-sm text-red-600">−{stats().deleted}</Text>
  <Text class="text-sm text-muted-foreground">{stats().hunks} changes</Text>
  <Button onPress={() => diff.previousHunk()}><Text>Previous</Text></Button>
  <Button onPress={() => diff.nextHunk()}><Text>Next</Text></Button>
</View>
<DiffView ref={diff} oldValue={before()} newValue={after()} onStatsChange={(e) => stats.set(e.stats)} class="flex-1" />
```

## An overview ruler

`onScroll({ offset, contentSize, size })` は、[`Scroll`](./scroll.md) のキーと同じキーで、行の位置を通知します。`offset.y` は行がどこまでスクロールされているかです(行は縦にスクロールし、幅はビューと同じで、左右の側は独立して横にスクロールします。`offset.x` は 0 です)。`contentSize` はすべての行を合わせたサイズ、`size` はビューポートのサイズです。このコールバックは、ビューのレイアウトが完了すると一度呼ばれ、その後はこれらのいずれかが変わるたびに呼ばれます。行のスクロール時、ビューのリサイズ時、行の高さが変わったとき(別のテキスト、`layout`、`softWrap`、ファイルやセパレーターの展開や折りたたみ、アノテーションのレイアウト)です。`hunkBounds()` は、各変更が行のどこにあるかを返します(`DiffHunkBounds`: `{ index, bounds }`、`bounds` は最初の行の上端から最後の行の下端まで、その下のアノテーションを含み、ビューの全幅にわたります)。対象は表示されている変更で、折りたたまれたファイルの変更には行がありません。`onHunkBoundsChange({ hunkBounds })` は、ビューのレイアウト完了後に同じリストを一度通知し、その後は変更が移動したりサイズが変わったりするたびに(行の高さが変わらない場合、たとえば変更された1行が別の行に置き換わった場合も)通知します。ルーラーは、`onScroll` で読み取るのではなく、このリストからマークを描画します。`scrollOffset()` は行がどこまでスクロールされているかを読み取り、`setScrollOffset({ x, y })` は行を `y` まで即座にスクロールするため、ドラッグ中のサムは同じフレームでポインターに追従します。

これらを組み合わせると、コードエディターのように、ビューの横にオーバービューラーを作れます。変更ごとのマーク、表示範囲内の行を示すサム、押す操作やドラッグでそこへスクロールする機能です。ここではルーラーの高さはビューと同じです。

```rust tabs
use nsh_base::{DiffHunkBounds, DiffView, DiffViewApi, DiffViewEvent, diff_view, theme};
use nsh_core::prelude::*;

fn review(old: SharedString, new: SharedString) -> impl IntoElement {
    let diff = component_ref::<DiffView>();
    let ruler = element_ref();
    let ruler_top = stored(px(0.0));
    // How far the rows are scrolled, their height and the viewport's.
    let rows = signal((px(0.0), px(0.0), px(0.0)));
    let marks = signal(Vec::<DiffHunkBounds>::new());
    // Points of the rows per point of the ruler.
    let scale = move || {
        let (_, height, view) = rows.get();
        height.max(px(1.0)) / view.max(px(1.0))
    };
    // The thumb's middle at the pointer.
    let follow = move |page_y: Points| {
        let view = rows.get_untracked().2;
        let y = (page_y - ruler_top.get()) * scale() - view / 2.0;
        if let Some(api) = diff.api::<DiffViewApi>() {
            api.set_scroll_offset(point(px(0.0), y));
        }
    };
    view()
        .flex_1()
        .flex_row()
        .child(
            diff_view()
                .old_value(old)
                .new_value(new)
                .on_scroll(move |e: &DiffViewEvent| {
                    if let DiffViewEvent::Scroll(offset, content, size) = e {
                        rows.set((offset.y, content.height, size.height));
                    }
                })
                .on_hunk_bounds_change(move |list: &Vec<DiffHunkBounds>| marks.set(list.clone()))
                .component_ref(&diff)
                .flex_1(),
        )
        .child(
            view()
                .element_ref(&ruler)
                .w(px(12.0))
                .bg(move || theme().muted)
                .claim_touches(TouchClaim::on_start())
                .on_responder_grant(move |e: &ResponderEvent| {
                    let y = e.page.y;
                    spawn(async move {
                        ruler_top.replace(ruler.measure().await.map_or(px(0.0), |m| m.page.y));
                        follow(y);
                    });
                })
                .on_responder_move(move |e: &ResponderEvent| follow(e.page.y))
                .child(each(
                    marks,
                    |mark: &DiffHunkBounds| mark.index,
                    move |mark, _| {
                        view()
                            .absolute()
                            .left(px(0.0))
                            .right(px(0.0))
                            .bg(rgb(0xf59e0b))
                            .top(move || mark.get().bounds.origin.y / scale())
                            .h(move || (mark.get().bounds.size.height / scale()).max(px(2.0)))
                    },
                ))
                .child(
                    view()
                        .absolute()
                        .left(px(0.0))
                        .right(px(0.0))
                        .bg(move || theme().foreground.opacity(0.2))
                        .top(move || rows.get().0 / scale())
                        .h(move || rows.get().2 / scale()),
                ),
        )
}
```

```tsx tabs
import { Each, signal, View, type ViewRef } from "nsh";
import { DiffView, type DiffHunkBounds, type DiffViewRef } from "nsh/base";

let diff!: DiffViewRef;
let ruler!: ViewRef;
let rulerTop = 0;
const rows = signal({ y: 0, height: 0, view: 0 });
const marks = signal<DiffHunkBounds[]>([]);
// Points of the rows per point of the ruler.
const scale = () => Math.max(rows().height, 1) / Math.max(rows().view, 1);
// The thumb's middle at the pointer.
const follow = (pageY: number) => diff.setScrollOffset({ x: 0, y: (pageY - rulerTop) * scale() - rows().view / 2 });

<View class="flex-1 flex-row">
  <DiffView
    ref={diff}
    oldValue={before()}
    newValue={after()}
    onScroll={({ offset, contentSize, size }) => rows.set({ y: offset.y, height: contentSize.height, view: size.height })}
    onHunkBoundsChange={({ hunkBounds }) => marks.set(hunkBounds)}
    class="flex-1"
  />
  <View
    ref={ruler}
    class="w-3 bg-muted"
    onStartShouldSetResponder={() => true}
    onResponderGrant={async (e) => {
      const y = e.pageY;
      rulerTop = (await ruler.measure())?.pagePosition.y ?? 0;
      follow(y);
    }}
    onResponderMove={(e) => follow(e.pageY)}
  >
    <Each of={marks()}>
      {(mark) => (
        <View
          class="absolute inset-x-0 bg-amber-500"
          style={{ top: mark().bounds.origin.y / scale(), height: Math.max(mark().bounds.size.height / scale(), 2) }}
        />
      )}
    </Each>
    <View class="absolute inset-x-0 bg-foreground/20" style={{ top: rows().y / scale(), height: rows().view / scale() }} />
  </View>
</View>
```

マークの `index` は `hunks()` にある変更のものです。`oldLines` と `newLines` により、追加された変更(古い行なし)と削除された変更(新しい行なし)を区別でき、マークの色分けに使えます。

## Review comments

行番号は片側の行を選択します。押すと1行が選択され、Shift を押しながら押すとその行まで選択が拡張され、行番号の上をマウスでドラッグすると通過した行が選択されます。`onLineSelectionChange` は選択された行を `range` として通知し(`DiffLineRange`: `{ side, start, end }`、行は 0 から、選択なしは `null`)、行番号を押すと `onLineNumberPress({ line })` も通知されます(`{ side, line }`)。ref は選択を読み取り(`selectedLines()`、`selectedText()`)、設定できます。

`annotations` は、アプリのコンテンツを行の下に配置します。各 `{ id, side, line }` は `renderAnnotation` によってその行の側全体(unified の場合はビュー全体)にわたって描画され、レイアウトされた高さになり、その行が表示されている間は表示されます。`renderAddAnnotation` は、コメントを追加するためのアプリのコントロールで、ポインターが乗っている行と、最後に選択された行のガターの右側に表示されます。その行が選択された行の1つである場合は選択された行が、そうでなければその行が渡されます。

```tsx
type Comment = { id: string; side: "old" | "new"; line: number; text: string };
const comments = signal<Comment[]>([]);
const drafting = signal<DiffLineRange | null>(null);

<DiffView
  oldValue={before()}
  newValue={after()}
  annotations={comments().map(({ id, side, line }) => ({ id, side, line }))}
  renderAnnotation={(a) => (
    <View class="m-2 rounded-md border border-border bg-card p-2">
      <Text class="text-sm">{comments().find((c) => c.id === a.id)?.text}</Text>
    </View>
  )}
  renderAddAnnotation={(range) => (
    <Button onPress={() => drafting.set(range)} class="size-4 items-center justify-center rounded bg-primary">
      <Text class="text-xs text-primary-foreground">+</Text>
    </Button>
  )}
  class="flex-1"
/>
```
<a id="styling-the-parts"></a>

## パーツのスタイル

`class` と `style` はビューのボックスをスタイルします。`classes` はパーツごとの Tailwind クラスを、`styles` はパーツごとのインラインスタイルを受け取ります。パーツのクラスはそのパーツ自身のデフォルトスタイルの後に適用されるため優先され、その `styles` はクラスよりも優先されます。フォントは `fontFamily`、`fontSize`、`lineHeight` で設定します。

```tsx
<DiffView
  oldValue={before()}
  newValue={after()}
  language="py"
  fontSize={12}
  lineHeight={18}
  class="flex-1 rounded-lg border border-border"
  classes={{
    gutter: "bg-muted",
    lineAdded: "bg-blue-500/10",
    wordAdded: "bg-blue-500/30",
    indicatorAdded: "bg-blue-500",
    separator: "bg-transparent",
  }}
/>
```

| パーツ | 内容 | デフォルト |
|---|---|---|
| `side` | 各サイド(split)または単一のカラム(unified) | サイド間に `border` の線 |
| `gutter` | サイドの行番号とインジケーター | |
| `lineNumber` | すべての行番号 | 右揃え、`muted-foreground` |
| `lineNumberAdded` | 追加された行の番号。`lineNumber` の後に適用 | |
| `lineNumberDeleted` | 削除された行の番号。`lineNumber` の後に適用 | |
| `content` | サイドのテキスト。ガターの隣 | テキストの前後に 8pt |
| `line` | サイドのすべての行 | |
| `lineAdded` | 追加された行の行。`line` の後に適用 | 緑のティント |
| `lineDeleted` | 削除された行の行。`line` の後に適用 | 赤のティント |
| `filler` | 反対側にない行の隣にある、分割行の空の半分 | `muted` のかすかな塗り |
| `wordAdded` | 追加された行の中で変更された単語 | より濃い緑 |
| `wordDeleted` | 削除された行の中で変更された単語 | より濃い赤 |
| `indicatorAdded` | 追加された行のバー(`"bars"`)または `+`(`"classic"`) | 緑、幅 3pt |
| `indicatorDeleted` | 削除された行のバーまたは `−` | 赤、幅 3pt |
| `separator` | 折りたたまれた行のセパレーター、またはパッチのハンクヘッダー | `⋯` と、`muted` 上のカウント |
| `hunkActions` | 変更に対するアプリのアクションのボックス | 変更の右上 |
| `lineSelected` | 選択された行の、そのサイドの行の上 | テーマの選択色(`Editor` の選択と同じ) |
| `annotation` | アノテーションのボックス。その行の下 | その行のサイド全体 |
| `addAnnotation` | 追加コントロールのボックス。ガターの幅で、1 行分の高さ | 右側のコントロール |
| `fileHeader` | パッチ内のファイルのヘッダー | `secondary` 上のパスとカウント、その下に `border` の線 |

## Props

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `oldValue` | `.old_value(..)` | `string` | | 古いテキスト。 |
| `newValue` | `.new_value(..)` | `string` | | 新しいテキスト。 |
| `patch` | `.patch(..)` | `string` | | 1 つまたは複数ファイルの unified diff。`oldValue` と `newValue` が設定されていない場合に表示されます。 |
| `language` | `.language(..)` | `string` | プレーンテキスト(パッチの場合: 各ファイルのもの) | 言語の名前、エイリアス、拡張子、またはファイル名。 |
| `layout` | `.layout(..)` | `"split" \| "unified"` | `"split"` | 左右に並べて表示するか、1 カラムで表示するか。 |
| `inline` | `.inline(..)` | `"wordAlt" \| "word" \| "char" \| "none"` | `"wordAlt"` | 変更された行の中でハイライトする対象。 |
| `indicators` | `.indicators(..)` | `"bars" \| "classic" \| "none"` | `"bars"` | 変更された行を行番号の横でどのように示すか。 |
| `contextLines` | `.context_lines(..)` | `number` | `3` | 各変更の周囲に表示される変更のない行。 |
| `expandAll` | `.expand_all(..)` | `boolean` | `false` | 変更のない行をすべて表示します。 |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | 行番号。 |
| `background` | `.background(..)` | `boolean` | `true` | 変更された行に色を付けます。 |
| `fontFamily` | `.font_family(..)` | `string` | テーマの `font-mono` | テキストのフォント。 |
| `fontSize` | `.font_size(..)` | `number` | `13` | フォントサイズ(ポイント単位)。 |
| `lineHeight` | `.line_height(..)` | `number` | `20` | 行の高さ(ポイント単位)。 |
| `renderSeparator` | `.render_separator(..)` | `(separator: DiffSeparator) => JSX.Element` | | 折りたたまれた行のセパレーターを描画します。 |
| `renderHunkActions` | `.render_hunk_actions(..)` | `(hunk: DiffHunk) => JSX.Element` | | 各変更に対するアプリのアクション。 |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | 長い行をサイドの幅で折り返します。 |
| `annotations` | `.annotations(..)` | `DiffAnnotation[]` | `[]` | 行の下に表示するアプリのコンテンツ: `{ id, side, line }`。 |
| `renderAnnotation` | `.render_annotation(..)` | `(annotation: DiffAnnotation) => JSX.Element` | | アノテーションをその行の下に描画します。 |
| `renderAddAnnotation` | `.render_add_annotation(..)` | `(range: DiffLineRange) => JSX.Element` | | アノテーションを追加するアプリのコントロール。ホバー中の行と、最後に選択された行の横に表示されます。 |
| `renderFileHeader` | `.render_file_header(..)` | `(file: DiffFile) => JSX.Element` | | パッチ内の各ファイルのヘッダーを、1 行の高さで描画します。 |
| `classes` | `.classes(..)` | `DiffViewClasses` | `{}` | パーツごとの Tailwind クラス。 |
| `styles` | `.styles(..)` | `DiffViewStyles` | `{}` | クラスより優先される、パーツごとのインラインスタイル。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | | ビューのボックス。 |

## Events

| Event | Rust | 説明 |
|---|---|---|
| `onChange` | `.on_change(\|change: &DiffChange\| ..)` | 変更が保持または元に戻されました: `{ change }`、現在のテキスト(`{ oldValue, newValue }`)。 |
| `onLineNumberPress` | `.on_line_number_press(\|line: &DiffLine\| ..)` | 行番号が押されました: `{ line }`、`{ side, line }`。 |
| `onLineSelectionChange` | `.on_line_selection_change(\|range: &Option<DiffLineRange>\| ..)` | 選択された行が変更されました: `{ range }`、`{ side, start, end }` または `null`。 |
| `onStatsChange` | `.on_stats_change(\|stats: &DiffStats\| ..)` | カウントが変更されました: `{ stats }`、`{ added, deleted, hunks }`。ビューの作成時に一度発火し、その後テキストが diff されて別のカウントになるたびに再度発火します。"+8 −8 · 5 changes" のような行の表示に使えます。 |
| `onFileToggle` | `.on_file_toggle(\|file: &DiffFile\| ..)` | パッチのファイルが折りたたまれたか展開されました(そのヘッダー、または ref 経由): `{ file }`、現在の `DiffFile`。 |
| `onScroll` | `.on_scroll(\|e: &DiffViewEvent\| ..)` | 行がスクロールされたか、行またはビューポートのサイズが変更されました: `{ offset, contentSize, size }`、`Scroll` のもの(Rust では `DiffViewEvent::Scroll(offset, content_size, size)`)。ビューがレイアウトされたときに一度発火し、これらのいずれかが変わるたびに再度発火します。 |
| `onHunkBoundsChange` | `.on_hunk_bounds_change(\|bounds: &Vec<DiffHunkBounds>\| ..)` | 行の中での変更の位置が変わりました: `{ hunkBounds }`、`hunkBounds()` が返すリスト。ビューがレイアウトされたときに一度発火し、変更が移動したりサイズが変わったりするたびに(行の高さが保たれているかどうかにかかわらず)再度発火します。オーバービュールーラーのマークに使えます。 |

<a id="related"></a>

## 関連項目

- [Editor](./editor.md): `DiffView` が使用するシンタックスカラーと言語を提供するコードエディタ。
- [TextView](./text-view.md): Markdown や HTML のドキュメント。レビューの周囲に置くテキスト向け。
- [`nsh/base`](../modules/nsh-base.md): その他の基本コンポーネント。
