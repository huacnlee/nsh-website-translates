---
title: "List"
description: "仮想化されリサイクルを行うリスト:行、列、固定ヘッダー、チャット向けの反転リスト、可視状態の検出、アイテムへのスクロールについて説明します。"
order: 50
group: primitives
demo: el-list
source_hash: 6e5480c9dd9e1df4
---

# List

`List` は、長い、または上限のないデータを表示します。存在するのはビューポート付近の行だけで、ユーザーがスクロールすると、画面から出た行は新しく入ってくる行のために再利用されます。どの行が存在するか、その位置、列、スティッキーヘッダー、可視性（viewability）はすべてネイティブで計算されるため、数千項目のリストのスクロールも、20 項目のリストと同じコストで済みます。Rust では `virtual_list(count, |at| row)`、TSX では `nsh` の `<List>` で作成します。

```rust tabs
use nsh_core::prelude::*;

#[derive(Clone, PartialEq)]
struct Contact {
    id: usize,
    name: String,
}

fn app() -> impl IntoElement {
    let contacts = signal(
        (0..1000).map(|i| Contact { id: i, name: format!("Contact {}", i + 1) }).collect::<Vec<_>>(),
    );
    virtual_list(move || contacts.with(|c| c.len()), move |at| {
        view().h(px(56.0)).px_4().justify_center().child(
            text(move || contacts.with(|c| format!("{}. {}", at.index() + 1, c[at.index()].name)))
                .text_base(),
        )
    })
    .estimated_item_size(px(56.0))
    .flex_1()
}
```

```tsx tabs
import { List, mount, Text, View } from "nsh";

const contacts = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Contact ${i + 1}` }));

function App() {
  return (
    <List each={contacts} estimatedItemSize={56} style={{ flex: 1 }}>
      {(contact, index) => (
        <View style={{ height: 56, paddingHorizontal: 16, justifyContent: "center" }}>
          <Text style={{ fontSize: 16 }}>
            {index() + 1}. {contact().name}
          </Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

TSX では `List` はジェネリックです。`List<T>` は `each` と行関数でアイテムの型が一致していることを検査し、TypeScript はその型を `each` から推論します（[List API](../modules/nsh-list.md) を参照）。Rust では `virtual_list` が行数（値、シグナル、またはクロージャ。リストはその場で増減します）と、`Position` の行を構築する関数を受け取ります。行はコンポーネントのデータを `at.index()` で読み取ります。

すべての行が存在してよい短いリスト（設定ページやフォームなど）には、[スクロールビュー](./scroll.md)内の [`Each`](./control-flow.md) のほうが簡単です。グループ化されたテーブルのようなスタイルのリストについては、[設定画面スタイルのリスト](../docs/lists.md#a-settings-style-list)を参照してください。[リストガイド](../docs/lists.md)では、無限ローディング、チャット、セクションといったパターンを扱います。

<a id="rows-are-recycled"></a>

## 行はリサイクルされる

行関数は、アイテムごとではなくセルごとに一度だけ実行されます。セルが別のアイテムに再利用されると、その位置が変わり（TSX: `item()` と `index()` アクセサ、Rust: `at.index()`）、それを読み取るすべてのものが更新されます。

```rust tabs
virtual_list(move || messages.with(|m| m.len()), move |at| {
    text(move || messages.with(|m| m[at.index()].body.clone()))
})
```

```tsx tabs
<List each={messages()}>
  {(message) => <Text>{message().body}</Text>}
</List>
```

そのため、アイテムごとの状態は、行関数の中で作成したシグナルではなく、データの中（id をキーにして）に保持してください。そのようなシグナルはセルに残り続け、別のアイテムに表示されてしまいます。

次のアイテムを待っているセルは、その行がなくなるか別のセルに表示された時点で非表示になります。そのため、スクリーンリーダー、タッチ、UI テストからは各行が一度だけ見えます。

## Props

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | アイテム。 |
| `children` | `virtual_list(.., \|at\| row)` | `(item: () => T, index: () => number) => JSX.Element` | | 1 行を描画します。 |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | まだ計測されていないアイテムのサイズ（ポイント単位）。見積もりが近いほど、スクロールバーが安定します。 |
| `horizontal` | `.horizontal()` | `boolean` | `false` | 横方向にスクロールします。 |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`: リストは独自のスクロールビュー内でスクロールします。`"parent"`: 親のレイアウト内で全長のまま配置され、周囲のスクロールビューのビューポート付近の行を描画します。ページの他の部分と一緒にそのスクロールビューがスクロールします（[ページ内のリスト](../docs/lists.md#lists-in-a-page-viewportparent)を参照）。リストの作成時に選択します。 |
| `numColumns` | `.columns(n)` | `number` | `1` | 1 行あたりのアイテム数（縦方向のリスト）。 |
| `inverted` | `.inverted()` | `boolean` | `false` | 末尾から配置され、アイテム 0 が最後になります（チャット形式）。末尾までスクロールした状態で始まり、内容が変わっても末尾からの距離を保ちます。 |
| `maintainVisibleContentPosition` | `.follow_end(px(threshold))` | `{ autoscrollToBottomThreshold?: number }` | | 反転していないリスト向け: 内容の末尾にいるとき、または末尾からその点数以内にいるとき、内容が増えたりビューポートが縮んだりしても、リストは末尾に留まります。それより上にスクロールしている場合は、表示中の内容が維持されます。 |
| `stickyHeaderIndices` | `.sticky_header_indices([..])` | `number[]` | | 通り過ぎるまでスクロールされたとき、先頭に固定されるアイテム（1 列、反転なし）。 |
| `contentStyle` | `.content_padding(..)`, `.content_padding_x(..)`, `.row_gap(..)`, `.column_gap(..)`, … | `ListContentStyle` | | 内容のパディングとギャップ（ポイント単位）: `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `gap`, `rowGap`, `columnGap`。 |
| `contentClass` | | `string` | | 内容のパディングとギャップをクラスで指定します（`p-*`, `gap-*`）。`contentStyle` が優先されます。 |
| `header` | `.header(el)` | `ListSlot` | | アイテムの前に表示: コンポーネント（`Header`）または要素（`<Header />`）。 |
| `footer` | `.footer(el)` | `ListSlot` | | アイテムの後に表示します。 |
| `empty` | `.empty(el)` | `ListSlot` | | `each` が空の間、アイテムの代わりに表示されます。 |
| `separator` | `.separator(\|\| el)` | `ListSlot` | | アイテムの間に表示します（1 列）。 |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | 最初のフレームの前に、このアイテムまでスクロールします。 |
| `keyExtractor` | `.keys(\|\| ids)` | `(item: T, index: number) => string` | `item.key`、`item.id`、またはインデックス | 可視性トークンにおけるアイテムのキー。Rust では行の識別子で、前方で行が追加・削除されても、行がセルとサイズを保持します。 |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | 末尾が近づいています: さらに読み込みます。 |
| `loadMoreThreshold` | `.load_more_threshold(viewports)` | `number` | `1` | 末尾にどれだけ近づいたとき（ビューポート単位）に `onLoadMore` が発火するか。 |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | 先頭が近づいています（ユーザーまたはスクロールコマンドがリストを動かした後）: 最初のアイテムより前の内容を読み込みます。 |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(viewports)` | `number` | `1` | 先頭にどれだけ近づいたとき（ビューポート単位）に `onLoadMoreAtStart` が発火するか。 |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | アイテムが可視になった、または可視でなくなりました。 |
| `viewabilityConfig` | `.viewability(..)`, `.minimum_view_time(..)` | `ViewabilityConfig` | | アイテムがどのような場合に可視とみなされるか（下記）。 |
| `refreshing` | `.refreshing(..)` | `boolean` | | プルして更新のスピナーを表示します。 |
| `onRefresh` | `.on_refresh(..)` | `() => void` | | ユーザーがプルして更新しました。 |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | | アプリが独自のインジケーターを描画します。高さは `height` ポイントです。プラットフォームのスピナーは非表示になり、プルが `height` に達すると更新が行われ、更新中はコンテンツの上に `height` が確保されます。高さが 0 以下の場合は指定なしとして扱われます。 |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | | リストが先頭を越えてどれだけ引っ張られたかが渡されるアニメーション値です（静止時は 0、引っ張るほど増加。更新中にコンテンツの上に確保される余白は `height` と `refreshIndicator` の場合）。アプリ独自のインジケーター用です。 |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | スクロールインジケーターを表示します。プラットフォーム標準のもの、またはアプリがテーマを設定した後は、アプリの[組み込みバー](./scrollbar.md#built-in-bars)が使われます。オブジェクトを渡すと、そのビュー固有のテーマになります。デスクトップおよびデスクトップブラウザーでは、横方向のビューはこれを保持します。マウス用のスクロールバーだからです。 |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | スクロールオフセットが渡されるアニメーション値です。スクロール連動アニメーション用です。 |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(..)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | ドラッグでキーボードを閉じるかどうか。 |
| `style` | `Styled` メソッド | `StyleProp<ViewStyle>` | | リスト自身のスタイル（サイズに上限が必要です: `flex: 1` または高さ）。 |
| `testID` | `.test_id(id)` | `string` | | UI テストがリストのスクロールビューを見つけるための id（`nsh test` の `id:`、XCUITest、UI Automator）。 |
| `ref` | `.element_ref(&handle)` | `ListRef \| (node: ListRef) => void` | | リストの ref（[ref メソッド](#ref-methods)を参照）。 |

リストは、[`Scroll`](./scroll.md#scrolling) のスクロール用 props も受け取ります（Rust では `Scrollable` メソッド）: `pagingEnabled`、`snapToInterval`、`snapToOffsets`、`snapToAlignment`、`disableIntervalMomentum`、`decelerationRate`、`bounces`、`contentInset`、`contentOffset`、`keyboardShouldPersistTaps`、`scrollEventThrottle`、`scrollable`。リストはスケールを維持します。

すべての要素が受け取る props（[共通 props](./index.md#common-props)）は、そのままリストのスクロールビューに渡されます: `testID`、`accessibilityLabel` およびその他のアクセシビリティ props、スタイル、`onLayout`、タッチおよびレスポンダー props。UI テストは、他のビューと同様に `testID` でリストを見つけます。

`ViewabilityConfig`（Rust: `Viewability { item_visible_threshold, view_area_coverage_threshold }` と `.minimum_view_time(..)`）:

| フィールド | 型 | 説明 |
|---|---|---|
| `itemVisibleThreshold` | `number` | アイテムがどれだけ見えている必要があるか（0 から 1）。 |
| `viewAreaCoverageThreshold` | `number` | アイテムがビューポートのどれだけを覆っている必要があるか（0 から 1）。どちらのしきい値も指定しない場合は、1 ピクセルでも見えていれば可視とみなされます。 |
| `minimumViewTime` | `number` | アイテムが報告されるまでに、可視の状態を保つ必要があるミリ秒数。 |

`ViewToken<T>` は `{ item, key, index, isViewable }` です。Rust のリスナーは `ViewableItems` を受け取ります。`indices()` は可視な行の範囲、`changed()` は新たに可視になった、または可視でなくなった行です。

<a id="events"></a>

## イベント

| イベント | Rust | ペイロード | 発生タイミング |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | オフセットが変化したとき。 |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` | ドラッグが開始 / 終了したとき。 |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | 慣性スクロールが開始 / 終了したとき。 |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | スクロールが停止したとき。 |
| `onLoadMore` | `.on_load_more` | なし | 末尾から `loadMoreThreshold` ビューポート以内になったとき。 |
| `onLoadMoreAtStart` | `.on_load_more_at_start` | なし | 先頭から `loadMoreAtStartThreshold` ビューポート以内になったとき。スクロール後、接近ごとに一度。 |
| `onViewableItemsChange` | `.on_viewable_items_change` | `{ viewableItems, changed }`（`ViewableItems`） | 可視性が変化したとき。 |
| `onRefresh` | `.on_refresh` | なし | プルして更新されたとき。 |

<a id="ref-methods"></a>

## Ref メソッド

| メソッド | Rust | 説明 |
|---|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, percentage(0.5), px(0.0), animated)` | アイテム `index` が見えるようにスクロールします。`viewPosition` で配置を指定します: 0 はビューポートの先頭（デフォルト）、0.5 は中央、1 は末尾です。`viewOffset` でさらにずらせます。現在の（計測済み、または見積もりの）アイテムサイズを使ってネイティブで解決されます。 |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(px(..), animated)` | リストの軸方向のオフセットまでスクロールします。 |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | 内容の末尾（反転リストでは先頭）までスクロールします。 |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(..), animated)` | オフセットまでスクロールします。 |

<a id="examples"></a>

## 例

ヘッダーと可視性を備えたグリッド:

```rust tabs
let visible = signal(SharedString::default());
let list = element_ref();

virtual_list(move || photos.with(|p| p.len()), move |at| {
    image(move || photos.with(|p| p[at.index()].url.clone())).h(px(120.0)).rounded(px(8.0))
})
.element_ref(&list)
.columns(3)
.estimated_item_size(px(120.0))
.content_padding(px(12.0))
.row_gap(px(8.0))
.column_gap(px(8.0))
.viewability(Viewability { item_visible_threshold: Some(Percentage(0.5)), ..Viewability::default() })
.on_viewable_items_change(move |items: &ViewableItems| {
    visible.set(format!("{} visible", items.indices().count()).into())
})
.header(
    text("Jump to 60")
        .on_press(move || list.scroll_to_index(60, percentage(0.5), px(0.0), true)),
)
.flex_1()
```

```tsx tabs
const visible = signal("");
let list!: ListRef;

<List
  ref={list}
  each={photos}
  numColumns={3}
  estimatedItemSize={120}
  contentStyle={{ padding: 12, gap: 8 }}
  viewabilityConfig={{ itemVisibleThreshold: 0.5 }}
  onViewableItemsChange={({ viewableItems }) => visible.set(`${viewableItems.length} visible`)}
  header={<Text onPress={() => list.scrollToIndex({ index: 60, viewPosition: 0.5 })}>Jump to 60</Text>}
  style={{ flex: 1 }}
>
  {(photo) => <Image src={photo().url} style={{ height: 120, borderRadius: 8 }} />}
</List>;
```

チャット:

```rust tabs
virtual_list(move || messages.with(|m| m.len()), move |at| bubble(messages, at))
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .inverted()
    .estimated_item_size(px(64.0))
    .keyboard_dismiss_mode(KeyboardDismissMode::Interactive)
    .flex_1()
```

```tsx tabs
<List each={messages()} inverted estimatedItemSize={64} keyboardDismissMode="interactive" style={{ flex: 1 }}>
  {(m) => <Bubble message={m()} />}
</List>
```

アイテム 0 が最新のメッセージで、最下部に描画されます。アイテムの先頭に追加された新しいメッセージは、ユーザーが読んでいる内容を動かすことなく表示されます。

<a id="platform-notes"></a>

## プラットフォームに関する注意

- 表示中の行より上にアイテムを挿入しても、両プラットフォームで表示中の行は位置を保ちます。
- 右から左へのレイアウトでは、横方向のリストはネイティブでミラーリングされます。
- スティッキーヘッダーは、すべてのスクロールフレームでネイティブに固定されます。
